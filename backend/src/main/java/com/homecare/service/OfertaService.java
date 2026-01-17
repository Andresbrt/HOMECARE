package com.homecare.service;

import com.homecare.dto.OfertaDTO;
import com.homecare.exception.NotFoundException;
import com.homecare.exception.UnauthorizedException;
import com.homecare.model.Oferta;
import com.homecare.model.Oferta.EstadoOferta;
import com.homecare.model.ServicioAceptado;
import com.homecare.model.Solicitud;
import com.homecare.model.Solicitud.EstadoSolicitud;
import com.homecare.model.Usuario;
import com.homecare.repository.OfertaRepository;
import com.homecare.repository.ServicioAceptadoRepository;
import com.homecare.repository.SolicitudRepository;
import com.homecare.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
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
    private final NotificationService notificationService;

    @Transactional
    public OfertaDTO.Response enviarOferta(Long proveedorId, OfertaDTO.Crear request) {
        Usuario proveedor = usuarioRepository.findById(proveedorId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        if (!proveedor.getRoles().stream().anyMatch(r -> r.getNombre().equals("ROLE_SERVICE_PROVIDER"))) {
            throw new UnauthorizedException("Solo los proveedores pueden enviar ofertas");
        }

        Solicitud solicitud = solicitudRepository.findById(request.getSolicitudId())
                .orElseThrow(() -> new NotFoundException("Solicitud no encontrada"));

        if (!solicitud.puedeRecibirOfertas()) {
            throw new IllegalStateException("Esta solicitud ya no acepta ofertas");
        }

        if (ofertaRepository.existsBySolicitudIdAndProveedorId(request.getSolicitudId(), proveedorId)) {
            throw new IllegalStateException("Ya has enviado una oferta para esta solicitud");
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

        notificationService.notificarNuevaOferta(
                solicitud.getId(),
                solicitud.getCliente().getId(),
                proveedor.getNombre(),
                request.getPrecioOfrecido().doubleValue()
        );

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
            throw new IllegalStateException("Solo se pueden modificar ofertas pendientes");
        }

        if (!oferta.getSolicitud().puedeRecibirOfertas()) {
            throw new IllegalStateException("La solicitud ya no acepta modificaciones");
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
            throw new IllegalStateException("Solo se pueden retirar ofertas pendientes");
        }

        oferta.setEstado(EstadoOferta.RETIRADA);
        ofertaRepository.save(oferta);

        log.info("Oferta {} retirada por proveedor {}", ofertaId, proveedorId);
    }

    @Transactional
    public OfertaDTO.AceptarResponse aceptarOferta(Long ofertaId, Long clienteId) {
        Oferta oferta = ofertaRepository.findById(ofertaId)
                .orElseThrow(() -> new NotFoundException("Oferta no encontrada"));

        Solicitud solicitud = oferta.getSolicitud();

        if (!solicitud.getCliente().getId().equals(clienteId)) {
            throw new UnauthorizedException("No autorizado para aceptar esta oferta");
        }

        if (!oferta.getEstado().equals(EstadoOferta.PENDIENTE)) {
            throw new IllegalStateException("Esta oferta ya no está disponible");
        }

        if (!solicitud.puedeRecibirOfertas()) {
            throw new IllegalStateException("Esta solicitud ya no acepta ofertas");
        }

        oferta.setEstado(EstadoOferta.ACEPTADA);
        oferta.setAceptadaAt(LocalDateTime.now());
        ofertaRepository.save(oferta);

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

        notificationService.notificarOfertaAceptada(
                oferta.getId(),
                oferta.getProveedor().getId(),
                solicitud.getCliente().getNombre()
        );

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
                .createdAt(oferta.getCreatedAt().toString())
                .distanciaKm(null)
                .build();
    }

    private OfertaDTO.Response mapToDetailResponse(Oferta oferta) {
        return mapToResponse(oferta);
    }
}
