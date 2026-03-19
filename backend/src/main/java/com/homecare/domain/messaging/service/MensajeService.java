package com.homecare.domain.messaging.service;

import com.homecare.dto.MensajeDTO;
import com.homecare.common.exception.NotFoundException;
import com.homecare.common.exception.UnauthorizedException;
import com.homecare.model.Mensaje;
import com.homecare.domain.offer.model.Oferta;
import com.homecare.domain.solicitud.model.Solicitud;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.messaging.repository.MensajeRepository;
import com.homecare.domain.solicitud.repository.SolicitudRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.domain.common.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MensajeService {

    private final MensajeRepository mensajeRepository;
    private final SolicitudRepository solicitudRepository;
    private final UsuarioRepository usuarioRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    @Transactional
        @Caching(evict = {
            @CacheEvict(cacheNames = "unreadMessages", key = "#request.destinatarioId"),
            @CacheEvict(cacheNames = "unreadMessagesByRequest", key = "#request.solicitudId + ':' + #request.destinatarioId"),
            @CacheEvict(cacheNames = "conversationList", key = "#remitenteId"),
            @CacheEvict(cacheNames = "conversationList", key = "#request.destinatarioId")
        })
    public MensajeDTO.Response enviarMensaje(Long remitenteId, MensajeDTO.Enviar request) {
        Usuario remitente = usuarioRepository.findById(remitenteId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        Solicitud solicitud = solicitudRepository.findById(request.getSolicitudId())
                .orElseThrow(() -> new NotFoundException("Solicitud no encontrada"));

        boolean esCliente = solicitud.getCliente().getId().equals(remitenteId);
        boolean tieneOferta = solicitud.getOfertas().stream()
                .anyMatch(o -> o.getProveedor().getId().equals(remitenteId));

        if (!esCliente && !tieneOferta) {
            throw new UnauthorizedException("No autorizado para enviar mensajes en esta solicitud");
        }

        Usuario destinatario = usuarioRepository.findById(request.getDestinatarioId())
                .orElseThrow(() -> new NotFoundException("Destinatario no encontrado"));

        Mensaje mensaje = new Mensaje();
        mensaje.setSolicitud(solicitud);
        mensaje.setRemitente(remitente);
        mensaje.setDestinatario(destinatario);
        mensaje.setContenido(request.getContenido());
        
        // Convertir string a enum TipoMensaje
        if (request.getTipoMensaje() != null) {
            try {
                mensaje.setTipo(Mensaje.TipoMensaje.valueOf(request.getTipoMensaje().toUpperCase()));
            } catch (IllegalArgumentException e) {
                mensaje.setTipo(Mensaje.TipoMensaje.TEXTO);
            }
        } else {
            mensaje.setTipo(Mensaje.TipoMensaje.TEXTO);
        }
        
        mensaje.setArchivoUrl(request.getArchivoUrl());
        mensaje.setLeido(false);

        mensaje = mensajeRepository.save(mensaje);

        MensajeDTO.Response response = mapToResponse(mensaje);

        enviarViaWebSocket(response);

        notificationService.notificarNuevoMensaje(
                solicitud.getId(),
                destinatario.getId(),
                remitente.getNombre(),
                request.getContenido()
        );

        log.info("Mensaje enviado: {} de {} a {} en solicitud {}",
                mensaje.getId(), remitenteId, request.getDestinatarioId(), solicitud.getId());

        return response;
    }

    public List<MensajeDTO.Response> obtenerMensajes(Long solicitudId, Long usuarioId) {
        Solicitud solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new NotFoundException("Solicitud no encontrada"));

        boolean esCliente = solicitud.getCliente().getId().equals(usuarioId);
        boolean tieneOferta = solicitud.getOfertas().stream()
                .anyMatch(o -> o.getProveedor().getId().equals(usuarioId));

        if (!esCliente && !tieneOferta) {
            throw new UnauthorizedException("No autorizado para ver mensajes de esta solicitud");
        }

        List<Mensaje> mensajes = mensajeRepository.findBySolicitudIdOrderByCreatedAtAsc(solicitudId);
        return mensajes.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
        @Caching(evict = {
            @CacheEvict(cacheNames = "unreadMessages", key = "#usuarioId"),
            @CacheEvict(cacheNames = "unreadMessagesByRequest", allEntries = true),
            @CacheEvict(cacheNames = "conversationList", key = "#usuarioId")
        })
    public void marcarComoLeido(Long mensajeId, Long usuarioId) {
        Mensaje mensaje = mensajeRepository.findById(mensajeId)
                .orElseThrow(() -> new NotFoundException("Mensaje no encontrado"));

        if (!mensaje.getDestinatario().getId().equals(usuarioId)) {
            throw new UnauthorizedException("No autorizado para marcar este mensaje");
        }

        mensaje.setLeido(true);
        mensaje.setLeidoAt(LocalDateTime.now());
        mensajeRepository.save(mensaje);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = "unreadMessages", key = "#usuarioId"),
            @CacheEvict(cacheNames = "unreadMessagesByRequest", key = "#solicitudId + ':' + #usuarioId"),
            @CacheEvict(cacheNames = "conversationList", key = "#usuarioId")
    })
    public void marcarTodosComoLeidos(Long solicitudId, Long usuarioId) {
        mensajeRepository.marcarTodosLeidosPorDestinatario(solicitudId, usuarioId);
        log.info("Mensajes marcados como leÃ­dos para usuario {} en solicitud {}", usuarioId, solicitudId);
    }

    @Cacheable(cacheNames = "unreadMessages", key = "#usuarioId")
    public Long contarNoLeidos(Long usuarioId) {
        return mensajeRepository.countByDestinatarioIdAndLeido(usuarioId, false);
    }

    private void enviarViaWebSocket(MensajeDTO.Response mensaje) {
        try {
            messagingTemplate.convertAndSendToUser(
                    mensaje.getDestinatarioId().toString(),
                    "/topic/chat/" + mensaje.getSolicitudId(),
                    mensaje
            );
            log.debug("Mensaje enviado via WebSocket: {}", mensaje.getId());
        } catch (Exception e) {
            log.error("Error al enviar mensaje via WebSocket: {}", e.getMessage());
        }
    }

    /**
     * Obtener lista de conversaciones del usuario
     */
    @Cacheable(cacheNames = "conversationList", key = "#usuarioId")
    public List<MensajeDTO.Conversacion> obtenerConversaciones(Long usuarioId) {
        // Obtener todas las solicitudes donde el usuario ha enviado o recibido mensajes
        List<Solicitud> solicitudesConMensajes = mensajeRepository.findSolicitudesConMensajes(usuarioId);
        
        return solicitudesConMensajes.stream().map(solicitud -> {
            // Determinar el interlocutor (cliente o proveedor dependiendo del usuario)
            Usuario interlocutor = solicitud.getCliente().getId().equals(usuarioId) 
                ? obtenerProveedorPrincipal(solicitud) 
                : solicitud.getCliente();
            
            // Obtener Ãºltimo mensaje de la conversaciÃ³n
            Mensaje ultimoMensaje = mensajeRepository.findTopBySolicitudIdOrderByCreatedAtDesc(solicitud.getId())
                .orElse(null);
            
            // Contar mensajes no leÃ­dos
            long noLeidos = mensajeRepository.countBySolicitudIdAndDestinatarioIdAndLeido(
                solicitud.getId(), usuarioId, false);
            
            return MensajeDTO.Conversacion.builder()
                .solicitudId(solicitud.getId())
                .tituloSolicitud(solicitud.getTitulo())
                .interlocutorId(interlocutor.getId())
                .interlocutorNombre(interlocutor.getNombre())
                .interlocutorFoto(interlocutor.getFotoPerfil())
                .ultimoMensaje(ultimoMensaje != null ? ultimoMensaje.getContenido() : "")
                .ultimoMensajeFecha(ultimoMensaje != null ? ultimoMensaje.getCreatedAt().toString() : "")
                .mensajesNoLeidos((int) noLeidos)
                .usuarioEscribiendo(false)
                .build();
        }).collect(Collectors.toList());
    }

    /**
     * Contar mensajes no leÃ­dos por solicitud
     */
    @Cacheable(cacheNames = "unreadMessagesByRequest", key = "#solicitudId + ':' + #usuarioId")
    public Long contarNoLeidosPorSolicitud(Long solicitudId, Long usuarioId) {
        return mensajeRepository.countBySolicitudIdAndDestinatarioIdAndLeido(solicitudId, usuarioId, false);
    }

    /**
     * Notificar que el usuario estÃ¡ escribiendo
     */
    public void notificarEscribiendo(Long solicitudId, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        
        MensajeDTO.TypingIndicator indicator = MensajeDTO.TypingIndicator.builder()
                .solicitudId(solicitudId)
                .usuarioId(usuarioId)
                .usuarioNombre(usuario.getNombre())
                .escribiendo(true)
                .build();
        
        enviarIndicadorEscribiendoViaWebSocket(solicitudId, indicator);
    }

    /**
     * Enviar indicador de escritura por WebSocket
     */
    public void enviarIndicadorEscribiendo(Long solicitudId, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        
        MensajeDTO.TypingIndicator indicator = MensajeDTO.TypingIndicator.builder()
                .solicitudId(solicitudId)
                .usuarioId(usuarioId)
                .usuarioNombre(usuario.getNombre())
                .escribiendo(true)
                .build();
        
        try {
            messagingTemplate.convertAndSend("/topic/typing/" + solicitudId, indicator);
            log.debug("Indicador de escritura enviado para solicitud {}", solicitudId);
        } catch (Exception e) {
            log.error("Error al enviar indicador de escritura: {}", e.getMessage());
        }
    }

    private void enviarIndicadorEscribiendoViaWebSocket(Long solicitudId, MensajeDTO.TypingIndicator indicator) {
        try {
            messagingTemplate.convertAndSend("/topic/typing/" + solicitudId, indicator);
            log.debug("Indicador de escritura enviado via WebSocket para solicitud {}", solicitudId);
        } catch (Exception e) {
            log.error("Error al enviar indicador via WebSocket: {}", e.getMessage());
        }
    }

    private Usuario obtenerProveedorPrincipal(Solicitud solicitud) {
        // Obtener el proveedor de la oferta aceptada o el primer proveedor con mensajes
        return solicitud.getOfertas().stream()
                .filter(o -> o.getEstado() == Oferta.EstadoOferta.ACEPTADA)
                .map(o -> o.getProveedor())
                .findFirst()
                .orElseGet(() -> solicitud.getOfertas().stream()
                        .map(o -> o.getProveedor())
                        .findFirst()
                        .orElse(null));
    }

    private MensajeDTO.Response mapToResponse(Mensaje mensaje) {
        return new MensajeDTO.Response(
                mensaje.getId(),
                mensaje.getSolicitud().getId(),
                mensaje.getRemitente().getId(),
                mensaje.getRemitente().getNombre(),
                mensaje.getRemitente().getFotoPerfil(),
                mensaje.getDestinatario().getId(),
                mensaje.getDestinatario().getNombre(),
                mensaje.getDestinatario().getFotoPerfil(),
                mensaje.getContenido(),
                mensaje.getTipo().name(),
                mensaje.getArchivoUrl(),
                mensaje.getLeido(),
                mensaje.getLeidoAt() != null ? mensaje.getLeidoAt().toString() : null,
                mensaje.getCreatedAt().toString()
        );
    }
}

