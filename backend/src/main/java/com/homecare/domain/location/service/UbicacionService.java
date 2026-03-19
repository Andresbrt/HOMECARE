package com.homecare.domain.location.service;

import com.homecare.dto.UbicacionDTO;
import com.homecare.common.exception.NotFoundException;
import com.homecare.common.exception.UnauthorizedException;
import com.homecare.domain.solicitud.model.Solicitud;
import com.homecare.model.UbicacionProveedor;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.solicitud.repository.SolicitudRepository;
import com.homecare.domain.location.repository.UbicacionProveedorRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.domain.common.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UbicacionService {

    private final UbicacionProveedorRepository ubicacionRepository;
    private final SolicitudRepository solicitudRepository;
    private final UsuarioRepository usuarioRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final GoogleMapsService googleMapsService;

    @Value("${tracking.eta-calculation:haversine}")
    private String etaCalculationMethod;

    private static final double RADIO_TIERRA_KM = 6371.0;
    @SuppressWarnings("unused")
    private static final double VELOCIDAD_PROMEDIO_URBANA_KMH = 30.0;
    private static final int ALERTA_DISTANCIA_1KM = 1000;
    private static final int ALERTA_DISTANCIA_500M = 500;
    private static final int ALERTA_DISTANCIA_100M = 100;
    private static final int ALERTA_DISTANCIA_LLEGADO = 50;

    /**
     * Actualiza la ubicaciÃ³n del proveedor y transmite vÃ­a WebSocket
     */
    @Transactional
    public UbicacionDTO.UbicacionResponse actualizarUbicacion(
            Long proveedorId, 
            UbicacionDTO.ActualizarUbicacion dto) {
        
        log.info("Actualizando ubicaciÃ³n del proveedor {} para solicitud {}", 
                 proveedorId, dto.getSolicitudId());

        // Validar solicitud y proveedor
        Solicitud solicitud = solicitudRepository.findById(dto.getSolicitudId())
                .orElseThrow(() -> new NotFoundException("Solicitud no encontrada"));

        Usuario proveedor = usuarioRepository.findById(proveedorId)
                .orElseThrow(() -> new NotFoundException("Proveedor no encontrado"));

        // Verificar que el proveedor estÃ¡ asignado a esta solicitud
        boolean esProveedorDeSolicitud = solicitud.getOfertas().stream()
                .anyMatch(o -> o.getProveedor().getId().equals(proveedorId) && 
                              o.getEstado() == com.homecare.domain.offer.model.Oferta.EstadoOferta.ACEPTADA);

        if (!esProveedorDeSolicitud) {
            throw new UnauthorizedException("El proveedor no estÃ¡ asignado a esta solicitud");
        }

        // Crear nueva ubicaciÃ³n
        UbicacionProveedor ubicacion = UbicacionProveedor.builder()
                .solicitud(solicitud)
                .proveedor(proveedor)
                .latitud(dto.getLatitud())
                .longitud(dto.getLongitud())
                .precisionMetros(dto.getPrecisionMetros())
                .velocidadKmh(dto.getVelocidadKmh())
                .rumboGrados(dto.getRumboGrados())
                .tipoTransporte(dto.getTipoTransporte())
                .bateriaDispositivo(dto.getBateriaDispositivo())
                .enSegundoPlano(dto.getEnSegundoPlano())
                .build();

        // Calcular distancia y ETA hasta el cliente
        calcularDistanciaYEtaConGoogleMaps(
                ubicacion,
                solicitud.getLatitud().doubleValue(),
                solicitud.getLongitud().doubleValue(),
                dto.getTipoTransporte()
        );

        // Guardar en base de datos
        ubicacion = ubicacionRepository.save(ubicacion);

        // Convertir a DTO de respuesta
        UbicacionDTO.UbicacionResponse response = UbicacionDTO.toResponse(ubicacion);

        // Transmitir vÃ­a WebSocket al cliente
        transmitirUbicacionViasWebSocket(ubicacion);

        // Enviar alertas de proximidad si corresponde
        enviarAlertaProximidad(ubicacion, solicitud);

        log.info("UbicaciÃ³n actualizada. ETA: {} min, Distancia: {} m", 
                 ubicacion.getEtaMinutos(), ubicacion.getDistanciaRestanteMetros());

        return response;
    }

    /**
     * Obtiene la Ãºltima ubicaciÃ³n del proveedor para una solicitud
     */
    @Transactional(readOnly = true)
    public UbicacionDTO.UbicacionResponse obtenerUltimaUbicacion(Long solicitudId, Long proveedorId) {
        UbicacionProveedor ubicacion = ubicacionRepository
                .findTopBySolicitudIdAndProveedorIdOrderByTimestampDesc(solicitudId, proveedorId)
                .orElseThrow(() -> new NotFoundException(
                        "No hay ubicaciones registradas para este proveedor"));

        return UbicacionDTO.toResponse(ubicacion);
    }

    /**
     * Obtiene la trayectoria completa del proveedor
     */
    @Transactional(readOnly = true)
    public UbicacionDTO.Trayectoria obtenerTrayectoria(Long solicitudId) {
        List<UbicacionProveedor> ubicaciones = ubicacionRepository
                .findBySolicitudIdOrderByTimestampAsc(solicitudId);

        if (ubicaciones.isEmpty()) {
            throw new NotFoundException("No hay trayectoria registrada para esta solicitud");
        }

        // Calcular estadÃ­sticas
        LocalDateTime inicio = ubicaciones.get(0).getTimestamp();
        LocalDateTime fin = ubicaciones.get(ubicaciones.size() - 1).getTimestamp();
        long duracionMinutos = ChronoUnit.MINUTES.between(inicio, fin);
        
        // Calcular distancia total recorrida
        double distanciaTotalKm = calcularDistanciaRecorrida(ubicaciones);
        
        // Calcular velocidad promedio
        Double velocidadPromedio = ubicacionRepository.calcularVelocidadPromedio(solicitudId);

        // Convertir ubicaciones a puntos de ruta
        List<UbicacionDTO.PuntoRuta> puntos = ubicaciones.stream()
                .map(u -> UbicacionDTO.PuntoRuta.builder()
                        .latitud(u.getLatitud())
                        .longitud(u.getLongitud())
                        .velocidadKmh(u.getVelocidadKmh())
                        .estado(u.getEstado().name())
                        .timestamp(u.getTimestamp())
                        .build())
                .collect(Collectors.toList());

        UbicacionProveedor primeraUbicacion = ubicaciones.get(0);

        return UbicacionDTO.Trayectoria.builder()
                .solicitudId(solicitudId)
                .proveedorId(primeraUbicacion.getProveedor().getId())
                .proveedorNombre(primeraUbicacion.getProveedor().getNombre() + " " +
                                primeraUbicacion.getProveedor().getApellido())
                .inicioRuta(inicio)
                .finRuta(fin)
                .duracionMinutos((int) duracionMinutos)
                .distanciaTotalKm(distanciaTotalKm)
                .velocidadPromedioKmh(velocidadPromedio)
                .puntos(puntos)
                .build();
    }

    /**
     * Obtiene estadÃ­sticas del tracking
     */
    @Transactional(readOnly = true)
    public UbicacionDTO.EstadisticasTracking obtenerEstadisticas(Long solicitudId) {
        List<UbicacionProveedor> ubicaciones = ubicacionRepository
                .findBySolicitudIdOrderByTimestampAsc(solicitudId);

        if (ubicaciones.isEmpty()) {
            throw new NotFoundException("No hay datos de tracking para esta solicitud");
        }

        LocalDateTime primera = ubicaciones.get(0).getTimestamp();
        LocalDateTime ultima = ubicaciones.get(ubicaciones.size() - 1).getTimestamp();
        int tiempoTotal = (int) ChronoUnit.MINUTES.between(primera, ultima);

        Double velocidadPromedio = ubicacionRepository.calcularVelocidadPromedio(solicitudId);
        Double velocidadMaxima = ubicacionRepository.calcularVelocidadMaxima(solicitudId);
        Long puntosDetenido = ubicacionRepository.contarTiempoDetenido(solicitudId);
        
        // Calcular distancia recorrida
        double distanciaKm = calcularDistanciaRecorrida(ubicaciones);

        // Estimar tiempo detenido (cada punto representa ~10 segundos)
        int tiempoDetenidoMin = (int) (puntosDetenido * 10 / 60);

        return UbicacionDTO.EstadisticasTracking.builder()
                .solicitudId(solicitudId)
                .totalActualizaciones(ubicaciones.size())
                .distanciaRecorridaKm(distanciaKm)
                .tiempoTotalMinutos(tiempoTotal)
                .velocidadPromedioKmh(velocidadPromedio)
                .velocidadMaximaKmh(velocidadMaxima)
                .tiempoDetenidoMinutos(tiempoDetenidoMin)
                .primeraUbicacion(primera)
                .ultimaUbicacion(ultima)
                .build();
    }

    /**
     * Inicia el tracking para una solicitud
     */
    @Transactional
    public void iniciarTracking(Long solicitudId, Long proveedorId) {
        Solicitud solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new NotFoundException("Solicitud no encontrada"));

        Usuario cliente = solicitud.getCliente();
        Usuario proveedor = usuarioRepository.findById(proveedorId)
                .orElseThrow(() -> new NotFoundException("Proveedor no encontrado"));

        // Enviar notificaciÃ³n push al cliente
        String titulo = "El proveedor estÃ¡ en camino";
        String mensaje = String.format("%s %s ha comenzado el viaje hacia tu ubicaciÃ³n",
                proveedor.getNombre(), proveedor.getApellido());

        Map<String, String> data = new HashMap<>();
        data.put("tipo", "TRACKING_INICIADO");
        data.put("solicitudId", solicitudId.toString());
        data.put("proveedorId", proveedorId.toString());

        notificationService.enviarNotificacion(
                cliente.getId(),
                titulo,
                mensaje,
                data,
                null
        );

        // Notificar vÃ­a WebSocket
        UbicacionDTO.AlertaProximidad alerta = UbicacionDTO.AlertaProximidad.builder()
                .solicitudId(solicitudId)
                .proveedorId(proveedorId)
                .proveedorNombre(proveedor.getNombre() + " " + proveedor.getApellido())
                .proveedorTelefono(proveedor.getTelefono())
                .mensaje(mensaje)
                .tipoAlerta(UbicacionDTO.AlertaProximidad.TipoAlerta.SALIENDO)
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend(
                "/topic/tracking/" + solicitudId + "/alertas",
                alerta
        );

        log.info("Tracking iniciado para solicitud {} con proveedor {}", solicitudId, proveedorId);
    }

    /**
     * Finaliza el tracking
     */
    @Transactional
    public void finalizarTracking(Long solicitudId, Long proveedorId) {
        Solicitud solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new NotFoundException("Solicitud no encontrada"));

        Usuario cliente = solicitud.getCliente();
        Usuario proveedor = usuarioRepository.findById(proveedorId)
                .orElseThrow(() -> new NotFoundException("Proveedor no encontrado"));

        // NotificaciÃ³n de llegada
        String titulo = "El proveedor ha llegado";
        String mensaje = String.format("%s %s ha llegado a tu ubicaciÃ³n",
                proveedor.getNombre(), proveedor.getApellido());

        Map<String, String> data = new HashMap<>();
        data.put("tipo", "PROVEEDOR_LLEGADO");
        data.put("solicitudId", solicitudId.toString());
        data.put("proveedorId", proveedorId.toString());

        notificationService.enviarNotificacion(
                cliente.getId(),
                titulo,
                mensaje,
                data,
                null
        );

        // Alerta vÃ­a WebSocket
        UbicacionDTO.AlertaProximidad alerta = UbicacionDTO.AlertaProximidad.builder()
                .solicitudId(solicitudId)
                .proveedorId(proveedorId)
                .proveedorNombre(proveedor.getNombre() + " " + proveedor.getApellido())
                .proveedorTelefono(proveedor.getTelefono())
                .distanciaMetros(0.0)
                .etaMinutos(0)
                .mensaje(mensaje)
                .tipoAlerta(UbicacionDTO.AlertaProximidad.TipoAlerta.LLEGADO)
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend(
                "/topic/tracking/" + solicitudId + "/alertas",
                alerta
        );

        log.info("Tracking finalizado para solicitud {}", solicitudId);
    }

    // ==================== MÃ‰TODOS PRIVADOS ====================

    /**
     * Transmite ubicaciÃ³n vÃ­a WebSocket a todos los suscriptores
     */
    private void transmitirUbicacionViasWebSocket(UbicacionProveedor ubicacion) {
        try {
            UbicacionDTO.UbicacionWebSocket wsDto = UbicacionDTO.toWebSocket(ubicacion);
            
            // Canal principal de tracking para la solicitud
            messagingTemplate.convertAndSend(
                    "/topic/tracking/" + ubicacion.getSolicitud().getId(),
                    wsDto
            );

            // Canal especÃ­fico para el cliente
            messagingTemplate.convertAndSendToUser(
                    ubicacion.getSolicitud().getCliente().getId().toString(),
                    "/queue/tracking",
                    wsDto
            );

            log.debug("UbicaciÃ³n transmitida vÃ­a WebSocket para solicitud {}", 
                     ubicacion.getSolicitud().getId());
        } catch (Exception e) {
            log.error("Error al transmitir ubicaciÃ³n vÃ­a WebSocket: {}", e.getMessage());
        }
    }

    /**
     * EnvÃ­a alertas de proximidad segÃºn la distancia
     */
    private void enviarAlertaProximidad(UbicacionProveedor ubicacion, Solicitud solicitud) {
        Double distancia = ubicacion.getDistanciaRestanteMetros();
        if (distancia == null) return;

        Usuario cliente = solicitud.getCliente();
        Usuario proveedor = ubicacion.getProveedor();

        UbicacionDTO.AlertaProximidad.TipoAlerta tipoAlerta = null;
        String mensaje = null;

        // Determinar tipo de alerta segÃºn distancia
        if (distancia < ALERTA_DISTANCIA_LLEGADO) {
            tipoAlerta = UbicacionDTO.AlertaProximidad.TipoAlerta.LLEGADO;
            mensaje = String.format("%s %s ha llegado a tu ubicaciÃ³n", 
                                   proveedor.getNombre(), proveedor.getApellido());
        } else if (distancia < ALERTA_DISTANCIA_100M) {
            tipoAlerta = UbicacionDTO.AlertaProximidad.TipoAlerta.LLEGANDO_100M;
            mensaje = String.format("%s %s estÃ¡ a menos de 100 metros", 
                                   proveedor.getNombre(), proveedor.getApellido());
        } else if (distancia < ALERTA_DISTANCIA_500M) {
            tipoAlerta = UbicacionDTO.AlertaProximidad.TipoAlerta.CERCA_500M;
            mensaje = String.format("%s %s estÃ¡ a menos de 500 metros", 
                                   proveedor.getNombre(), proveedor.getApellido());
        } else if (distancia < ALERTA_DISTANCIA_1KM) {
            tipoAlerta = UbicacionDTO.AlertaProximidad.TipoAlerta.CERCA_1KM;
            mensaje = String.format("%s %s estÃ¡ a menos de 1 kilÃ³metro", 
                                   proveedor.getNombre(), proveedor.getApellido());
        }

        // Enviar alerta si corresponde
        if (tipoAlerta != null && mensaje != null) {
            // Verificar si ya se enviÃ³ esta alerta antes (evitar spam)
            // TODO: implementar cachÃ© de alertas enviadas

            UbicacionDTO.AlertaProximidad alerta = UbicacionDTO.AlertaProximidad.builder()
                    .solicitudId(solicitud.getId())
                    .proveedorId(proveedor.getId())
                    .proveedorNombre(proveedor.getNombre() + " " + proveedor.getApellido())
                    .proveedorTelefono(proveedor.getTelefono())
                    .distanciaMetros(distancia)
                    .etaMinutos(ubicacion.getEtaMinutos())
                    .mensaje(mensaje)
                    .tipoAlerta(tipoAlerta)
                    .timestamp(LocalDateTime.now())
                    .build();

            // Enviar por WebSocket
            messagingTemplate.convertAndSend(
                    "/topic/tracking/" + solicitud.getId() + "/alertas",
                    alerta
            );

            // Enviar notificaciÃ³n push para alertas importantes
            if (tipoAlerta == UbicacionDTO.AlertaProximidad.TipoAlerta.LLEGADO ||
                tipoAlerta == UbicacionDTO.AlertaProximidad.TipoAlerta.LLEGANDO_100M) {
                
                Map<String, String> data = new HashMap<>();
                data.put("tipo", "PROVEEDOR_CERCA");
                data.put("solicitudId", solicitud.getId().toString());
                data.put("tipoAlerta", tipoAlerta.name());
                data.put("distanciaMetros", distancia.toString());
                
                notificationService.enviarNotificacion(
                        cliente.getId(),
                        "Proveedor cerca",
                        mensaje,
                        data,
                        null
                );
            }

            log.info("Alerta de proximidad enviada: {} - {} metros", tipoAlerta, distancia);
        }
    }

    /**
     * Calcula distancia total recorrida sumando distancias entre puntos consecutivos
     */
    private double calcularDistanciaRecorrida(List<UbicacionProveedor> ubicaciones) {
        if (ubicaciones.size() < 2) return 0.0;

        double distanciaTotal = 0.0;
        for (int i = 1; i < ubicaciones.size(); i++) {
            UbicacionProveedor anterior = ubicaciones.get(i - 1);
            UbicacionProveedor actual = ubicaciones.get(i);

            double distancia = calcularDistanciaHaversine(
                    anterior.getLatitud(), anterior.getLongitud(),
                    actual.getLatitud(), actual.getLongitud()
            );

            distanciaTotal += distancia;
        }

        return distanciaTotal / 1000.0; // Convertir a kilÃ³metros
    }

    /**
     * FÃ³rmula de Haversine para calcular distancia entre dos puntos GPS
     * @return distancia en metros
     */
    private double calcularDistanciaHaversine(double lat1, double lon1, double lat2, double lon2) {
        double latDistancia = Math.toRadians(lat2 - lat1);
        double lonDistancia = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistancia / 2) * Math.sin(latDistancia / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistancia / 2) * Math.sin(lonDistancia / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return RADIO_TIERRA_KM * c * 1000; // Convertir a metros
    }

    /**
     * Calcula distancia y ETA usando Google Maps API si estÃ¡ configurado,
     * sino usa cÃ¡lculo con Haversine como fallback
     */
    private void calcularDistanciaYEtaConGoogleMaps(
            UbicacionProveedor ubicacion,
            double latDestino,
            double lonDestino,
            String tipoTransporte) {
        
        // Si estÃ¡ configurado para usar Google Maps, intentar primero
        if ("google".equalsIgnoreCase(etaCalculationMethod)) {
            try {
                GoogleMapsService.DistanciaInfo info = googleMapsService.calcularDistanciaYTiempo(
                        ubicacion.getLatitud(),
                        ubicacion.getLongitud(),
                        latDestino,
                        lonDestino,
                        tipoTransporte
                );

                if (info != null) {
                    ubicacion.setDistanciaRestanteMetros((double) info.distanciaMetros());
                    ubicacion.setEtaMinutos(info.duracionConTraficoMinutos());

                    // Actualizar estado basado en distancia
                    actualizarEstadoPorDistancia(ubicacion);

                    log.debug("ETA calculado con Google Maps: {} min (con trÃ¡fico), {} m",
                            info.duracionConTraficoMinutos(), info.distanciaMetros());
                    return;
                }
            } catch (Exception e) {
                log.warn("Error al usar Google Maps API, usando fallback: {}", e.getMessage());
            }
        }

        // Fallback: usar cÃ¡lculo con Haversine (mÃ©todo original)
        ubicacion.calcularDistanciaYEta(latDestino, lonDestino);
        log.debug("ETA calculado con Haversine: {} min, {} m",
                ubicacion.getEtaMinutos(), ubicacion.getDistanciaRestanteMetros());
    }

    /**
     * Actualiza el estado del proveedor segÃºn la distancia al destino
     */
    private void actualizarEstadoPorDistancia(UbicacionProveedor ubicacion) {
        Double distancia = ubicacion.getDistanciaRestanteMetros();
        if (distancia == null) return;

        if (distancia < ALERTA_DISTANCIA_LLEGADO) {
            ubicacion.setEstado(UbicacionProveedor.EstadoMovimiento.LLEGADO);
        } else if (distancia < ALERTA_DISTANCIA_500M) {
            ubicacion.setEstado(UbicacionProveedor.EstadoMovimiento.LLEGANDO);
        } else {
            ubicacion.setEstado(UbicacionProveedor.EstadoMovimiento.EN_RUTA);
        }
    }
}

