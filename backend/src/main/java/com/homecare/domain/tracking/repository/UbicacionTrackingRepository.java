package com.homecare.domain.tracking.repository;

import com.homecare.model.UbicacionTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UbicacionTrackingRepository extends JpaRepository<UbicacionTracking, Long> {

    List<UbicacionTracking> findByServicioIdOrderByTimestampDesc(Long servicioId);

    @Query("SELECT u FROM UbicacionTracking u WHERE u.servicio.id = :servicioId " +
           "ORDER BY u.timestamp DESC LIMIT 1")
    Optional<UbicacionTracking> findUltimaUbicacionByServicio(@Param("servicioId") Long servicioId);

    @Query("SELECT u FROM UbicacionTracking u WHERE u.servicio.id = :servicioId " +
           "AND u.timestamp BETWEEN :inicio AND :fin ORDER BY u.timestamp ASC")
    List<UbicacionTracking> findRutaByServicioAndPeriodo(
            @Param("servicioId") Long servicioId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin
    );

    @Query("SELECT u FROM UbicacionTracking u WHERE u.proveedor.id = :proveedorId " +
           "ORDER BY u.timestamp DESC LIMIT 1")
    Optional<UbicacionTracking> findUltimaUbicacionByProveedor(@Param("proveedorId") Long proveedorId);

    @Query(value = """
        SELECT u.* FROM ubicaciones_tracking u
        WHERE u.servicio_id = :servicioId
        AND u.timestamp >= :desde
        ORDER BY u.timestamp ASC
        """, nativeQuery = true)
    List<UbicacionTracking> findTrackingReciente(
            @Param("servicioId") Long servicioId,
            @Param("desde") LocalDateTime desde
    );

    void deleteByServicioId(Long servicioId);

    @Query(value = """
        SELECT COUNT(DISTINCT u.servicio_id) 
        FROM ubicaciones_tracking u
        WHERE u.timestamp >= :fecha
        """, nativeQuery = true)
    Long countServiciosActivosEnTracking(@Param("fecha") LocalDateTime fecha);
}

