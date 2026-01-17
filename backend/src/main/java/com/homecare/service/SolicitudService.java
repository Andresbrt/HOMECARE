package com.homecare.service;

import com.homecare.dto.SolicitudDTO;
import com.homecare.exception.NotFoundException;
import com.homecare.exception.UnauthorizedException;
import com.homecare.model.Solicitud;
import com.homecare.model.Solicitud.EstadoSolicitud;
import com.homecare.model.Solicitud.TipoLimpieza;
import com.homecare.model.Usuario;
import com.homecare.repository.SolicitudRepository;
import com.homecare.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SolicitudService {

    private final SolicitudRepository solicitudRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificationService notificationService;

    @Transactional
    public SolicitudDTO.Response crearSolicitud(Long clienteId, SolicitudDTO.Crear request) {
        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        if (!cliente.getRoles().stream().anyMatch(r -> r.getNombre().equals("ROLE_CUSTOMER"))) {
            throw new UnauthorizedException("Solo los clientes pueden crear solicitudes");
        }

        Solicitud solicitud = new Solicitud();
        solicitud.setCliente(cliente);
        
        // Convertir string a enum TipoLimpieza
        try {
            Solicitud.TipoLimpieza tipo = Solicitud.TipoLimpieza.valueOf(request.getTipoLimpieza().toUpperCase());
            solicitud.setTipoLimpieza(tipo);
        } catch (IllegalArgumentException e) {
            solicitud.setTipoLimpieza(Solicitud.TipoLimpieza.BASICA); // Default
        }
        
        solicitud.setDescripcion(request.getDescripcion());
        solicitud.setDireccion(request.getDireccion());
        solicitud.setLatitud(request.getLatitud());
        solicitud.setLongitud(request.getLongitud());
        solicitud.setFechaServicio(request.getFechaServicio());
        solicitud.setHoraInicioEstimada(request.getHoraInicioEstimada());
        solicitud.setDuracionEstimadaHoras(request.getDuracionEstimadaHoras());
        solicitud.setMetrosCuadrados(request.getMetrosCuadrados());
        solicitud.setPrecioMaximo(request.getPrecioMaximo());
        solicitud.setInstruccionesEspeciales(request.getInstruccionesEspeciales());
        solicitud.setEstado(EstadoSolicitud.ABIERTA);
        solicitud.setCantidadOfertas(0);

        solicitud = solicitudRepository.save(solicitud);

        notificationService.notificarNuevaSolicitud(
                solicitud.getId(),
                clienteId,
                "Nueva solicitud: " + solicitud.getTipoLimpieza() + " - " + solicitud.getDireccion()
        );

        log.info("Solicitud creada: {} por cliente {}", solicitud.getId(), clienteId);

        return mapToResponse(solicitud);
    }

    @Transactional
    public SolicitudDTO.Response actualizarSolicitud(Long solicitudId, Long clienteId,
                                                     SolicitudDTO.Actualizar request) {
        Solicitud solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new NotFoundException("Solicitud no encontrada"));

        if (!solicitud.getCliente().getId().equals(clienteId)) {
            throw new UnauthorizedException("No autorizado para modificar esta solicitud");
        }

        if (!solicitud.getEstado().equals(EstadoSolicitud.ABIERTA) &&
            !solicitud.getEstado().equals(EstadoSolicitud.EN_NEGOCIACION)) {
            throw new IllegalStateException("Solo se pueden modificar solicitudes abiertas o en negociación");
        }

        if (request.getDescripcion() != null) {
            solicitud.setDescripcion(request.getDescripcion());
        }
        if (request.getDireccion() != null) {
            solicitud.setDireccion(request.getDireccion());
        }
        if (request.getLatitud() != null && request.getLongitud() != null) {
            solicitud.setLatitud(request.getLatitud());
            solicitud.setLongitud(request.getLongitud());
        }
        if (request.getFechaServicio() != null) {
            solicitud.setFechaServicio(request.getFechaServicio());
        }
        if (request.getHoraInicioEstimada() != null) {
            solicitud.setHoraInicioEstimada(request.getHoraInicioEstimada());
        }
        if (request.getPrecioMaximo() != null) {
            solicitud.setPrecioMaximo(request.getPrecioMaximo());
        }
        if (request.getInstruccionesEspeciales() != null) {
            solicitud.setInstruccionesEspeciales(request.getInstruccionesEspeciales());
        }

        solicitud = solicitudRepository.save(solicitud);

        log.info("Solicitud {} actualizada por cliente {}", solicitudId, clienteId);

        return mapToResponse(solicitud);
    }

    @Transactional
    public void cancelarSolicitud(Long solicitudId, Long clienteId, String motivo) {
        Solicitud solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new NotFoundException("Solicitud no encontrada"));

        if (!solicitud.getCliente().getId().equals(clienteId)) {
            throw new UnauthorizedException("No autorizado para cancelar esta solicitud");
        }

        if (solicitud.getEstado().equals(EstadoSolicitud.ACEPTADA) ||
            solicitud.getEstado().equals(EstadoSolicitud.EN_PROGRESO)) {
            throw new IllegalStateException("No se puede cancelar una solicitud aceptada o en progreso");
        }

        solicitud.setEstado(EstadoSolicitud.CANCELADA);
        solicitudRepository.save(solicitud);

        log.info("Solicitud {} cancelada por cliente {}. Motivo: {}", solicitudId, clienteId, motivo);
    }

    public SolicitudDTO.DetailResponse obtenerSolicitud(Long solicitudId, Long usuarioId) {
        Solicitud solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new NotFoundException("Solicitud no encontrada"));

        boolean esCliente = solicitud.getCliente().getId().equals(usuarioId);
        boolean esProveedor = solicitud.getOfertas().stream()
                .anyMatch(o -> o.getProveedor().getId().equals(usuarioId));

        if (!esCliente && !esProveedor) {
            Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
            if (usuario == null || !usuario.getRoles().stream()
                    .anyMatch(r -> r.getNombre().equals("ROLE_SERVICE_PROVIDER"))) {
                throw new UnauthorizedException("No autorizado para ver esta solicitud");
            }

            if (!solicitud.puedeRecibirOfertas()) {
                throw new UnauthorizedException("Esta solicitud ya no acepta ofertas");
            }
        }

        return mapToDetailResponse(solicitud);
    }

    public List<SolicitudDTO.Response> obtenerMisSolicitudes(Long clienteId, EstadoSolicitud estado) {
        List<Solicitud> solicitudes;

        if (estado != null) {
            solicitudes = solicitudRepository.findByClienteIdAndEstado(clienteId, estado);
        } else {
            solicitudes = solicitudRepository.findByClienteIdOrderByCreatedAtDesc(clienteId);
        }

        return solicitudes.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<SolicitudDTO.Response> obtenerSolicitudesCercanas(
            Long proveedorId, BigDecimal latitud, BigDecimal longitud,
            Integer radioKm, Pageable pageable) {

        Usuario proveedor = usuarioRepository.findById(proveedorId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        if (!proveedor.getRoles().stream().anyMatch(r -> r.getNombre().equals("ROLE_SERVICE_PROVIDER"))) {
            throw new UnauthorizedException("Solo los proveedores pueden buscar solicitudes");
        }

        if (!proveedor.getDisponible()) {
            log.warn("Proveedor {} no disponible intentando buscar solicitudes", proveedorId);
        }

        List<Solicitud> solicitudes = solicitudRepository.findSolicitudesCercanas(
                latitud, longitud, radioKm, LocalDateTime.now()
        );

        List<SolicitudDTO.Response> responses = solicitudes.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), responses.size());

        return new org.springframework.data.domain.PageImpl<>(
                responses.subList(start, Math.min(end, responses.size())),
                pageable,
                responses.size()
        );
    }

    public List<SolicitudDTO.Response> buscarSolicitudes(TipoLimpieza tipo,
                                                         EstadoSolicitud estado,
                                                         LocalDateTime fechaDesde,
                                                         LocalDateTime fechaHasta) {
        List<Solicitud> solicitudes;

        if (tipo != null && estado != null) {
            solicitudes = solicitudRepository.findByTipoLimpiezaAndEstadoOrderByCreatedAtDesc(tipo, estado);
        } else if (tipo != null) {
            solicitudes = solicitudRepository.findByTipoLimpiezaOrderByCreatedAtDesc(tipo);
        } else if (estado != null) {
            solicitudes = solicitudRepository.findByEstadoOrderByCreatedAtDesc(estado);
        } else {
            solicitudes = solicitudRepository.findAllByOrderByCreatedAtDesc();
        }

        if (fechaDesde != null && fechaHasta != null) {
            LocalDate fechaDesdeDate = fechaDesde.toLocalDate();
            LocalDate fechaHastaDate = fechaHasta.toLocalDate();
            solicitudes = solicitudes.stream()
                    .filter(s -> s.getFechaServicio().isAfter(fechaDesdeDate) &&
                               s.getFechaServicio().isBefore(fechaHastaDate))
                    .collect(Collectors.toList());
        }

        return solicitudes.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void actualizarEstado(Long solicitudId, EstadoSolicitud nuevoEstado) {
        Solicitud solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new NotFoundException("Solicitud no encontrada"));

        EstadoSolicitud estadoAnterior = solicitud.getEstado();
        solicitud.setEstado(nuevoEstado);
        solicitudRepository.save(solicitud);

        log.info("Solicitud {} cambió de estado: {} -> {}", solicitudId, estadoAnterior, nuevoEstado);
    }

    private SolicitudDTO.Response mapToResponse(Solicitud solicitud) {
        return new SolicitudDTO.Response(
                solicitud.getId(),
                solicitud.getCliente().getId(),
                solicitud.getCliente().getNombre(),
                solicitud.getCliente().getFotoPerfil(),
                solicitud.getTitulo(),
                solicitud.getDescripcion(),
                solicitud.getTipoLimpieza().name(),
                solicitud.getDireccion(),
                solicitud.getLatitud(),
                solicitud.getLongitud(),
                solicitud.getReferenciaDireccion(),
                solicitud.getMetrosCuadrados(),
                solicitud.getCantidadHabitaciones(),
                solicitud.getCantidadBanos(),
                solicitud.getTieneMascotas(),
                solicitud.getPrecioMaximo(),
                solicitud.getFechaServicio(),
                solicitud.getHoraInicio(),
                solicitud.getDuracionEstimada(),
                solicitud.getEstado().name(),
                solicitud.getCantidadOfertas(),
                solicitud.getOfertaAceptadaId(),
                solicitud.getCreatedAt().toString(),
                solicitud.getExpiraEn() != null ? solicitud.getExpiraEn().toString() : null,
                null // distanciaKm - se calcula en consultas específicas
        );
    }

    private SolicitudDTO.DetailResponse mapToDetailResponse(Solicitud solicitud) {
        SolicitudDTO.Response baseResponse = mapToResponse(solicitud);

        return new SolicitudDTO.DetailResponse(
                baseResponse.getId(),
                baseResponse.getClienteId(),
                baseResponse.getClienteNombre(),
                baseResponse.getTipoLimpieza(),
                baseResponse.getDescripcion(),
                baseResponse.getDireccion(),
                baseResponse.getLatitud(),
                baseResponse.getLongitud(),
                baseResponse.getFechaServicio(),
                baseResponse.getHoraInicioEstimada(),
                baseResponse.getDuracionEstimadaHoras(),
                baseResponse.getMetrosCuadrados(),
                baseResponse.getPrecioMaximo(),
                baseResponse.getEstado(),
                baseResponse.getCantidadOfertas(),
                baseResponse.getCreatedAt(),
                solicitud.getInstruccionesEspeciales(),
                solicitud.getCliente().getTelefono(),
                solicitud.getCliente().getFotoPerfil(),
                solicitud.getCliente().getCalificacionPromedio() != null ?
                        solicitud.getCliente().getCalificacionPromedio().doubleValue() : 0.0
        );
    }
}
