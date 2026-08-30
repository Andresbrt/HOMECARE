package com.homecare.domain.solicitud.service;

import com.homecare.dto.SolicitudDTO;
import com.homecare.common.event.NotificationEvent;
import com.homecare.common.exception.BadRequestBusinessException;
import com.homecare.common.exception.ConflictBusinessException;
import com.homecare.common.exception.NotFoundException;
import com.homecare.common.exception.UnauthorizedException;
import com.homecare.security.RequiereRol;
import com.homecare.domain.solicitud.model.Solicitud;
import com.homecare.domain.solicitud.model.Solicitud.EstadoSolicitud;
import com.homecare.domain.solicitud.model.Solicitud.TipoLimpieza;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.solicitud.repository.SolicitudRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SolicitudService {

    private final SolicitudRepository solicitudRepository;
    private final UsuarioRepository usuarioRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    @RequiereRol(value = "CLIENTE", mensaje = "Solo los clientes pueden crear solicitudes")
    public SolicitudDTO.Response crearSolicitud(Long clienteId, SolicitudDTO.Crear request) {
        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        // La validación por rol ya la hizo RolValidacionAspect vía AOP

        Solicitud solicitud = new Solicitud();
        solicitud.setCliente(cliente);
        solicitud.setTitulo(request.getTitulo());

        // Convertir string a enum TipoLimpieza
        try {
            Solicitud.TipoLimpieza tipo = Solicitud.TipoLimpieza.valueOf(request.getTipoLimpieza().toUpperCase());
            solicitud.setTipoLimpieza(tipo);
        } catch (IllegalArgumentException e) {
            solicitud.setTipoLimpieza(Solicitud.TipoLimpieza.BASICA); // Default
        }

        solicitud.setDescripcion(request.getDescripcion());
        solicitud.setDireccion(request.getDireccion());
        solicitud.setReferenciaDireccion(request.getReferenciaDireccion());
        solicitud.setLatitud(request.getLatitud());
        solicitud.setLongitud(request.getLongitud());
        solicitud.setFechaServicio(request.getFechaServicio());
        solicitud.setHoraInicioEstimada(request.getHoraInicioEstimada());
        solicitud.setDuracionEstimadaHoras(request.getDuracionEstimadaHoras());
        solicitud.setMetrosCuadrados(request.getMetrosCuadrados());
        solicitud.setCantidadHabitaciones(request.getCantidadHabitaciones());
        solicitud.setCantidadBanos(request.getCantidadBanos());
        solicitud.setTieneMascotas(request.getTieneMascotas() != null ? request.getTieneMascotas() : false);
        solicitud.setPrecioMaximo(request.getPrecioMaximo());
        solicitud.setInstruccionesEspeciales(request.getInstruccionesEspeciales());
        solicitud.setEstado(EstadoSolicitud.ABIERTA);
        solicitud.setExpiraEn(LocalDateTime.now().plusDays(7));
        solicitud.setCantidadOfertas(0);

        solicitud = solicitudRepository.save(solicitud);

        Map<String, String> data = new HashMap<>();
        data.put("tipo", "NUEVA_SOLICITUD");
        data.put("solicitudId", solicitud.getId().toString());
        data.put("action", "VER_SOLICITUD");

        NotificationEvent event = NotificationEvent.builder()
                .titulo("Nueva solicitud disponible")
                .cuerpo("Nueva solicitud: " + solicitud.getTipoLimpieza() + " - " + solicitud.getDireccion())
                .tipo("NUEVA_SOLICITUD")
                .data(data)
                .targetRol("SERVICE_PROVIDER")
                .isBroadcast(true)
                .build();

        eventPublisher.publishEvent(event);

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
            throw new ConflictBusinessException("SOLICITUD_NO_EDITABLE", "Solo se pueden modificar solicitudes abiertas o en negociación");
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

        if (solicitud.getEstado().equals(EstadoSolicitud.CANCELADA) ||
            solicitud.getEstado().equals(EstadoSolicitud.COMPLETADA)) {
            throw new ConflictBusinessException("SOLICITUD_YA_CERRADA", "No se puede cancelar una solicitud ya cerrada");
        }

        solicitud.setEstado(EstadoSolicitud.CANCELADA);
        solicitudRepository.save(solicitud);

        log.info("Solicitud {} cancelada por cliente {}: {}", solicitudId, clienteId, motivo);
    }

    public SolicitudDTO.DetailResponse obtenerSolicitud(Long solicitudId, Long usuarioId) {
        Solicitud solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new NotFoundException("Solicitud no encontrada"));

        boolean esCliente = solicitud.getCliente().getId().equals(usuarioId);
        boolean esProveedor = solicitud.getOfertas().stream()
                .anyMatch(o -> o.getProveedor().getId().equals(usuarioId));

        if (!esCliente && !esProveedor) {
            log.debug("Usuario {} consultando solicitud {} como tercero", usuarioId, solicitudId);
        }

        return mapToDetailResponse(solicitud);
    }

    public List<SolicitudDTO.Response> obtenerMisSolicitudes(Long clienteId, EstadoSolicitud estado) {
        List<Solicitud> solicitudes;

        if (estado != null) {
            solicitudes = solicitudRepository.findByClienteIdAndEstadoOrderByCreatedAtDesc(clienteId, estado);
        } else {
            solicitudes = solicitudRepository.findByClienteIdOrderByCreatedAtDesc(clienteId);
        }

        return solicitudes.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<SolicitudDTO.Response> obtenerSolicitudesAbiertas(Long proveedorId) {
        Usuario proveedor = usuarioRepository.findById(proveedorId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        boolean isProvider = proveedor.getRoles().stream()
                .anyMatch(r -> "ROLE_SERVICE_PROVIDER".equals(r.getNombre()) || "SERVICE_PROVIDER".equals(r.getNombre()) || "ROLE_PROVEEDOR".equals(r.getNombre()));
        if (!isProvider) {
            throw new UnauthorizedException("Solo los proveedores pueden buscar solicitudes");
        }

        if (Boolean.FALSE.equals(proveedor.getDisponible())) {
            return List.of();
        }

        List<Solicitud> solicitudes = solicitudRepository.findSolicitudesAbiertas(LocalDateTime.now());
        return solicitudes.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<SolicitudDTO.Response> obtenerSolicitudesCercanas(
            Long proveedorId, BigDecimal latitud, BigDecimal longitud,
            Integer radioKm, Pageable pageable) {

        Usuario proveedor = usuarioRepository.findById(proveedorId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        boolean isProvider = proveedor.getRoles().stream()
                .anyMatch(r -> "ROLE_SERVICE_PROVIDER".equals(r.getNombre()) || "SERVICE_PROVIDER".equals(r.getNombre()) || "ROLE_PROVEEDOR".equals(r.getNombre()));
        if (!isProvider) {
            throw new UnauthorizedException("Solo los proveedores pueden buscar solicitudes");
        }

        if (Boolean.FALSE.equals(proveedor.getDisponible())) {
            log.warn("Proveedor {} no disponible intentando buscar solicitudes", proveedorId);
            return new org.springframework.data.domain.PageImpl<>(
                    List.of(),
                    pageable,
                    0
            );
        }

        List<Solicitud> solicitudes = solicitudRepository.findSolicitudesCercanas(
                latitud, longitud, radioKm, LocalDateTime.now()
        );

        List<SolicitudDTO.Response> responses = solicitudes.stream()
                .map(s -> mapToResponse(s, latitud, longitud))
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
        return mapToResponse(solicitud, null, null);
    }

    private SolicitudDTO.Response mapToResponse(Solicitud solicitud, BigDecimal origenLat, BigDecimal origenLng) {
        Double distanciaKm = null;
        if (origenLat != null && origenLng != null && solicitud.getLatitud() != null && solicitud.getLongitud() != null) {
            distanciaKm = calcularDistanciaKm(origenLat, origenLng, solicitud.getLatitud(), solicitud.getLongitud());
        }

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
                distanciaKm
        );
    }

    private Double calcularDistanciaKm(BigDecimal lat1, BigDecimal lng1, BigDecimal lat2, BigDecimal lng2) {
        double lat1d = lat1.doubleValue();
        double lon1d = lng1.doubleValue();
        double lat2d = lat2.doubleValue();
        double lon2d = lng2.doubleValue();

        double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2d - lat1d);
        double dLon = Math.toRadians(lon2d - lon1d);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1d)) * Math.cos(Math.toRadians(lat2d))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
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

