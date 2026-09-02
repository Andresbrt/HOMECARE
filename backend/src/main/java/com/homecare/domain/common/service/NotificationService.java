package com.homecare.domain.common.service;

import com.homecare.dto.NotificationDTO;
import com.homecare.common.exception.NotificationException;
import com.homecare.model.DispositivoFCM;
import com.homecare.model.Notificacion;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.common.repository.DispositivoFCMRepository;
import com.homecare.domain.common.repository.NotificacionRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class NotificationService {

    private final DispositivoFCMRepository dispositivoRepository;
    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;

    public NotificationService(DispositivoFCMRepository dispositivoRepository,
                               NotificacionRepository notificacionRepository,
                               UsuarioRepository usuarioRepository) {
        this.dispositivoRepository = dispositivoRepository;
        this.notificacionRepository = notificacionRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public void registrarDispositivo(Long usuarioId, NotificationDTO.RegisterDevice request) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotificationException("Usuario no encontrado"));

        Optional<DispositivoFCM> existente = dispositivoRepository.findByTokenFcm(request.getTokenFcm());

        if (existente.isPresent()) {
            DispositivoFCM dispositivo = existente.get();
            dispositivo.setUsuario(usuario);
            dispositivo.setPlataforma(request.getPlataforma());
            dispositivo.setModeloDispositivo(request.getModeloDispositivo());
            dispositivo.setVersionApp(request.getVersionApp());
            dispositivo.setActivo(true);
            dispositivo.setUltimoUso(LocalDateTime.now());
            dispositivoRepository.save(dispositivo);
            log.info("Dispositivo actualizado para usuario {}", usuarioId);
        } else {
            DispositivoFCM nuevoDispositivo = new DispositivoFCM();
            nuevoDispositivo.setUsuario(usuario);
            nuevoDispositivo.setTokenFcm(request.getTokenFcm());
            nuevoDispositivo.setPlataforma(request.getPlataforma());
            nuevoDispositivo.setModeloDispositivo(request.getModeloDispositivo());
            nuevoDispositivo.setVersionApp(request.getVersionApp());
            nuevoDispositivo.setActivo(true);
            dispositivoRepository.save(nuevoDispositivo);
            log.info("Nuevo dispositivo registrado para usuario {}", usuarioId);
        }
    }

    @Transactional
    public void desregistrarDispositivo(String token) {
        dispositivoRepository.desactivarPorToken(token);
        log.info("Dispositivo desactivado: {}", token);
    }

    @Async
    @Transactional
    public void enviarNotificacion(Long usuarioId, String titulo, String cuerpo,
                                    Map<String, String> data, String imageUrl) {
        try {
            guardarNotificacionBD(usuarioId, titulo, cuerpo, data);
            log.info("Notificación registrada para usuario {}: {} - {}", usuarioId, titulo, cuerpo);
        } catch (Exception e) {
            log.error("Error al registrar notificación para usuario {}: {}", usuarioId, e.getMessage(), e);
        }
    }

    @Async
    @Transactional
    public NotificationDTO.Response enviarNotificacionBroadcast(String titulo, String cuerpo,
                                                                 Map<String, String> data,
                                                                 String imageUrl, String rol) {
        try {
            List<DispositivoFCM> dispositivos;

            if ("ALL".equals(rol)) {
                dispositivos = dispositivoRepository.findAll().stream()
                        .filter(DispositivoFCM::getActivo)
                        .collect(Collectors.toList());
            } else {
                dispositivos = dispositivoRepository.findByRol("ROLE_" + rol);
            }

            if (dispositivos.isEmpty()) {
                return new NotificationDTO.Response(false, "No hay dispositivos registrados", 0, 0);
            }

            dispositivos.forEach(d -> guardarNotificacionBD(
                    d.getUsuario().getId(), titulo, cuerpo, data));

            return new NotificationDTO.Response(true, "Notificación guardada en BD", dispositivos.size(), 0);

        } catch (Exception e) {
            log.error("Error en broadcast: {}", e.getMessage(), e);
            return new NotificationDTO.Response(false, "Error: " + e.getMessage(), 0, 0);
        }
    }

    public void notificarNuevaOferta(Long solicitudId, Long clienteId, String proveedorNombre, Double precio) {
        Map<String, String> data = new HashMap<>();
        data.put("tipo", "NUEVA_OFERTA");
        data.put("solicitudId", solicitudId.toString());
        data.put("action", "VER_OFERTAS");

        enviarNotificacion(
                clienteId,
                "Nueva oferta recibida",
                proveedorNombre + " ha enviado una oferta de $" + precio,
                data,
                null
        );
    }

    public void sendPasswordResetEmail(String email, String token) {
        log.info("Envío de email de recuperación para {}: {}", email, token);
    }

    public void notificarOfertaAceptada(Long ofertaId, Long proveedorId, String clienteNombre) {
        Map<String, String> data = new HashMap<>();
        data.put("tipo", "OFERTA_ACEPTADA");
        data.put("ofertaId", ofertaId.toString());
        data.put("action", "VER_SERVICIO");

        enviarNotificacion(
                proveedorId,
                "¡Tu oferta fue aceptada!",
                clienteNombre + " aceptó tu oferta. Prepárate para el servicio.",
                data,
                null
        );
    }

    public void notificarCambioEstadoServicio(Long servicioId, Long usuarioId, String estado) {
        Map<String, String> data = new HashMap<>();
        data.put("tipo", "CAMBIO_ESTADO");
        data.put("servicioId", servicioId.toString());
        data.put("estado", estado);
        data.put("action", "VER_SERVICIO");

        String mensaje = switch (estado) {
            case "EN_CAMINO" -> "El proveedor está en camino";
            case "LLEGUE" -> "El proveedor ha llegado";
            case "EN_PROGRESO" -> "El servicio ha comenzado";
            case "COMPLETADO" -> "El servicio ha finalizado";
            default -> "Estado del servicio actualizado";
        };

        enviarNotificacion(usuarioId, "Actualización del servicio", mensaje, data, null);
    }

    public void notificarNuevoMensaje(Long solicitudId, Long destinatarioId, String remitenteNombre, String mensaje) {
        Map<String, String> data = new HashMap<>();
        data.put("tipo", "NUEVO_MENSAJE");
        data.put("solicitudId", solicitudId.toString());
        data.put("action", "ABRIR_CHAT");

        enviarNotificacion(
                destinatarioId,
                "Nuevo mensaje de " + remitenteNombre,
                mensaje.length() > 50 ? mensaje.substring(0, 50) + "..." : mensaje,
                data,
                null
        );
    }

    public void notificarPagoExitoso(Long pagoId, Long usuarioId, Double monto) {
        Map<String, String> data = new HashMap<>();
        data.put("tipo", "PAGO_EXITOSO");
        data.put("pagoId", pagoId.toString());
        data.put("action", "VER_PAGO");

        enviarNotificacion(
                usuarioId,
                "Pago procesado",
                "Tu pago de $" + monto + " ha sido procesado exitosamente",
                data,
                null
        );
    }

    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void limpiarDispositivosInactivos() {
        LocalDateTime fechaLimite = LocalDateTime.now().minusDays(90);
        List<DispositivoFCM> inactivos = dispositivoRepository.findDispositivosInactivos(fechaLimite);

        inactivos.forEach(d -> d.setActivo(false));
        dispositivoRepository.saveAll(inactivos);

        log.info("Dispositivos inactivos limpiados: {}", inactivos.size());
    }

    private void guardarNotificacionBD(Long usuarioId, String titulo, String mensaje,
                                        Map<String, String> data) {
        try {
            Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
            if (usuario == null) return;

            Notificacion notificacion = new Notificacion();
            notificacion.setUsuario(usuario);
            notificacion.setTitulo(titulo);
            notificacion.setMensaje(mensaje);
            notificacion.setTipo(data != null ? data.get("tipo") : "GENERAL");
            notificacion.setLeida(false);

            notificacionRepository.save(notificacion);
        } catch (Exception e) {
            log.error("Error al guardar notificación en BD: {}", e.getMessage());
        }
    }
}
