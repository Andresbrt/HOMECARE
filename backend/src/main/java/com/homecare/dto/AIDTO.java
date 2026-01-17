package com.homecare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTOs para servicios de inteligencia artificial
 */
public class AIDTO {

    /**
     * DTO para recomendaciones de precio
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrecioRecomendado {
        private BigDecimal precioSugerido;
        private BigDecimal rangoMinimo;
        private BigDecimal rangoMaximo;
        private String razon;
        private Double confianza; // 0-1
        private List<String> factores; // Factores considerados

        // Constructor para compatibilidad con AIService
        public PrecioRecomendado(BigDecimal precioSugerido, BigDecimal rangoMinimo, BigDecimal rangoMaximo, String razon) {
            this.precioSugerido = precioSugerido;
            this.rangoMinimo = rangoMinimo;
            this.rangoMaximo = rangoMaximo;
            this.razon = razon;
            this.confianza = 0.85;
        }
    }

    /**
     * DTO para predicción de demanda
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrediccionDemanda {
        private String zona;
        private String fecha;
        private Integer demandaEsperada;
        private String nivelDemanda; // baja, media, alta
        private Double confianza;
        private List<String> recomendaciones;
        private java.util.Map<String, String> factores;

        // Constructor para compatibilidad con AIService
        public PrediccionDemanda(String nivelDemanda, int confianza, java.util.Map<String, String> factores) {
            this.nivelDemanda = nivelDemanda;
            this.confianza = (double) confianza / 100;
            this.factores = factores;
        }
    }

    /**
     * DTO para detección de fraude
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeteccionFraude {
        private Boolean esPosibleFraude;
        private String nivelRiesgo; // bajo, medio, alto
        private Double puntajeFraude; // 0-1
        private List<String> indicadores;
        private String accionRecomendada;
        private Long ofertaId;
        private String razon;

        // Constructor para compatibilidad con AIService
        public DeteccionFraude(Long ofertaId, boolean esPosibleFraude, int puntajeFraude, String razon) {
            this.ofertaId = ofertaId;
            this.esPosibleFraude = esPosibleFraude;
            this.puntajeFraude = (double) puntajeFraude / 100;
            this.razon = razon;
            this.nivelRiesgo = puntajeFraude > 50 ? "alto" : "bajo";
        }
    }

    /**
     * DTO para análisis de sentimientos
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnalisisSentimientos {
        private String sentimiento; // positivo, neutro, negativo
        private Double puntaje; // -1 a 1
        private String emocionPrimaria;
        private List<String> palabrasClave;
    }

    /**
     * DTO para recomendaciones personalizadas
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Recomendacion {
        private String tipo;
        private String titulo;
        private String descripcion;
        private Double relevancia;
        private String motivo;
    }
}