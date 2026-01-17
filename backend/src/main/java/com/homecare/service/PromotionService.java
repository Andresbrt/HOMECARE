package com.homecare.service;

import com.homecare.dto.PromotionDTO;
import com.homecare.exception.BadRequestException;
import com.homecare.exception.NotFoundException;
import com.homecare.model.Coupon;
import com.homecare.model.Promotion;
import com.homecare.model.Usuario;
import com.homecare.repository.CouponRepository;
import com.homecare.repository.PromotionRepository;
import com.homecare.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final CouponRepository couponRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public PromotionDTO.Response validarPromocion(String codigo, Long usuarioId) {
        Promotion promocion = promotionRepository.findByCodigo(codigo)
                .orElseThrow(() -> new NotFoundException("Promoción no encontrada"));

        LocalDate hoy = LocalDate.now();

        if (!promocion.getActiva()) {
            throw new BadRequestException("La promoción no está activa");
        }

        if (hoy.isBefore(promocion.getFechaInicio()) || hoy.isAfter(promocion.getFechaFin())) {
            throw new BadRequestException("La promoción no es válida en estas fechas");
        }

        if (promocion.getUsoActual() >= promocion.getUsoMaximo()) {
            throw new BadRequestException("La promoción ha alcanzado su uso máximo");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        boolean tieneRolAplicable = switch (promocion.getAplicaA()) {
            case CUSTOMER -> usuario.getRoles().stream()
                    .anyMatch(r -> r.getNombre().equals("ROLE_CUSTOMER"));
            case SERVICE_PROVIDER -> usuario.getRoles().stream()
                    .anyMatch(r -> r.getNombre().equals("ROLE_SERVICE_PROVIDER"));
            case ALL, SERVICIOS, SUSCRIPCIONES -> true;
        };

        if (!tieneRolAplicable) {
            throw new BadRequestException("Esta promoción no aplica para tu tipo de cuenta");
        }

        if (couponRepository.existsByPromocionIdAndUsuarioIdAndUsadoTrue(
                promocion.getId(), usuarioId)) {
            throw new BadRequestException("Ya has usado esta promoción");
        }

        return mapToResponse(promocion);
    }

    @Transactional
    public BigDecimal aplicarDescuento(Long promocionId, Long usuarioId, BigDecimal montoOriginal) {
        Promotion promocion = promotionRepository.findById(promocionId)
                .orElseThrow(() -> new NotFoundException("Promoción no encontrada"));

        BigDecimal descuento;
        if (promocion.getDescuentoPorcentaje() != null) {
            descuento = montoOriginal.multiply(promocion.getDescuentoPorcentaje())
                    .divide(new BigDecimal("100"));
        } else if (promocion.getDescuentoFijo() != null) {
            descuento = promocion.getDescuentoFijo();
        } else {
            throw new BadRequestException("Promoción sin descuento configurado");
        }

        BigDecimal montoFinal = montoOriginal.subtract(descuento);
        if (montoFinal.compareTo(BigDecimal.ZERO) < 0) {
            montoFinal = BigDecimal.ZERO;
        }

        promocion.setUsoActual(promocion.getUsoActual() + 1);
        promotionRepository.save(promocion);

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        Coupon coupon = couponRepository.findByPromocionIdAndUsuarioId(promocionId, usuarioId)
                .orElseGet(() -> {
                    Coupon newCoupon = new Coupon();
                    newCoupon.setPromocion(promocion);
                    newCoupon.setUsuario(usuario);
                    return newCoupon;
                });

        coupon.setUsado(true);
        coupon.setUsadoAt(LocalDateTime.now());
        couponRepository.save(coupon);

        log.info("Descuento aplicado: {} -> {} para usuario {} con promoción {}",
                montoOriginal, montoFinal, usuarioId, promocion.getCodigo());

        return montoFinal;
    }

    @Transactional
    public PromotionDTO.Response crearPromocion(PromotionDTO.Crear request) {
        if (promotionRepository.existsByCodigo(request.getCodigo())) {
            throw new BadRequestException("Ya existe una promoción con ese código");
        }

        Promotion promocion = new Promotion();
        promocion.setCodigo(request.getCodigo());
        promocion.setDescripcion(request.getDescripcion());
        promocion.setDescuentoPorcentaje(request.getDescuentoPorcentaje());
        promocion.setDescuentoFijo(request.getDescuentoFijo());
        promocion.setFechaInicio(request.getFechaInicio());
        promocion.setFechaFin(request.getFechaFin());
        promocion.setUsoMaximo(request.getUsoMaximo());
        promocion.setAplicaA(request.getAplicaA());
        promocion.setActiva(true);

        promocion = promotionRepository.save(promocion);
        log.info("Promoción creada: {} - {}", promocion.getCodigo(), promocion.getDescripcion());
        return mapToResponse(promocion);
    }

    public List<PromotionDTO.Response> obtenerPromocionesActivas() {
        LocalDate hoy = LocalDate.now();
        List<Promotion> promociones = promotionRepository.findPromocionesActivas(hoy);
        return promociones.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private PromotionDTO.Response mapToResponse(Promotion promocion) {
        return new PromotionDTO.Response(
                promocion.getId(),
                promocion.getCodigo(),
                promocion.getDescripcion(),
                promocion.getDescuentoPorcentaje(),
                promocion.getDescuentoFijo(),
                promocion.getFechaInicio(),
                promocion.getFechaFin(),
                promocion.getUsoMaximo(),
                promocion.getUsoActual(),
                promocion.getAplicaA(),
                promocion.getActiva()
        );
    }
}
