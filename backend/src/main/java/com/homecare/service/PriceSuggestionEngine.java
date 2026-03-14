package com.homecare.service;

import com.homecare.dto.AIDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class PriceSuggestionEngine {

    private final Map<String, LinearModel> modelsByService = new ConcurrentHashMap<>();
    private final Map<Long, Double> providerBias = new ConcurrentHashMap<>();

    public AIDTO.PrecioRecomendado suggestPrice(Long proveedorId,
                                                String tipoLimpieza,
                                                Integer metrosCuadrados,
                                                String zona,
                                                BigDecimal promedioHistoricoProveedor) {

        int metros = metrosCuadrados != null ? Math.max(metrosCuadrados, 10) : 50;
        String serviceKey = normalizeService(tipoLimpieza);
        String zoneKey = normalizeZone(zona);

        BigDecimal rulePrice = priceByRules(serviceKey, metros, zoneKey);
        LinearModel model = modelsByService.computeIfAbsent(serviceKey, k -> LinearModel.defaultModel());

        double zoneFactor = zoneFactor(zoneKey);
        double providerAdj = providerBias.getOrDefault(proveedorId, 0.0);
        double modelPred = model.predict(metros, zoneFactor, providerAdj);

        BigDecimal modelPrice = bd(modelPred);
        BigDecimal historical = promedioHistoricoProveedor != null && promedioHistoricoProveedor.signum() > 0
                ? promedioHistoricoProveedor
                : rulePrice;

        BigDecimal blended = rulePrice.multiply(new BigDecimal("0.45"))
                .add(modelPrice.multiply(new BigDecimal("0.35")))
                .add(historical.multiply(new BigDecimal("0.20")))
                .setScale(2, RoundingMode.HALF_UP);

        List<String> factores = new ArrayList<>();
        factores.add("tipo=" + serviceKey);
        factores.add("zona=" + zoneKey);
        factores.add("m2=" + metros);
        if (promedioHistoricoProveedor != null) {
            factores.add("historial_proveedor=" + promedioHistoricoProveedor);
        }

        double confianza = Math.min(0.95, 0.6 + model.samples * 0.01);

        return AIDTO.PrecioRecomendado.builder()
                .precioSugerido(blended)
                .rangoMinimo(blended.multiply(new BigDecimal("0.90")).setScale(2, RoundingMode.HALF_UP))
                .rangoMaximo(blended.multiply(new BigDecimal("1.10")).setScale(2, RoundingMode.HALF_UP))
                .razon("Hibrido reglas + aprendizaje por ofertas aceptadas")
                .confianza(confianza)
                .factores(factores)
                .build();
    }

    public void registerFeedback(Long proveedorId,
                                 String tipoLimpieza,
                                 Integer metrosCuadrados,
                                 String zona,
                                 BigDecimal acceptedPrice) {
        if (acceptedPrice == null || acceptedPrice.signum() <= 0) {
            return;
        }

        int metros = metrosCuadrados != null ? Math.max(metrosCuadrados, 10) : 50;
        String serviceKey = normalizeService(tipoLimpieza);
        String zoneKey = normalizeZone(zona);

        LinearModel model = modelsByService.computeIfAbsent(serviceKey, k -> LinearModel.defaultModel());
        double zone = zoneFactor(zoneKey);
        double bias = providerBias.getOrDefault(proveedorId, 0.0);

        double prediction = model.predict(metros, zone, bias);
        double target = acceptedPrice.doubleValue();
        double error = target - prediction;

        double lr = 0.0008;
        synchronized (model) {
            model.intercept += lr * error;
            model.m2Weight += lr * error * metros;
            model.zoneWeight += lr * error * zone;
            model.samples++;
        }

        providerBias.merge(proveedorId, error * 0.01, Double::sum);

        log.debug("Price model feedback aplicado: service={}, error={}, samples={}",
                serviceKey, String.format("%.4f", error), model.samples);
    }

    private BigDecimal priceByRules(String serviceKey, int metros, String zoneKey) {
        BigDecimal base = switch (serviceKey) {
            case "PROFUNDA" -> new BigDecimal("80.00");
            case "OFICINA" -> new BigDecimal("65.00");
            case "POST_CONSTRUCCION" -> new BigDecimal("95.00");
            case "MUDANZA" -> new BigDecimal("75.00");
            case "DESINFECCION" -> new BigDecimal("70.00");
            default -> new BigDecimal("55.00");
        };

        BigDecimal area = new BigDecimal(metros).multiply(new BigDecimal("0.55"));
        BigDecimal zoneAdj = new BigDecimal(zoneFactor(zoneKey)).multiply(new BigDecimal("4.00"));

        return base.add(area).add(zoneAdj).setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal bd(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private static String normalizeService(String value) {
        return value == null ? "BASICA" : value.trim().toUpperCase();
    }

    private static String normalizeZone(String value) {
        return value == null ? "GENERAL" : value.trim().toUpperCase();
    }

    private static double zoneFactor(String zone) {
        return switch (zone) {
            case "NORTE" -> 2.0;
            case "CENTRO" -> 1.5;
            case "ESTE" -> 1.3;
            case "OESTE" -> 1.2;
            case "SUR" -> 1.0;
            default -> 1.1;
        };
    }

    private static class LinearModel {
        double intercept;
        double m2Weight;
        double zoneWeight;
        int samples;

        static LinearModel defaultModel() {
            LinearModel model = new LinearModel();
            model.intercept = 35.0;
            model.m2Weight = 0.55;
            model.zoneWeight = 6.0;
            model.samples = 0;
            return model;
        }

        double predict(int m2, double zone, double providerAdj) {
            return intercept + (m2Weight * m2) + (zoneWeight * zone) + providerAdj;
        }
    }
}
