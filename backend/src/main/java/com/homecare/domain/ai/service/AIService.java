package com.homecare.domain.ai.service;

import com.homecare.dto.AIDTO;
import com.homecare.domain.offer.model.Oferta;
import com.homecare.domain.offer.repository.OfertaRepository;
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

    private final PriceSuggestionEngine priceSuggestionEngine;
    private final OfertaRepository ofertaRepository;

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

    public AIDTO.PrediccionDemanda predecirDemanda(String zona, LocalDate fecha) {
        // Mock de predicciÃ³n de demanda
        Map<String, String> factores = new HashMap<>();
        factores.put("dia_semana", fecha.getDayOfWeek().name());
        factores.put("zona", zona);
        factores.put("temporada", "ALTA");

        log.info("PredicciÃ³n de demanda para zona {} en fecha {}", zona, fecha);

        return new AIDTO.PrediccionDemanda(
                "ALTA",
                85,
                factores
        );
    }

    public AIDTO.DeteccionFraude detectarFraudeOferta(Long ofertaId, BigDecimal precio,
                                                       Integer tiempoEstimado) {
        // Mock de detecciÃ³n de fraude
        boolean sospechoso = precio.compareTo(new BigDecimal("10.00")) < 0 || 
                            precio.compareTo(new BigDecimal("1000.00")) > 0;

        String razon = sospechoso ? "Precio fuera del rango normal" : null;

        log.info("DetecciÃ³n de fraude para oferta {}: {}", ofertaId, sospechoso ? "SOSPECHOSO" : "OK");

        return new AIDTO.DeteccionFraude(
                ofertaId,
                sospechoso,
                sospechoso ? 75 : 5,
                razon
        );
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

