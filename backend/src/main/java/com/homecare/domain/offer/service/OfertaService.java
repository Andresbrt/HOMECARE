package com.homecare.domain.offer.service;

import com.homecare.common.event.NotificationEvent;
import com.homecare.dto.OfertaDTO;
import com.homecare.common.exception.BadRequestBusinessException;
import com.homecare.common.exception.ConflictBusinessException;
import com.homecare.common.exception.ForbiddenBusinessException;
import com.homecare.common.exception.NotFoundException;
import com.homecare.common.exception.UnauthorizedException;
import com.homecare.domain.offer.model.Oferta;
import com.homecare.domain.offer.model.Oferta.EstadoOferta;
import com.homecare.model.ServicioAceptado;
import com.homecare.domain.solicitud.model.Solicitud;
import com.homecare.domain.solicitud.model.Solicitud.EstadoSolicitud;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.offer.repository.OfertaRepository;
import com.homecare.domain.service_order.repository.ServicioAceptadoRepository;
import com.homecare.domain.solicitud.repository.SolicitudRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.domain.solicitud.service.SolicitudService;
import com.homecare.domain.ai.service.AIService;
import com.homecare.security.RequiereRol;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OfertaService {

    private final OfertaRepository ofertaRepository;
    private final SolicitudRepository solicitudRepository;
    private final ServicioAceptadoRepository servicioAceptadoRepository;
    private final UsuarioRepository usuarioRepository;
    private final SolicitudService solicitudService;
    private final ApplicationEventPublisher eventPublisher;
    private final AIService aiService;

    /**
     * Solo proveedores pueden enviar ofertas.
     * @RequiereRol intercepta la llamada vía AOP antes de ejecutar el método.
     */
    @Transactional
    @RequiereRol(value = "PROVEEDOR", mensaje = "Solo los proveedores de servicio pueden enviar ofertas")
    public OfertaDTO.Response enviarOferta(Long proveedorId, OfertaDTO.Crear request) {
        Usuario proveedor = usuarioRepository.findById(proveedorId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        // La validación por rol ya la hizo el aspecto — eliminamos la verificación manual duplicada

        Solicitud solicitud = solicitudRepository.findById(request.getSolicitudId())
                .orElseThrow(() -> new NotFoundException("Solicitud no encontrada"));

        if (!solicitud.puedeRecibirOfertas()) {
            throw new ConflictBusinessException("SOLICITUD_CERRADA", "Esta solicitud ya no acepta ofertas");
        }

        if (!Boolean.TRUE.equals(proveedor.getVerificado())) {
            throw new ForbiddenBusinessException("PROVEEDOR_NO_VERIFICADO", "Tu cuenta de proveedor no ha sido verificada. No puedes enviar ofertas hasta recibir la verificación.");
        }

        if (ofertaRepository.existsBySolicitudIdAndProveedorId(request.getSolicitudId(), proveedorId)) {
            throw new ConflictBusinessException("OFERTA_DUPLICADA", "Ya has enviado una oferta para esta solicitud");
        }

        if (request.getPrecioOfrecido().signum() <= 0) {
            throw new IllegalArgumentException("El precio ofrecido debe ser mayor a 0");
        }

        if (solicitud.getPrecioMaximo() != null &&
            request.getPrecioOfrecido().compareTo(solicitud.getPrecioMaximo()) > 0) {
            log.warn("Proveedor {} ofrece ${} pero precio máximo es ${}",
                    proveedorId, request.getPrecioOfrecido(), solicitud.getPrecioMaximo());
        }

        Oferta oferta = new Oferta();
        oferta.setSolicitud(solicitud);
        oferta.setProveedor(proveedor);
        oferta.setPrecioOfrecido(request.getPrecioOfrecido());
        oferta.setMensajeOferta(request.getMensajeOferta());
        oferta.setTiempoEstimadoHoras(request.getTiempoEstimadoHoras());
        oferta.setEstado(EstadoOferta.PENDIENTE);
        oferta.setVistaPorCliente(false);

        oferta = ofertaRepository.save(oferta);

        if (solicitud.getEstado().equals(EstadoSolicitud.ABIERTA)) {
            solicitudService.actualizarEstado(solicitud.getId(), EstadoSolicitud.EN_NEGOCIACION);
        }

        Map<String, String> data = new HashMap<>();
        data.put("tipo", "NUEVA_OFERTA");
        data.put("solicitudId", solicitud.getId().toString());
        data.put("action", "VER_OFERTA");

        NotificationEvent event = NotificationEvent.builder()
                .usuarioId(solicitud.getCliente().getId())
                .titulo("Nueva oferta recibida")
                .cuerpo("Proveedor " + proveedor.getNombre() + " ha enviado una oferta por $" + request.getPrecioOfrecido())
                .tipo("NUEVA_OFERTA")
                .data(data)
                .build();

        eventPublisher.publishEvent(event);

        log.info("Oferta enviada: {} por proveedor {} para solicitud {} - Precio: ${}",
                oferta.getId(), proveedorId, solicitud.getId(), request.getPrecioOfrecido());

        return mapToResponse(oferta);
    }

    @Transactional
    public OfertaDTO.Response actualizarOferta(Long ofertaId, Long proveedorId,
                                               OfertaDTO.Actualizar request) {
        Oferta oferta = ofertaRepository.findById(ofertaId)
                .orElseThrow(() -> new NotFoundException("Oferta no encontrada"));

        if (!oferta.getProveedor().getId().equals(proveedorId)) {
            throw new UnauthorizedException("No autorizado para modificar esta oferta");
        }

        if (!oferta.getEstado().equals(EstadoOferta.PENDIENTE)) {
            throw new ConflictBusinessException("OFERTA_NO_EDITABLE", "Solo se pueden modificar ofertas pendientes");
        }

        if (!oferta.getSolicitud().puedeRecibirOfertas()) {
            throw new ConflictBusinessException("SOLICITUD_NO_EDITABLE", "La solicitud ya no acepta modificaciones");
        }

        if (request.getPrecioOfrecido() != null) {
            oferta.setPrecioOfrecido(request.getPrecioOfrecido());
        }
        if (request.getMensajeOferta() != null) {
            oferta.setMensajeOferta(request.getMensajeOferta());
        }
        if (request.getTiempoEstimadoHoras() != null) {
            oferta.setTiempoEstimadoHoras(request.getTiempoEstimadoHoras());
        }

        oferta.setVistaPorCliente(false);
        oferta = ofertaRepository.save(oferta);

        log.info("Oferta {} actualizada por proveedor {}", ofertaId, proveedorId);

        return mapToResponse(oferta);
    }

    @Transactional
    public void retirarOferta(Long ofertaId, Long proveedorId) {
        Oferta oferta = ofertaRepository.findById(ofertaId)
                .orElseThrow(() -> new NotFoundException("Oferta no encontrada"));

        if (!oferta.getProveedor().getId().equals(proveedorId)) {
            throw new UnauthorizedException("No autorizado para retirar esta oferta");
        }

        if (!oferta.getEstado().equals(EstadoOferta.PENDIENTE)) {
            throw new ConflictBusinessException("OFERTA_NO_RETIRABLE", "Solo se pueden retirar ofertas pendientes");
        }

        oferta.setEstado(EstadoOferta.RETIRADA);
        ofertaRepository.save(oferta);

        log.info("Oferta {} retirada por proveedor {}", ofertaId, proveedorId);
    }

    @Transactional
    public OfertaDTO.AceptarResponse aceptarOferta(Long ofertaId, Long clienteId) {
        // SEGURIDAD CONCURRENCIA: bloqueo pesimista (SELECT FOR UPDATE) + @Version optimista en Oferta
        Oferta oferta = ofertaRepository.findByIdWithLock(ofertaId)
                .orElseThrow(() -> new NotFoundException("Oferta no encontrada"));

        // SEGURIDAD CONCURRENCIA: bloqueo pesimista (SELECT FOR UPDATE) en Solicitud
        // Previene que dos requests concurrentes acepten diferentes ofertas para la misma solicitud
        Solicitud solicitud = solicitudRepository.findByIdWithLock(oferta.getSolicitud().getId())
                .orElseThrow(() -> new NotFoundException("Solicitud no encontrada"));

        if (!solicitud.getCliente().getId().equals(clienteId)) {
            throw new UnauthorizedException("No autorizado para aceptar esta oferta");
        }

        if (!oferta.getEstado().equals(EstadoOferta.PENDIENTE)) {
            throw new ConflictBusinessException("OFERTA_NO_DISPONIBLE", "Esta oferta ya no está disponible");
        }

        if (!solicitud.puedeRecibirOfertas()) {
            throw new ConflictBusinessException("SOLICITUD_CERRADA", "Esta solicitud ya no acepta ofertas");
        }

        oferta.setEstado(EstadoOferta.ACEPTADA);
        oferta.setAceptadaAt(LocalDateTime.now());
        ofertaRepository.save(oferta);

        solicitud.setOfertaAceptadaId(oferta.getId());
        solicitudRepository.save(solicitud);

        List<Oferta> otrasOfertas = ofertaRepository.findBySolicitudIdAndEstado(
                solicitud.getId(), EstadoOferta.PENDIENTE
        );
        for (Oferta otra : otrasOfertas) {
            otra.setEstado(EstadoOferta.RECHAZADA);
            ofertaRepository.save(otra);
        }

        solicitudService.actualizarEstado(solicitud.getId(), EstadoSolicitud.ACEPTADA);

        ServicioAceptado servicio = new ServicioAceptado();
        servicio.setOferta(oferta);
        servicio.setSolicitud(solicitud);
        servicio.setProveedor(oferta.getProveedor());
        servicio.setCliente(solicitud.getCliente());
        servicio.setPrecioAcordado(oferta.getPrecioOfrecido());
        servicio.setEstado(ServicioAceptado.EstadoServicio.CONFIRMADO);
        servicio = servicioAceptadoRepository.save(servicio);

        Map<String, String> notifData = new HashMap<>();
        notifData.put("servicioId", String.valueOf(servicio.getId()));
        notifData.put("solicitudId", String.valueOf(solicitud.getId()));
        notifData.put("clienteNombre", solicitud.getCliente().getNombre());
        notifData.put("direccion", solicitud.getDireccion() != null ? solicitud.getDireccion() : "Medellín");
        notifData.put("precio", String.valueOf(oferta.getPrecioOfrecido()));
        notifData.put("tipo", "OFERTA_ACEPTADA");
        notifData.put("click_action", "OPEN_ACTIVE_SERVICE");
        notifData.put("screen", "ActiveServiceTracking");

        eventPublisher.publishEvent(NotificationEvent.builder()
                .usuarioId(oferta.getProveedor().getId())
                .titulo("¡Tu oferta ha sido aceptada! 🎉")
                .cuerpo("El cliente " + solicitud.getCliente().getNombre() + " ha aceptado tu oferta para " + solicitud.getTitulo())
                .tipo("OFERTA_ACEPTADA")
                .data(notifData)
                .build());

        aiService.registrarFeedbackPrecio(oferta);

        log.info("Oferta {} aceptada por cliente {}. Servicio {} creado",
                ofertaId, clienteId, servicio.getId());

        return OfertaDTO.AceptarResponse.builder()
                .ofertaId(oferta.getId())
                .solicitudId(servicio.getId())
                .proveedorId(oferta.getProveedor().getId())
                .proveedorNombre(oferta.getProveedor().getNombre())
                .precioFinal(oferta.getPrecioOfrecido())
                .mensaje("Oferta aceptada exitosamente")
                .build();
    }

    @Transactional
    public List<OfertaDTO.Response> obtenerOfertasPorSolicitud(Long solicitudId, Long clienteId) {
        Solicitud solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new NotFoundException("Solicitud no encontrada"));

        if (!solicitud.getCliente().getId().equals(clienteId)) {
            throw new UnauthorizedException("No autorizado para ver ofertas de esta solicitud");
        }

        List<Oferta> ofertas = ofertaRepository.findBySolicitudIdOrderByPrecioOfrecidoAsc(solicitudId);

        ofertas.stream()
                .filter(o -> !o.getVistaPorCliente() && o.getEstado().equals(EstadoOferta.PENDIENTE))
                .forEach(o -> {
                    o.setVistaPorCliente(true);
                    ofertaRepository.save(o);
                });

        return ofertas.stream()
                .map(this::mapToDetailResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OfertaDTO.Response> obtenerMisOfertas(Long proveedorId, EstadoOferta estado) {
        List<Oferta> ofertas;

        if (estado != null) {
            ofertas = ofertaRepository.findByProveedorIdAndEstadoOrderByCreatedAtDesc(proveedorId, estado);
        } else {
            ofertas = ofertaRepository.findByProveedorIdOrderByCreatedAtDesc(proveedorId);
        }

        return ofertas.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OfertaDTO.Response obtenerOferta(Long ofertaId, Long usuarioId) {
        Oferta oferta = ofertaRepository.findById(ofertaId)
                .orElseThrow(() -> new NotFoundException("Oferta no encontrada"));

        boolean esCliente = oferta.getSolicitud().getCliente().getId().equals(usuarioId);
        boolean esProveedor = oferta.getProveedor().getId().equals(usuarioId);

        if (!esCliente && !esProveedor) {
            throw new UnauthorizedException("No autorizado para ver esta oferta");
        }

        return mapToDetailResponse(oferta);
    }

    private OfertaDTO.Response mapToResponse(Oferta oferta) {
        return OfertaDTO.Response.builder()
                .id(oferta.getId())
                .solicitudId(oferta.getSolicitud().getId())
                .proveedorId(oferta.getProveedor().getId())
                .proveedorNombre(oferta.getProveedor().getNombre())
                .proveedorFoto(oferta.getProveedor().getFotoPerfil())
                .proveedorCalificacion(oferta.getProveedor().getCalificacionPromedio())
                .proveedorServiciosCompletados(oferta.getProveedor().getTotalServiciosCompletados())
                .precioOfrecido(oferta.getPrecioOfrecido())
                .mensajeOferta(oferta.getMensajeOferta())
                .tiempoLlegadaMinutos(oferta.getTiempoLlegadaMinutos())
                .materialesIncluidos(oferta.getMaterialesIncluidos())
                .estado(oferta.getEstado().name())
                .vistaPorCliente(oferta.getVistaPorCliente())
                .createdAt(oferta.getCreatedAt() != null ? oferta.getCreatedAt().toString() : java.time.LocalDateTime.now().toString())
                .distanciaKm(null)
                .build();
    }

    private OfertaDTO.Response mapToDetailResponse(Oferta oferta) {
        return mapToResponse(oferta);
    }
}

