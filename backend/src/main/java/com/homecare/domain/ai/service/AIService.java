package com.homecare.domain.ai.service;

import com.homecare.dto.AIDTO;
import com.homecare.domain.offer.model.Oferta;
import com.homecare.domain.offer.repository.OfertaRepository;
import com.homecare.domain.solicitud.repository.SolicitudRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIService {

    private final PriceSuggestionEngine priceSuggestionEngine;
    private final OfertaRepository ofertaRepository;
    private final SolicitudRepository solicitudRepository;

    public AIDTO.PrecioRecomendado recomendarPrecioProveedor(Long proveedorId, String tipoLimpieza,
                                                             Integer metrosCuadrados, String zona) {
    BigDecimal promedioHistorico = ofertaRepository.getPromedioPreciosAceptadosByProveedor(proveedorId);

    AIDTO.PrecioRecomendado recomendacion = priceSuggestionEngine.suggestPrice(
        proveedorId,
        tipoLimpieza,
        metrosCuadrados,
        zona,
        promedioHistorico
    );

        log.info("Precio recomendado para proveedor {}: {} (zona: {}, m2: {})",
        proveedorId, recomendacion.getPrecioSugerido(), zona, metrosCuadrados);

    return recomendacion;
    }

    public void registrarFeedbackPrecio(Oferta ofertaAceptada) {
    if (ofertaAceptada == null || ofertaAceptada.getSolicitud() == null) {
        return;
    }

    String zonaInferida = inferirZona(ofertaAceptada.getSolicitud().getDireccion());
    Integer metros = ofertaAceptada.getSolicitud().getMetrosCuadrados() != null
        ? ofertaAceptada.getSolicitud().getMetrosCuadrados().intValue()
        : 50;

    priceSuggestionEngine.registerFeedback(
        ofertaAceptada.getProveedor().getId(),
        ofertaAceptada.getSolicitud().getTipoLimpieza().name(),
        metros,
        zonaInferida,
        ofertaAceptada.getPrecioOfrecido()
    );

    log.info("Feedback de precio registrado para oferta {}", ofertaAceptada.getId());
    }

    /**
     * Predice el nivel de demanda para una zona y fecha a partir de solicitudes reales
     * en los últimos 7 días. Considera día de la semana como factor adicional.
     */
    public AIDTO.PrediccionDemanda predecirDemanda(String zona, LocalDate fecha) {
        LocalDateTime desde = LocalDateTime.now().minusDays(7);
        long totalRecientes;
        try {
            totalRecientes = solicitudRepository.countSolicitudesDesde(desde);
        } catch (Exception e) {
            log.warn("Error al contar solicitudes para predicción de demanda: {}", e.getMessage());
            totalRecientes = 0;
        }

        // Factor día de la semana: lun–vie tienen más demanda que fines de semana
        DayOfWeek dow = fecha.getDayOfWeek();
        double factorDia = (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) ? 0.8 : 1.0;

        // Escalar a solicitudes por día y aplicar factor
        double solicitudesPorDia = (totalRecientes / 7.0) * factorDia;

        String nivelDemanda;
        int confianza;
        if (solicitudesPorDia < 3) {
            nivelDemanda = "BAJA";
            confianza    = 70;
        } else if (solicitudesPorDia < 10) {
            nivelDemanda = "MEDIA";
            confianza    = 80;
        } else {
            nivelDemanda = "ALTA";
            confianza    = 90;
        }

        Map<String, String> factores = new HashMap<>();
        factores.put("dia_semana",       dow.name());
        factores.put("zona",             zona != null ? zona : "GENERAL");
        factores.put("solicitudes_7d",   String.valueOf(totalRecientes));
        factores.put("solicitudes_por_dia", String.format("%.1f", solicitudesPorDia));

        log.info("Predicción de demanda para zona {} en {}: {} (confianza {}%, {} solicitudes/día)",
                zona, fecha, nivelDemanda, confianza, String.format("%.1f", solicitudesPorDia));

        return new AIDTO.PrediccionDemanda(nivelDemanda, confianza, factores);
    }

    /**
     * Detecta si una oferta es sospechosa comparando su precio con el promedio
     * de mercado de ofertas aceptadas. Una oferta es sospechosa si está más del
     * 70% por debajo del promedio (posible bait-and-switch) o más del 400% por encima.
     */
    public AIDTO.DeteccionFraude detectarFraudeOferta(Long ofertaId, BigDecimal precio,
                                                       Integer tiempoEstimado) {
        BigDecimal promedioMercado;
        try {
            promedioMercado = ofertaRepository.getPromedioPreciosAceptadosGlobal();
        } catch (Exception e) {
            log.warn("Error al obtener promedio de mercado para oferta {}: {}", ofertaId, e.getMessage());
            promedioMercado = null;
        }

        boolean sospechoso;
        int riesgo;
        String razon;

        if (promedioMercado == null || promedioMercado.compareTo(BigDecimal.ZERO) == 0) {
            // Sin datos históricos: usar rangos absolutos razonables (COP)
            sospechoso = precio.compareTo(new BigDecimal("5000"))  < 0
                      || precio.compareTo(new BigDecimal("2000000")) > 0;
            riesgo     = sospechoso ? 60 : 10;
            razon      = sospechoso ? "Precio fuera del rango absoluto esperado (COP 5.000 – 2.000.000)" : null;
        } else {
            // Comparar con promedio de mercado
            double ratio = precio.divide(promedioMercado, 4, RoundingMode.HALF_UP).doubleValue();
            if (ratio < 0.30) {
                sospechoso = true;
                riesgo     = Math.min(95, (int) ((0.30 - ratio) / 0.30 * 100) + 50);
                razon      = String.format("Precio %.0f%% por debajo del promedio de mercado (posible engaño)", (1 - ratio) * 100);
            } else if (ratio > 4.0) {
                sospechoso = true;
                riesgo     = Math.min(80, (int) ((ratio - 4.0) * 15) + 50);
                razon      = String.format("Precio %.0fx el promedio de mercado (precio inflado)", ratio);
            } else {
                sospechoso = false;
                riesgo     = (int) (Math.abs(1.0 - ratio) * 20);
                razon      = null;
            }
        }

        log.info("Detección de fraude para oferta {}: {} (riesgo {}%)", ofertaId,
                sospechoso ? "SOSPECHOSO" : "OK", riesgo);

        return new AIDTO.DeteccionFraude(ofertaId, sospechoso, riesgo, razon);
    }

    private String inferirZona(String direccion) {
        if (direccion == null || direccion.isBlank()) {
            return "GENERAL";
        }

        String text = direccion.toUpperCase();
        if (text.contains("NORTE")) return "NORTE";
        if (text.contains("SUR")) return "SUR";
        if (text.contains("ESTE") || text.contains("ORIENTE")) return "ESTE";
        if (text.contains("OESTE") || text.contains("OCCIDENTE")) return "OESTE";
        if (text.contains("CENTRO")) return "CENTRO";
        return "GENERAL";
    }
}

