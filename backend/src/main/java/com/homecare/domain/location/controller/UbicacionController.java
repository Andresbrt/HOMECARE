package com.homecare.domain.location.controller;

import com.homecare.dto.UbicacionDTO;
import com.homecare.security.CustomUserDetails;
import com.homecare.domain.location.service.GoogleMapsService;
import com.homecare.domain.location.service.UbicacionService;
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
 * Controlador para geolocalizaciÃ³n en tiempo real del proveedor
 * Combina REST API para operaciones estÃ¡ndar y WebSocket para actualizaciones en tiempo real
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
     * Actualiza la ubicaciÃ³n del proveedor (tambiÃ©n puede usarse vÃ­a REST)
     */
    @PostMapping("/actualizar")
    @Operation(summary = "Actualizar ubicaciÃ³n del proveedor", description = "Guarda ubicaciÃ³n actual y notifica a suscriptores de tracking")
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
     * Obtiene la Ãºltima ubicaciÃ³n conocida del proveedor para una solicitud
     */
    @GetMapping("/solicitud/{solicitudId}/ultima")
    @Operation(summary = "Obtener Ãºltima ubicaciÃ³n", description = "Retorna el Ãºltimo punto reportado por el proveedor para la solicitud")
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
     * Obtiene la trayectoria completa (ruta histÃ³rica) del proveedor
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
     * Obtiene estadÃ­sticas del tracking (velocidad promedio, distancia recorrida, etc.)
     */
    @GetMapping("/solicitud/{solicitudId}/estadisticas")
    @Operation(summary = "Obtener estadÃ­sticas de tracking", description = "Calcula mÃ©tricas de ruta, velocidad y tiempos del servicio")
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
     * Obtiene la ruta Ã³ptima usando Google Maps Directions API
     * Incluye ETA con trÃ¡fico en tiempo real y pasos de navegaciÃ³n
     */
    @GetMapping("/ruta")
    @Operation(summary = "Calcular ruta Ã³ptima", description = "Usa Google Maps para devolver distancia, tiempo estimado y pasos de ruta")
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
     * Convierte una direcciÃ³n de texto a coordenadas GPS
     */
    @GetMapping("/geocode")
    @Operation(summary = "Geocodificar direcciÃ³n", description = "Convierte una direcciÃ³n textual en coordenadas geogrÃ¡ficas")
    public ResponseEntity<GoogleMapsService.Coordenadas> geocodificar(
            @RequestParam String direccion) {
        
        log.info("GET /api/tracking/geocode - DirecciÃ³n: {}", direccion);

        GoogleMapsService.Coordenadas coords = googleMapsService.geocodificarDireccion(direccion);

        if (coords == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(coords);
    }

    // ==================== WEBSOCKET ENDPOINTS ====================

    /**
     * WebSocket: /app/tracking/actualizar
     * Actualiza ubicaciÃ³n en tiempo real vÃ­a WebSocket
     * El proveedor envÃ­a su ubicaciÃ³n cada 5-10 segundos
     * 
     * Broadcast automÃ¡tico a: /topic/tracking/{solicitudId}
     */
    @MessageMapping("/tracking/actualizar")
    public void actualizarUbicacionWebSocket(
            @Payload UbicacionDTO.ActualizarUbicacion dto,
            Principal principal) {
        
        CustomUserDetails userDetails = (CustomUserDetails) 
                ((org.springframework.security.authentication.UsernamePasswordAuthenticationToken) principal)
                        .getPrincipal();

        log.debug("WebSocket - ActualizaciÃ³n de ubicaciÃ³n: Proveedor {}, Solicitud {}", 
                  userDetails.getId(), dto.getSolicitudId());

        // El servicio se encarga de guardar y transmitir vÃ­a WebSocket
        ubicacionService.actualizarUbicacion(userDetails.getId(), dto);
    }

    /**
     * WebSocket: /topic/tracking/{solicitudId}
     * Los clientes se suscriben para recibir actualizaciones de ubicaciÃ³n en tiempo real
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

        // Retornar Ãºltima ubicaciÃ³n conocida al suscribirse
        try {
            // Obtener la Ãºltima ubicaciÃ³n de cualquier proveedor en esta solicitud
            // Para eso necesitamos obtener el proveedorId de la solicitud
            // Por simplicidad, retornamos null y el cliente harÃ¡ un GET a /api/tracking/solicitud/{id}/ultima
            return null;
        } catch (Exception e) {
            log.warn("No hay ubicaciÃ³n previa para solicitud {}: {}", solicitudId, e.getMessage());
            return null;
        }
    }

    /**
     * WebSocket: /topic/tracking/{solicitudId}/alertas
     * Los clientes se suscriben para recibir alertas de proximidad
     * 
     * Alertas automÃ¡ticas cuando el proveedor:
     * - EstÃ¡ a menos de 1 km
     * - EstÃ¡ a menos de 500 m
     * - EstÃ¡ a menos de 100 m
     * - Ha llegado al destino
     */
    @SubscribeMapping("/tracking/{solicitudId}/alertas")
    public void suscribirseAAlertas(@DestinationVariable Long solicitudId) {
        log.info("Cliente suscrito a alertas de proximidad para solicitud: {}", solicitudId);
        // No retornamos nada, solo confirmamos la suscripciÃ³n
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

