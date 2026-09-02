package com.homecare.model;

import com.homecare.domain.solicitud.model.Solicitud;
import com.homecare.domain.user.model.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad UbicacionProveedor - Rastreo en tiempo real del proveedor
 * Almacena ubicaciones GPS del proveedor durante el servicio
 * Similar a Uber/inDriver tracking system
 */
@Entity
@Table(name = "ubicaciones_proveedor", indexes = {
        @Index(name = "idx_solicitud_timestamp", columnList = "solicitud_id, timestamp"),
        @Index(name = "idx_proveedor_timestamp", columnList = "proveedor_id, timestamp"),
        @Index(name = "idx_timestamp", columnList = "timestamp")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UbicacionProveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitud_id", nullable = false)
    private Solicitud solicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Usuario proveedor;

    // Coordenadas GPS
    @Column(nullable = false)
    private Double latitud;

    @Column(nullable = false)
    private Double longitud;

    // Precisión de la ubicación en metros (del GPS)
    @Column(name = "precision_metros")
    private Double precisionMetros;

    // Velocidad en km/h
    @Column(name = "velocidad_kmh")
    private Double velocidadKmh;

    // Rumbo/dirección en grados (0-360)
    @Column(name = "rumbo_grados")
    private Double rumboGrados;

    // Distancia restante hasta el cliente en metros
    @Column(name = "distancia_restante_metros")
    private Double distanciaRestanteMetros;

    // Tiempo estimado de llegada en minutos
    @Column(name = "eta_minutos")
    private Integer etaMinutos;

    // Estado del proveedor
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private EstadoMovimiento estado = EstadoMovimiento.EN_RUTA;

    // Timestamp de la ubicación
    @CreationTimestamp
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    // Metadatos adicionales
    @Column(name = "tipo_transporte", length = 50)
    private String tipoTransporte; // auto, moto, bicicleta, a_pie

    @Column(name = "bateria_dispositivo")
    private Integer bateriaDispositivo; // 0-100%

    @Column(name = "en_segundo_plano")
    @Builder.Default
    private Boolean enSegundoPlano = false;

    // Enum para estados
    public enum EstadoMovimiento {
        EN_RUTA,        // Viajando hacia el cliente
        DETENIDO,       // Parado (semáforo, tráfico)
        LLEGANDO,       // Muy cerca del destino (< 500m)
        LLEGADO,        // Ha llegado al destino
        REGRESANDO      // Regresando después del servicio
    }

    // Métodos de utilidad
    public boolean estaEnRuta() {
        return estado == EstadoMovimiento.EN_RUTA;
    }

    public boolean estaLlegando() {
        return estado == EstadoMovimiento.LLEGANDO;
    }

    public boolean haLlegado() {
        return estado == EstadoMovimiento.LLEGADO;
    }

    public void calcularDistanciaYEta(Double latitudDestino, Double longitudDestino) {
        if (latitud != null && longitud != null && latitudDestino != null && longitudDestino != null) {
            // Calcular distancia usando fórmula de Haversine
            this.distanciaRestanteMetros = calcularDistanciaHaversine(
                    latitud, longitud, latitudDestino, longitudDestino
            );

            // Calcular ETA basado en velocidad promedio
            if (velocidadKmh != null && velocidadKmh > 0) {
                // ETA = distancia / velocidad
                double distanciaKm = distanciaRestanteMetros / 1000.0;
                double horasEstimadas = distanciaKm / velocidadKmh;
                this.etaMinutos = (int) Math.ceil(horasEstimadas * 60);
            } else {
                // Velocidad promedio urbana: 30 km/h
                double velocidadPromedioKmh = 30.0;
                double distanciaKm = distanciaRestanteMetros / 1000.0;
                double horasEstimadas = distanciaKm / velocidadPromedioKmh;
                this.etaMinutos = (int) Math.ceil(horasEstimadas * 60);
            }

            // Actualizar estado basado en distancia
            if (distanciaRestanteMetros < 50) {
                this.estado = EstadoMovimiento.LLEGADO;
            } else if (distanciaRestanteMetros < 500) {
                this.estado = EstadoMovimiento.LLEGANDO;
            }
        }
    }

    /**
     * Fórmula de Haversine para calcular distancia entre dos puntos GPS
     * @return distancia en metros
     */
    private double calcularDistanciaHaversine(double lat1, double lon1, double lat2, double lon2) {
        final int RADIO_TIERRA_KM = 6371;

        double latDistancia = Math.toRadians(lat2 - lat1);
        double lonDistancia = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistancia / 2) * Math.sin(latDistancia / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistancia / 2) * Math.sin(lonDistancia / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        double distanciaKm = RADIO_TIERRA_KM * c;
        return distanciaKm * 1000; // Convertir a metros
    }
}
