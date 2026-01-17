package com.homecare.service;

import com.homecare.dto.AIDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIService {

    // Placeholder para integración futura con modelos ML

    public AIDTO.PrecioRecomendado recomendarPrecioProveedor(Long proveedorId, String tipoLimpieza,
                                                             Integer metrosCuadrados, String zona) {
        // Mock de recomendación de precio basada en ML
        BigDecimal precioBase = new BigDecimal("50.00");
        BigDecimal ajusteZona = calcularAjusteZona(zona);
        BigDecimal ajusteMetros = BigDecimal.valueOf(metrosCuadrados * 0.5);

        BigDecimal precioRecomendado = precioBase.add(ajusteZona).add(ajusteMetros);

        log.info("Precio recomendado para proveedor {}: {} (zona: {}, m2: {})",
                proveedorId, precioRecomendado, zona, metrosCuadrados);

        return new AIDTO.PrecioRecomendado(
                precioRecomendado,
                precioRecomendado.multiply(new BigDecimal("0.9")), // -10%
                precioRecomendado.multiply(new BigDecimal("1.1")), // +10%
                "Basado en servicios similares en tu zona"
        );
    }

    public AIDTO.PrediccionDemanda predecirDemanda(String zona, LocalDate fecha) {
        // Mock de predicción de demanda
        Map<String, String> factores = new HashMap<>();
        factores.put("dia_semana", fecha.getDayOfWeek().name());
        factores.put("zona", zona);
        factores.put("temporada", "ALTA");

        log.info("Predicción de demanda para zona {} en fecha {}", zona, fecha);

        return new AIDTO.PrediccionDemanda(
                "ALTA",
                85,
                factores
        );
    }

    public AIDTO.DeteccionFraude detectarFraudeOferta(Long ofertaId, BigDecimal precio,
                                                       Integer tiempoEstimado) {
        // Mock de detección de fraude
        boolean sospechoso = precio.compareTo(new BigDecimal("10.00")) < 0 || 
                            precio.compareTo(new BigDecimal("1000.00")) > 0;

        String razon = sospechoso ? "Precio fuera del rango normal" : null;

        log.info("Detección de fraude para oferta {}: {}", ofertaId, sospechoso ? "SOSPECHOSO" : "OK");

        return new AIDTO.DeteccionFraude(
                ofertaId,
                sospechoso,
                sospechoso ? 75 : 5,
                razon
        );
    }

    private BigDecimal calcularAjusteZona(String zona) {
        return switch (zona.toUpperCase()) {
            case "NORTE" -> new BigDecimal("10.00");
            case "SUR" -> new BigDecimal("5.00");
            case "ESTE" -> new BigDecimal("7.50");
            case "OESTE" -> new BigDecimal("8.00");
            default -> BigDecimal.ZERO;
        };
    }
}
