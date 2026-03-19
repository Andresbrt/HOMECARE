package com.homecare.domain.offer.controller;

import com.homecare.dto.OfertaDTO;
import com.homecare.domain.offer.model.Oferta.EstadoOferta;
import com.homecare.security.CustomUserDetails;
import com.homecare.domain.offer.service.OfertaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ofertas")
@RequiredArgsConstructor
@Tag(name = "Ofertas", description = "GestiÃ³n de ofertas competitivas (Modelo inDriver)")
@SecurityRequirement(name = "bearerAuth")
public class OfertaController {

    private final OfertaService ofertaService;

    @PostMapping
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    @Operation(summary = "Enviar oferta (Proveedor compite con SU precio)")
    public ResponseEntity<OfertaDTO.Response> enviarOferta(
            @Valid @RequestBody OfertaDTO.Crear request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        OfertaDTO.Response response = ofertaService.enviarOferta(userDetails.getId(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{ofertaId}")
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    @Operation(summary = "Actualizar oferta pendiente")
    public ResponseEntity<OfertaDTO.Response> actualizarOferta(
            @PathVariable Long ofertaId,
            @Valid @RequestBody OfertaDTO.Actualizar request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        OfertaDTO.Response response = ofertaService.actualizarOferta(
                ofertaId, userDetails.getId(), request
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{ofertaId}")
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    @Operation(summary = "Retirar oferta")
    public ResponseEntity<Void> retirarOferta(
            @PathVariable Long ofertaId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        ofertaService.retirarOferta(ofertaId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/aceptar")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Aceptar oferta (Cliente elige MANUALMENTE)")
    public ResponseEntity<OfertaDTO.AceptarResponse> aceptarOferta(
            @Valid @RequestBody OfertaDTO.Aceptar request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        OfertaDTO.AceptarResponse response = ofertaService.aceptarOferta(
                request.getOfertaId(), userDetails.getId()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/solicitud/{solicitudId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Ver TODAS las ofertas de una solicitud (Cliente compara)")
    public ResponseEntity<List<OfertaDTO.Response>> obtenerOfertasPorSolicitud(
            @PathVariable Long solicitudId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<OfertaDTO.Response> ofertas = ofertaService.obtenerOfertasPorSolicitud(
                solicitudId, userDetails.getId()
        );
        return ResponseEntity.ok(ofertas);
    }

    @GetMapping("/mis-ofertas")
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    @Operation(summary = "Obtener mis ofertas")
    public ResponseEntity<List<OfertaDTO.Response>> obtenerMisOfertas(
            @RequestParam(required = false) EstadoOferta estado,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<OfertaDTO.Response> ofertas = ofertaService.obtenerMisOfertas(
                userDetails.getId(), estado
        );
        return ResponseEntity.ok(ofertas);
    }

    @GetMapping("/{ofertaId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN')")
    @Operation(summary = "Obtener detalle de oferta")
    public ResponseEntity<OfertaDTO.Response> obtenerOferta(
            @PathVariable Long ofertaId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        OfertaDTO.Response response = ofertaService.obtenerOferta(ofertaId, userDetails.getId());
        return ResponseEntity.ok(response);
    }
}

