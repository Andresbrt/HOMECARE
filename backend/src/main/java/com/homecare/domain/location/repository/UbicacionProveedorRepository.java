package com.homecare.domain.location.repository;

import com.homecare.model.UbicacionProveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UbicacionProveedorRepository extends JpaRepository<UbicacionProveedor, Long> {

    /**
     * Obtiene la Ãºltima ubicaciÃ³n del proveedor para una solicitud
     */
    Optional<UbicacionProveedor> findTopBySolicitudIdAndProveedorIdOrderByTimestampDesc(
            Long solicitudId, Long proveedorId);

    /**
     * Obtiene la Ãºltima ubicaciÃ³n del proveedor para cualquier solicitud
     */
    Optional<UbicacionProveedor> findTopByProveedorIdOrderByTimestampDesc(Long proveedorId);

    /**
     * Obtiene todas las ubicaciones de una solicitud ordenadas por tiempo
     * (trayectoria completa)
     */
    List<UbicacionProveedor> findBySolicitudIdOrderByTimestampAsc(Long solicitudId);

    /**
     * Obtiene ubicaciones de una solicitud en un rango de tiempo
     */
    List<UbicacionProveedor> findBySolicitudIdAndTimestampBetweenOrderByTimestampAsc(
            Long solicitudId, LocalDateTime inicio, LocalDateTime fin);

    /**
     * Obtiene ubicaciones recientes del proveedor (Ãºltimos N minutos)
     */
    @Query("SELECT u FROM UbicacionProveedor u WHERE u.proveedor.id = :proveedorId " +
           "AND u.timestamp >= :desde ORDER BY u.timestamp DESC")
    List<UbicacionProveedor> findUbicacionesRecientes(
            @Param("proveedorId") Long proveedorId,
            @Param("desde") LocalDateTime desde);

    /**
     * Cuenta actualizaciones de ubicaciÃ³n en una solicitud
     */
    Long countBySolicitudId(Long solicitudId);

    /**
     * Obtiene la primera ubicaciÃ³n (inicio del tracking)
     */
    Optional<UbicacionProveedor> findTopBySolicitudIdOrderByTimestampAsc(Long solicitudId);

    /**
     * Verifica si hay ubicaciones para una solicitud
     */
    boolean existsBySolicitudId(Long solicitudId);

    /**
     * Obtiene ubicaciones donde el proveedor estÃ¡ en ruta
     */
    @Query("SELECT u FROM UbicacionProveedor u WHERE u.solicitud.id = :solicitudId " +
           "AND u.estado = 'EN_RUTA' ORDER BY u.timestamp DESC")
    List<UbicacionProveedor> findUbicacionesEnRuta(@Param("solicitudId") Long solicitudId);

    /**
     * Calcula velocidad promedio del proveedor en una solicitud
     */
    @Query("SELECT AVG(u.velocidadKmh) FROM UbicacionProveedor u " +
           "WHERE u.solicitud.id = :solicitudId AND u.velocidadKmh IS NOT NULL")
    Double calcularVelocidadPromedio(@Param("solicitudId") Long solicitudId);

    /**
     * Calcula velocidad mÃ¡xima alcanzada
     */
    @Query("SELECT MAX(u.velocidadKmh) FROM UbicacionProveedor u " +
           "WHERE u.solicitud.id = :solicitudId AND u.velocidadKmh IS NOT NULL")
    Double calcularVelocidadMaxima(@Param("solicitudId") Long solicitudId);

    /**
     * Obtiene duraciÃ³n total del tracking (diferencia entre primera y Ãºltima ubicaciÃ³n)
     */
    @Query("SELECT MIN(u.timestamp) FROM UbicacionProveedor u WHERE u.solicitud.id = :solicitudId")
    LocalDateTime findPrimerTimestamp(@Param("solicitudId") Long solicitudId);

    @Query("SELECT MAX(u.timestamp) FROM UbicacionProveedor u WHERE u.solicitud.id = :solicitudId")
    LocalDateTime findUltimoTimestamp(@Param("solicitudId") Long solicitudId);

    default Double calcularDuracionMinutos(Long solicitudId) {
        LocalDateTime inicio = findPrimerTimestamp(solicitudId);
        LocalDateTime fin = findUltimoTimestamp(solicitudId);

        if (inicio == null || fin == null) {
            return 0.0;
        }

        return Duration.between(inicio, fin).toMinutes() * 1.0;
    }

    /**
     * Cuenta tiempo detenido (velocidad = 0 o muy baja)
     */
    @Query("SELECT COUNT(u) FROM UbicacionProveedor u " +
           "WHERE u.solicitud.id = :solicitudId " +
           "AND (u.velocidadKmh IS NULL OR u.velocidadKmh < 5)")
    Long contarTiempoDetenido(@Param("solicitudId") Long solicitudId);

    /**
     * Elimina ubicaciones antiguas (limpieza de datos)
     * Ãštil para eliminar ubicaciones de mÃ¡s de X dÃ­as
     */
    void deleteByTimestampBefore(LocalDateTime fecha);

    /**
     * Obtiene todas las solicitudes activas con tracking
     */
    @Query("SELECT DISTINCT u.solicitud.id FROM UbicacionProveedor u " +
           "WHERE u.timestamp >= :desde")
    List<Long> findSolicitudesConTrackingActivo(@Param("desde") LocalDateTime desde);

    /**
     * Busca solicitudes que han tenido tracking activo desde una fecha especÃ­fica
     * Considera una solicitud "con tracking activo" si tiene ubicaciones registradas
     */
    @Query("SELECT DISTINCT u.solicitud FROM UbicacionProveedor u " +
           "WHERE u.timestamp >= :fechaDesde " +
           "ORDER BY u.timestamp DESC")
    List<Object> findSolicitudesConTrackingActivoCompleto(@Param("fechaDesde") LocalDateTime fechaDesde);

    /**
     * Busca tracking activo en tiempo real (Ãºltimos 10 minutos)
     */
    @Query("SELECT DISTINCT u.solicitud FROM UbicacionProveedor u " +
           "WHERE u.timestamp >= :fechaLimite " +
           "ORDER BY u.timestamp DESC")
    List<Object> findTrackingEnTiempoReal(@Param("fechaLimite") LocalDateTime fechaLimite);

    /**
     * Obtiene estadÃ­sticas de uso de tracking por perÃ­odo
     */
    @Query("SELECT DATE(u.timestamp) as fecha, " +
           "COUNT(u.id) as totalActualizaciones, " +
           "COUNT(DISTINCT u.solicitud.id) as solicitudesUnicas " +
           "FROM UbicacionProveedor u " +
           "WHERE u.timestamp BETWEEN :fechaInicio AND :fechaFin " +
           "GROUP BY DATE(u.timestamp) " +
           "ORDER BY fecha DESC")
    List<Object[]> getEstadisticasTrackingPorFecha(
            @Param("fechaInicio") LocalDateTime fechaInicio, 
            @Param("fechaFin") LocalDateTime fechaFin);
}

