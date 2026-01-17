package com.homecare.repository;

import com.homecare.model.Solicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SolicitudRepository extends JpaRepository<Solicitud, Long> {

    // Solicitudes del cliente
    List<Solicitud> findByClienteIdOrderByCreatedAtDesc(Long clienteId);

    // Solicitudes abiertas (recibiendo ofertas)
    @Query("""
        SELECT s FROM Solicitud s
        WHERE s.estado IN ('ABIERTA', 'EN_NEGOCIACION')
        AND (s.expiraEn IS NULL OR s.expiraEn > :now)
        ORDER BY s.createdAt DESC
        """)
    List<Solicitud> findSolicitudesAbiertas(@Param("now") LocalDateTime now);

    // Solicitudes cercanas para proveedores (radio en km)
    @Query(value = """
        SELECT * FROM solicitudes s
        WHERE s.estado IN ('ABIERTA', 'EN_NEGOCIACION')
        AND (s.expira_en IS NULL OR s.expira_en > :now)
        AND (
            6371 * acos(
                cos(radians(:lat)) *
                cos(radians(s.latitud)) *
                cos(radians(s.longitud) - radians(:lng)) +
                sin(radians(:lat)) *
                sin(radians(s.latitud))
            )
        ) <= :radioKm
        ORDER BY s.created_at DESC
        """, nativeQuery = true)
    List<Solicitud> findSolicitudesCercanas(
        @Param("lat") BigDecimal latitud,
        @Param("lng") BigDecimal longitud,
        @Param("radioKm") int radioKm,
        @Param("now") LocalDateTime now
    );

    // Solicitudes por estado
    List<Solicitud> findByEstadoOrderByCreatedAtDesc(Solicitud.EstadoSolicitud estado);

    // Solicitudes por cliente y estado
    List<Solicitud> findByClienteIdAndEstadoOrderByCreatedAtDesc(Long clienteId, Solicitud.EstadoSolicitud estado);

    // Solicitudes por cliente y estado (sin orden especificado)
    List<Solicitud> findByClienteIdAndEstado(Long clienteId, Solicitud.EstadoSolicitud estado);

    // Solicitudes por tipo de limpieza y estado
    List<Solicitud> findByTipoLimpiezaAndEstadoOrderByCreatedAtDesc(Solicitud.TipoLimpieza tipoLimpieza, Solicitud.EstadoSolicitud estado);

    // Solicitudes por tipo de limpieza
    List<Solicitud> findByTipoLimpiezaOrderByCreatedAtDesc(Solicitud.TipoLimpieza tipoLimpieza);

    // Todas las solicitudes ordenadas por fecha
    List<Solicitud> findAllByOrderByCreatedAtDesc();

    // Contar solicitudes activas del cliente
    @Query("""
        SELECT COUNT(s) FROM Solicitud s
        WHERE s.cliente.id = :clienteId
        AND s.estado IN ('ABIERTA', 'EN_NEGOCIACION', 'ACEPTADA', 'EN_PROGRESO')
        """)
    long countSolicitudesActivasByCliente(@Param("clienteId") Long clienteId);
}
