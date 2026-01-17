package com.homecare.repository;

import com.homecare.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByTelefono(String telefono);

    // Actualizar calificación promedio
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Usuario u SET u.calificacionPromedio = :promedio WHERE u.id = :usuarioId")
    void updateCalificacionPromedio(@Param("usuarioId") Long usuarioId, @Param("promedio") BigDecimal promedio);

    // Proveedores cercanos a una ubicación (radio en km)
    @Query(value = """
        SELECT * FROM usuarios u
        INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
        INNER JOIN roles r ON ur.rol_id = r.id
        WHERE r.nombre = 'SERVICE_PROVIDER'
        AND u.activo = true
        AND u.disponible = true
        AND u.latitud IS NOT NULL
        AND u.longitud IS NOT NULL
        AND (
            6371 * acos(
                cos(radians(:lat)) *
                cos(radians(u.latitud)) *
                cos(radians(u.longitud) - radians(:lng)) +
                sin(radians(:lat)) *
                sin(radians(u.latitud))
            )
        ) <= :radioKm
        ORDER BY (
            6371 * acos(
                cos(radians(:lat)) *
                cos(radians(u.latitud)) *
                cos(radians(u.longitud) - radians(:lng)) +
                sin(radians(:lat)) *
                sin(radians(u.latitud))
            )
        )
        """, nativeQuery = true)
    List<Usuario> findProveedoresCercanos(
        @Param("lat") BigDecimal latitud,
        @Param("lng") BigDecimal longitud,
        @Param("radioKm") int radioKm
    );

    // Top proveedores por calificación
    @Query("""
        SELECT u FROM Usuario u
        INNER JOIN u.roles r
        WHERE r.nombre = 'SERVICE_PROVIDER'
        AND u.activo = true
        AND u.verificado = true
        ORDER BY u.calificacionPromedio DESC, u.serviciosCompletados DESC
        """)
    List<Usuario> findTopProveedores();

    // Proveedores disponibles
    @Query("""
        SELECT u FROM Usuario u
        INNER JOIN u.roles r
        WHERE r.nombre = 'SERVICE_PROVIDER'
        AND u.activo = true
        AND u.disponible = true
        AND u.verificado = true
        """)
    List<Usuario> findProveedoresDisponibles();
}
