package com.homecare.controller;

import com.homecare.dto.LocationDTO;
import com.homecare.security.CustomUserDetails;
import com.homecare.service.LocationService;
import com.homecare.service.TrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/location")
@RequiredArgsConstructor
@Tag(name = "Location & Tracking", description = "Geolocalización y tracking en tiempo real")
@SecurityRequirement(name = "bearerAuth")
public class LocationController {

    private final LocationService locationService;
    private final TrackingService trackingService;

    @PutMapping("/update")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Actualizar ubicación del usuario")
    public ResponseEntity<String> updateLocation(
            @Valid @RequestBody LocationDTO.UpdateLocation request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        locationService.actualizarUbicacionUsuario(userDetails.getId(), request);
        return ResponseEntity.ok("Ubicación actualizada");
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Obtener mi ubicación actual")
    public ResponseEntity<LocationDTO.LocationResponse> getMyLocation(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        LocationDTO.LocationResponse response = locationService.obtenerUbicacionUsuario(
                userDetails.getId()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/nearby-providers")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Buscar proveedores cercanos")
    public ResponseEntity<LocationDTO.NearbyProviders> getNearbyProviders(
            @RequestParam BigDecimal latitud,
            @RequestParam BigDecimal longitud,
            @RequestParam(defaultValue = "10.0") Double radioKm) {

        LocationDTO.NearbyProviders response = locationService.obtenerProveedoresCercanos(
                latitud, longitud, radioKm
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/calculate-distance")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Calcular distancia y tiempo entre dos puntos")
    public ResponseEntity<LocationDTO.DistanceCalculation> calculateDistance(
            @RequestParam BigDecimal origenLat,
            @RequestParam BigDecimal origenLng,
            @RequestParam BigDecimal destinoLat,
            @RequestParam BigDecimal destinoLng) {

        LocationDTO.DistanceCalculation response = locationService.calcularDistanciaYTiempo(
                origenLat, origenLng, destinoLat, destinoLng
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/tracking/update")
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    @Operation(summary = "Actualizar tracking durante servicio activo")
    public ResponseEntity<LocationDTO.LocationResponse> updateTracking(
            @Valid @RequestBody LocationDTO.TrackingUpdate request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        LocationDTO.LocationResponse response = trackingService.actualizarTracking(
                userDetails.getId(), request
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tracking/{servicioId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Obtener tracking completo de un servicio")
    public ResponseEntity<LocationDTO.TrackingResponse> getServiceTracking(
            @PathVariable Long servicioId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        LocationDTO.TrackingResponse response = trackingService.obtenerTrackingServicio(
                servicioId, userDetails.getId()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tracking/{servicioId}/route")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN')")
    @Operation(summary = "Obtener ruta completa del servicio")
    public ResponseEntity<List<LocationDTO.LocationPoint>> getServiceRoute(
            @PathVariable Long servicioId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {

        List<LocationDTO.LocationPoint> ruta = trackingService.obtenerRutaServicio(
                servicioId, inicio, fin
        );
        return ResponseEntity.ok(ruta);
    }

    @DeleteMapping("/tracking/{servicioId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Limpiar tracking de un servicio")
    public ResponseEntity<Void> clearTracking(@PathVariable Long servicioId) {
        trackingService.limpiarTrackingServicio(servicioId);
        return ResponseEntity.noContent().build();
    }
}
