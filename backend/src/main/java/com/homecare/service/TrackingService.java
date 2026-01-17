package com.homecare.service;

import com.homecare.dto.LocationDTO;
import com.homecare.exception.NotFoundException;
import com.homecare.exception.UnauthorizedException;
import com.homecare.model.ServicioAceptado;
import com.homecare.model.UbicacionTracking;
import com.homecare.model.Usuario;
import com.homecare.repository.ServicioAceptadoRepository;
import com.homecare.repository.UbicacionTrackingRepository;
import com.homecare.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrackingService {

    private final UbicacionTrackingRepository trackingRepository;
    private final ServicioAceptadoRepository servicioRepository;
    private final UsuarioRepository usuarioRepository;
    @SuppressWarnings("unused")
    private final LocationService locationService;
    private final SimpMessagingTemplate messagingTemplate;
    @SuppressWarnings("unused")
    private final NotificationService notificationService;

    @Transactional
    public LocationDTO.LocationResponse actualizarTracking(Long proveedorId,
                                                           LocationDTO.TrackingUpdate request) {
        ServicioAceptado servicio = servicioRepository.findById(request.getServicioId())
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado"));

        if (!servicio.getProveedor().getId().equals(proveedorId)) {
            throw new UnauthorizedException("No autorizado para actualizar tracking de este servicio");
        }

        Usuario proveedor = servicio.getProveedor();

        proveedor.setLatitud(request.getLatitud());
        proveedor.setLongitud(request.getLongitud());
        proveedor.setUltimaUbicacion(LocalDateTime.now());
        usuarioRepository.save(proveedor);

        UbicacionTracking tracking = new UbicacionTracking();
        tracking.setServicio(servicio);
        tracking.setProveedor(proveedor);
        tracking.setLatitud(request.getLatitud());
        tracking.setLongitud(request.getLongitud());
        tracking.setPrecisionMetros(request.getPrecisionMetros());
        tracking.setVelocidadKmh(request.getVelocidadKmh());
        tracking.setDireccion(request.getDireccion());
        tracking.setAltitud(request.getAltitud());
        tracking.setBateriaPorcentaje(request.getBateriaPorcentaje());
        tracking.setTimestamp(request.getTimestamp() != null ?
                request.getTimestamp() : LocalDateTime.now());

        tracking = trackingRepository.save(tracking);

        Double distanciaDestino = LocationService.calcularDistancia(
                request.getLatitud(), request.getLongitud(),
                servicio.getSolicitud().getLatitud(), servicio.getSolicitud().getLongitud()
        );

        Integer tiempoEstimado = LocationService.calcularTiempoEstimado(
                distanciaDestino, request.getVelocidadKmh() != null ?
                        request.getVelocidadKmh() : 30.0
        );

        LocationDTO.LocationResponse response = new LocationDTO.LocationResponse(
                tracking.getId(),
                tracking.getLatitud(),
                tracking.getLongitud(),
                tracking.getPrecisionMetros(),
                tracking.getTimestamp(),
                distanciaDestino,
                tiempoEstimado
        );

        enviarActualizacionTiempoReal(servicio.getId(), servicio.getCliente().getId(), response);

        if (distanciaDestino < 0.1 && !servicio.getEstado().equals(ServicioAceptado.EstadoServicio.LLEGUE)) {
            log.info("Proveedor {} cerca del destino ({} km)", proveedorId, distanciaDestino);
        }

        log.info("Tracking actualizado para servicio {}: {}, {}",
                request.getServicioId(), request.getLatitud(), request.getLongitud());

        return response;
    }

    public LocationDTO.TrackingResponse obtenerTrackingServicio(Long servicioId, Long usuarioId) {
        ServicioAceptado servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado"));

        if (!servicio.getCliente().getId().equals(usuarioId) &&
            !servicio.getProveedor().getId().equals(usuarioId)) {
            throw new UnauthorizedException("No autorizado para ver tracking de este servicio");
        }

        UbicacionTracking ultimaUbicacion = trackingRepository
                .findUltimaUbicacionByServicio(servicioId)
                .orElse(null);

        LocationDTO.LocationResponse ubicacionActual = null;
        if (ultimaUbicacion != null) {
            Double distanciaDestino = LocationService.calcularDistancia(
                    ultimaUbicacion.getLatitud(), ultimaUbicacion.getLongitud(),
                    servicio.getSolicitud().getLatitud(), servicio.getSolicitud().getLongitud()
            );

            Integer tiempoEstimado = LocationService.calcularTiempoEstimado(
                    distanciaDestino,
                    ultimaUbicacion.getVelocidadKmh() != null ?
                            ultimaUbicacion.getVelocidadKmh() : 30.0
            );

            ubicacionActual = new LocationDTO.LocationResponse(
                    ultimaUbicacion.getId(),
                    ultimaUbicacion.getLatitud(),
                    ultimaUbicacion.getLongitud(),
                    ultimaUbicacion.getPrecisionMetros(),
                    ultimaUbicacion.getTimestamp(),
                    distanciaDestino,
                    tiempoEstimado
            );
        }

        LocationDTO.LocationResponse ubicacionDestino = new LocationDTO.LocationResponse(
                null,
                servicio.getSolicitud().getLatitud(),
                servicio.getSolicitud().getLongitud(),
                null,
                null,
                null,
                null
        );

        List<UbicacionTracking> rutaCompleta = trackingRepository
                .findByServicioIdOrderByTimestampDesc(servicioId);

        List<LocationDTO.LocationPoint> ruta = rutaCompleta.stream()
                .map(u -> new LocationDTO.LocationPoint(
                        u.getLatitud(),
                        u.getLongitud(),
                        u.getTimestamp()
                ))
                .collect(Collectors.toList());

        return new LocationDTO.TrackingResponse(
                servicioId,
                servicio.getProveedor().getId(),
                servicio.getProveedor().getNombre(),
                ubicacionActual,
                ubicacionDestino,
                ruta,
                servicio.getEstado().name(),
                ultimaUbicacion != null ? ultimaUbicacion.getTimestamp() : null
        );
    }

    public List<LocationDTO.LocationPoint> obtenerRutaServicio(Long servicioId,
                                                                LocalDateTime inicio,
                                                                LocalDateTime fin) {
        List<UbicacionTracking> tracking = trackingRepository
                .findRutaByServicioAndPeriodo(servicioId, inicio, fin);

        return tracking.stream()
                .map(u -> new LocationDTO.LocationPoint(
                        u.getLatitud(),
                        u.getLongitud(),
                        u.getTimestamp()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public void limpiarTrackingServicio(Long servicioId) {
        trackingRepository.deleteByServicioId(servicioId);
        log.info("Tracking eliminado para servicio {}", servicioId);
    }

    private void enviarActualizacionTiempoReal(Long servicioId, Long clienteId,
                                                LocationDTO.LocationResponse ubicacion) {
        try {
            messagingTemplate.convertAndSendToUser(
                    clienteId.toString(),
                    "/topic/tracking/" + servicioId,
                    ubicacion
            );

            log.debug("Actualización de tracking enviada via WebSocket para servicio {}", servicioId);
        } catch (Exception e) {
            log.error("Error al enviar actualización de tracking via WebSocket: {}", e.getMessage());
        }
    }

    // Métodos adicionales para compatibilidad con WebSocket Controller

    /**
     * Actualiza ubicación del proveedor (compatibilidad WebSocket)
     */
    public com.homecare.dto.TrackingDTO.UbicacionResponse actualizarUbicacionProveedor(
            Long solicitudId, com.homecare.dto.TrackingDTO.UbicacionUpdate ubicacion) {
        
        // Convertir a formato interno y delegar al método existente
        LocationDTO.TrackingUpdate request = new LocationDTO.TrackingUpdate();
        request.setServicioId(solicitudId); // Asumiendo que solicitudId corresponde a servicioId
        request.setLatitud(ubicacion.getLatitud());
        request.setLongitud(ubicacion.getLongitud());
        
        LocationDTO.LocationResponse response = actualizarTracking(ubicacion.getProveedorId(), request);
        
        // Buscar información del servicio para obtener clienteId
        Long clienteId = null;
        try {
            ServicioAceptado servicio = servicioRepository.findById(solicitudId).orElse(null);
            if (servicio != null) {
                clienteId = servicio.getCliente().getId();
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener clienteId para solicitud {}", solicitudId);
        }
        
        // Convertir respuesta al formato esperado por WebSocket
        return com.homecare.dto.TrackingDTO.UbicacionResponse.builder()
            .solicitudId(solicitudId)
            .proveedorId(ubicacion.getProveedorId())
            .clienteId(clienteId)
            .latitud(response.getLatitud())
            .longitud(response.getLongitud())
            .estado(ubicacion.getEstado())
            .timestamp(response.getTimestamp())
            .mensaje("Ubicación actualizada")
            .build();
    }

    /**
     * Envía mensaje de chat (placeholder - implementación básica)
     */
    public com.homecare.dto.TrackingDTO.ChatMessage enviarMensajeChat(
            Long servicioId, com.homecare.dto.TrackingDTO.ChatMessage mensaje) {
        
        log.debug("Enviando mensaje de chat para servicio {}: {}", servicioId, mensaje.getMensaje());
        
        // Aquí iría la lógica para guardar el mensaje en base de datos
        // Por ahora, devolvemos el mensaje procesado
        mensaje.setTimestamp(LocalDateTime.now());
        mensaje.setLeido(false);
        
        return mensaje;
    }

    /**
     * Actualiza estado del servicio (placeholder - implementación básica)
     */
    public com.homecare.dto.TrackingDTO.ServicioStatus actualizarEstadoServicio(
            Long servicioId, com.homecare.dto.TrackingDTO.EstadoUpdate estadoUpdate) {
        
        log.debug("Actualizando estado de servicio {}: {}", servicioId, estadoUpdate.getNuevoEstado());
        
        try {
            ServicioAceptado servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado"));
            
            // Actualizar estado
            ServicioAceptado.EstadoServicio nuevoEstado = ServicioAceptado.EstadoServicio.valueOf(estadoUpdate.getNuevoEstado());
            servicio.setEstado(nuevoEstado);
            servicioRepository.save(servicio);
            
            return com.homecare.dto.TrackingDTO.ServicioStatus.builder()
                .servicioId(servicioId)
                .clienteId(servicio.getCliente().getId())
                .proveedorId(servicio.getProveedor().getId())
                .estado(nuevoEstado.name())
                .observaciones(estadoUpdate.getObservaciones())
                .timestamp(LocalDateTime.now())
                .clienteNombre(servicio.getCliente().getNombre())
                .proveedorNombre(servicio.getProveedor().getNombre())
                .requiereAccion(false)
                .build();
                
        } catch (Exception e) {
            log.error("Error actualizando estado de servicio: {}", e.getMessage(), e);
            throw new RuntimeException("Error actualizando estado del servicio");
        }
    }
}
