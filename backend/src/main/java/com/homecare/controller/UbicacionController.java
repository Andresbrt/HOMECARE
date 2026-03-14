package com.homecare.controller;

import com.homecare.dto.UbicacionDTO;
import com.homecare.security.CustomUserDetails;
import com.homecare.service.GoogleMapsService;
import com.homecare.service.UbicacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controlador para geolocalización en tiempo real del proveedor
 * Combina REST API para operaciones estándar y WebSocket para actualizaciones en tiempo real
 */
@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tracking Geoespacial", description = "Endpoints REST y WebSocket para tracking del proveedor en tiempo real")
@SecurityRequirement(name = "bearerAuth")
public class UbicacionController {

    private final UbicacionService ubicacionService;
    private final GoogleMapsService googleMapsService;

    // ==================== REST API ENDPOINTS ====================

    /**
     * POST /api/tracking/actualizar
     * Actualiza la ubicación del proveedor (también puede usarse vía REST)
     */
    @PostMapping("/actualizar")
    @Operation(summary = "Actualizar ubicación del proveedor", description = "Guarda ubicación actual y notifica a suscriptores de tracking")
    public ResponseEntity<UbicacionDTO.UbicacionResponse> actualizarUbicacion(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody UbicacionDTO.ActualizarUbicacion dto) {
        
        log.info("POST /api/tracking/actualizar - Proveedor: {}, Solicitud: {}", 
                 userDetails.getId(), dto.getSolicitudId());

        UbicacionDTO.UbicacionResponse response = ubicacionService.actualizarUbicacion(
                userDetails.getId(), dto);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/tracking/solicitud/{solicitudId}/ultima
     * Obtiene la última ubicación conocida del proveedor para una solicitud
     */
    @GetMapping("/solicitud/{solicitudId}/ultima")
    @Operation(summary = "Obtener última ubicación", description = "Retorna el último punto reportado por el proveedor para la solicitud")
    public ResponseEntity<UbicacionDTO.UbicacionResponse> obtenerUltimaUbicacion(
            @PathVariable Long solicitudId,
            @RequestParam Long proveedorId) {
        
        log.info("GET /api/tracking/solicitud/{}/ultima - Proveedor: {}", 
                 solicitudId, proveedorId);

        UbicacionDTO.UbicacionResponse response = ubicacionService.obtenerUltimaUbicacion(
                solicitudId, proveedorId);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/tracking/solicitud/{solicitudId}/trayectoria
     * Obtiene la trayectoria completa (ruta histórica) del proveedor
     */
    @GetMapping("/solicitud/{solicitudId}/trayectoria")
    @Operation(summary = "Obtener trayectoria completa", description = "Devuelve historial de puntos del recorrido del proveedor")
    public ResponseEntity<UbicacionDTO.Trayectoria> obtenerTrayectoria(
            @PathVariable Long solicitudId) {
        
        log.info("GET /api/tracking/solicitud/{}/trayectoria", solicitudId);

        UbicacionDTO.Trayectoria trayectoria = ubicacionService.obtenerTrayectoria(solicitudId);

        return ResponseEntity.ok(trayectoria);
    }

    /**
     * GET /api/tracking/solicitud/{solicitudId}/estadisticas
     * Obtiene estadísticas del tracking (velocidad promedio, distancia recorrida, etc.)
     */
    @GetMapping("/solicitud/{solicitudId}/estadisticas")
    @Operation(summary = "Obtener estadísticas de tracking", description = "Calcula métricas de ruta, velocidad y tiempos del servicio")
    public ResponseEntity<UbicacionDTO.EstadisticasTracking> obtenerEstadisticas(
            @PathVariable Long solicitudId) {
        
        log.info("GET /api/tracking/solicitud/{}/estadisticas", solicitudId);

        UbicacionDTO.EstadisticasTracking stats = ubicacionService.obtenerEstadisticas(solicitudId);

        return ResponseEntity.ok(stats);
    }

    /**
     * POST /api/tracking/solicitud/{solicitudId}/iniciar
     * Inicia el tracking para una solicitud (el proveedor comienza el viaje)
     */
    @PostMapping("/solicitud/{solicitudId}/iniciar")
    @Operation(summary = "Iniciar tracking", description = "Marca inicio del trayecto y genera alertas iniciales al cliente")
    public ResponseEntity<Void> iniciarTracking(
            @PathVariable Long solicitudId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("POST /api/tracking/solicitud/{}/iniciar - Proveedor: {}", 
                 solicitudId, userDetails.getId());

        ubicacionService.iniciarTracking(solicitudId, userDetails.getId());

        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/tracking/solicitud/{solicitudId}/finalizar
     * Finaliza el tracking (el proveedor ha llegado)
     */
    @PostMapping("/solicitud/{solicitudId}/finalizar")
    @Operation(summary = "Finalizar tracking", description = "Marca llegada del proveedor y detiene alertas de proximidad")
    public ResponseEntity<Void> finalizarTracking(
            @PathVariable Long solicitudId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("POST /api/tracking/solicitud/{}/finalizar - Proveedor: {}", 
                 solicitudId, userDetails.getId());

        ubicacionService.finalizarTracking(solicitudId, userDetails.getId());

        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/tracking/ruta
     * Obtiene la ruta óptima usando Google Maps Directions API
     * Incluye ETA con tráfico en tiempo real y pasos de navegación
     */
    @GetMapping("/ruta")
    @Operation(summary = "Calcular ruta óptima", description = "Usa Google Maps para devolver distancia, tiempo estimado y pasos de ruta")
    public ResponseEntity<GoogleMapsService.RutaInfo> obtenerRuta(
            @RequestParam Double latOrigen,
            @RequestParam Double lonOrigen,
            @RequestParam Double latDestino,
            @RequestParam Double lonDestino,
            @RequestParam(defaultValue = "auto") String tipoTransporte) {
        
        log.info("GET /api/tracking/ruta - Desde ({},{}) hasta ({},{}) en {}",
                latOrigen, lonOrigen, latDestino, lonDestino, tipoTransporte);

        GoogleMapsService.RutaInfo ruta = googleMapsService.calcularRuta(
                latOrigen, lonOrigen, latDestino, lonDestino, tipoTransporte);

        return ResponseEntity.ok(ruta);
    }

    /**
     * GET /api/tracking/geocode
     * Convierte una dirección de texto a coordenadas GPS
     */
    @GetMapping("/geocode")
    @Operation(summary = "Geocodificar dirección", description = "Convierte una dirección textual en coordenadas geográficas")
    public ResponseEntity<GoogleMapsService.Coordenadas> geocodificar(
            @RequestParam String direccion) {
        
        log.info("GET /api/tracking/geocode - Dirección: {}", direccion);

        GoogleMapsService.Coordenadas coords = googleMapsService.geocodificarDireccion(direccion);

        if (coords == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(coords);
    }

    // ==================== WEBSOCKET ENDPOINTS ====================

    /**
     * WebSocket: /app/tracking/actualizar
     * Actualiza ubicación en tiempo real vía WebSocket
     * El proveedor envía su ubicación cada 5-10 segundos
     * 
     * Broadcast automático a: /topic/tracking/{solicitudId}
     */
    @MessageMapping("/tracking/actualizar")
    public void actualizarUbicacionWebSocket(
            @Payload UbicacionDTO.ActualizarUbicacion dto,
            Principal principal) {
        
        CustomUserDetails userDetails = (CustomUserDetails) 
                ((org.springframework.security.authentication.UsernamePasswordAuthenticationToken) principal)
                        .getPrincipal();

        log.debug("WebSocket - Actualización de ubicación: Proveedor {}, Solicitud {}", 
                  userDetails.getId(), dto.getSolicitudId());

        // El servicio se encarga de guardar y transmitir vía WebSocket
        ubicacionService.actualizarUbicacion(userDetails.getId(), dto);
    }

    /**
     * WebSocket: /topic/tracking/{solicitudId}
     * Los clientes se suscriben para recibir actualizaciones de ubicación en tiempo real
     * 
     * Uso desde frontend:
     * stompClient.subscribe('/topic/tracking/123', (message) => {
     *     const ubicacion = JSON.parse(message.body);
     *     actualizarMapaEnTiempoReal(ubicacion);
     * });
     */
    @SubscribeMapping("/tracking/{solicitudId}")
    public UbicacionDTO.UbicacionResponse suscribirseATracking(
            @DestinationVariable Long solicitudId,
            Principal principal) {
        
        log.info("Cliente suscrito a tracking de solicitud: {}", solicitudId);

        // Retornar última ubicación conocida al suscribirse
        try {
            // Obtener la última ubicación de cualquier proveedor en esta solicitud
            // Para eso necesitamos obtener el proveedorId de la solicitud
            // Por simplicidad, retornamos null y el cliente hará un GET a /api/tracking/solicitud/{id}/ultima
            return null;
        } catch (Exception e) {
            log.warn("No hay ubicación previa para solicitud {}: {}", solicitudId, e.getMessage());
            return null;
        }
    }

    /**
     * WebSocket: /topic/tracking/{solicitudId}/alertas
     * Los clientes se suscriben para recibir alertas de proximidad
     * 
     * Alertas automáticas cuando el proveedor:
     * - Está a menos de 1 km
     * - Está a menos de 500 m
     * - Está a menos de 100 m
     * - Ha llegado al destino
     */
    @SubscribeMapping("/tracking/{solicitudId}/alertas")
    public void suscribirseAAlertas(@DestinationVariable Long solicitudId) {
        log.info("Cliente suscrito a alertas de proximidad para solicitud: {}", solicitudId);
        // No retornamos nada, solo confirmamos la suscripción
    }

    // ==================== ENDPOINTS ADICIONALES ====================

    /**
     * GET /api/tracking/health
     * Health check para el sistema de tracking
     */
    @GetMapping("/health")
    @Operation(summary = "Health check de tracking", description = "Verifica estado operativo de los componentes de tracking")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Tracking system is running");
    }
}
