package com.homecare.domain.marketing.controller;

import com.homecare.dto.PromotionDTO;
import com.homecare.security.CustomUserDetails;
import com.homecare.domain.marketing.service.PromotionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
@Tag(name = "Promotions", description = "GestiÃ³n de promociones y cupones")
@SecurityRequirement(name = "bearerAuth")
public class PromotionController {

    private final PromotionService promotionService;

    @PostMapping("/validate")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Validar cÃ³digo de promociÃ³n")
    public ResponseEntity<PromotionDTO.Response> validarPromocion(
            @RequestParam String codigo,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        PromotionDTO.Response response = promotionService.validarPromocion(
                codigo, userDetails.getId()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar promociones activas")
    public ResponseEntity<List<PromotionDTO.Response>> obtenerPromocionesActivas() {
        List<PromotionDTO.Response> promociones = promotionService.obtenerPromocionesActivas();
        return ResponseEntity.ok(promociones);
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Crear nueva promociÃ³n (solo admin)")
    public ResponseEntity<PromotionDTO.Response> crearPromocion(
            @Valid @RequestBody PromotionDTO.Crear request) {

        PromotionDTO.Response response = promotionService.crearPromocion(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

