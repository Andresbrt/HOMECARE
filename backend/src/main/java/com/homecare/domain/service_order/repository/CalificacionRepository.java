package com.homecare.domain.service_order.repository;

import com.homecare.model.Calificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CalificacionRepository extends JpaRepository<Calificacion, Long> {

    // Calificaciones recibidas por un usuario
    List<Calificacion> findByCalificadoIdOrderByCreatedAtDesc(Long calificadoId);

    // Calificaciones hechas por un usuario
    List<Calificacion> findByCalificadorIdOrderByCreatedAtDesc(Long calificadorId);

    // CalificaciÃ³n de un servicio especÃ­fico
    Optional<Calificacion> findByServicioIdAndCalificadorId(Long servicioId, Long calificadorId);

    // Verificar si ya existe calificaciÃ³n
    boolean existsByServicioIdAndCalificadorId(Long servicioId, Long calificadorId);

    // Contar calificaciones recibidas por un usuario
    long countByCalificadoId(Long calificadoId);

    // Promedio de calificaciones de un usuario
    @Query("""
        SELECT AVG(c.puntuacion) FROM Calificacion c
        WHERE c.calificado.id = :usuarioId
        """)
    Double getPromedioCalificacionesByUsuario(@Param("usuarioId") Long usuarioId);

    // Calificaciones de un proveedor
    @Query("""
        SELECT c FROM Calificacion c
        WHERE c.calificado.id = :proveedorId
        AND c.tipo = 'CLIENTE_A_PROVEEDOR'
        ORDER BY c.createdAt DESC
        """)
    List<Calificacion> findCalificacionesProveedor(@Param("proveedorId") Long proveedorId);

    // DistribuciÃ³n de calificaciones
    @Query("""
        SELECT c.puntuacion, COUNT(c)
        FROM Calificacion c
        WHERE c.calificado.id = :usuarioId
        GROUP BY c.puntuacion
        ORDER BY c.puntuacion DESC
        """)
    List<Object[]> getDistribucionCalificaciones(@Param("usuarioId") Long usuarioId);
}

