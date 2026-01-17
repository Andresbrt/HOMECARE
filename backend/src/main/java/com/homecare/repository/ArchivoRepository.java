package com.homecare.repository;

import com.homecare.model.Archivo;
import com.homecare.model.Archivo.EstadoArchivo;
import com.homecare.model.Archivo.TipoArchivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ArchivoRepository extends JpaRepository<Archivo, Long> {

    List<Archivo> findByUsuarioIdAndEstado(Long usuarioId, EstadoArchivo estado);

    List<Archivo> findBySolicitudIdAndEstado(Long solicitudId, EstadoArchivo estado);

    List<Archivo> findByServicioIdAndEstado(Long servicioId, EstadoArchivo estado);

    Optional<Archivo> findByNombreAlmacenadoAndEstado(String nombreAlmacenado, EstadoArchivo estado);

    List<Archivo> findByUsuarioIdAndTipoArchivoAndEstado(Long usuarioId, TipoArchivo tipo, EstadoArchivo estado);

    @Query("SELECT a FROM Archivo a WHERE a.estado = 'TEMPORAL' AND a.createdAt < :fecha")
    List<Archivo> findArchivoTemporalesExpirados(@Param("fecha") LocalDateTime fecha);

    @Modifying
    @Query("UPDATE Archivo a SET a.estado = 'ELIMINADO', a.updatedAt = CURRENT_TIMESTAMP WHERE a.id = :id")
    void softDelete(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Archivo a SET a.estado = 'ELIMINADO', a.updatedAt = CURRENT_TIMESTAMP WHERE a.usuario.id = :usuarioId AND a.tipoArchivo = :tipo")
    void softDeleteByUsuarioAndTipo(@Param("usuarioId") Long usuarioId, @Param("tipo") TipoArchivo tipo);

    @Query("SELECT SUM(a.tamanioBytes) FROM Archivo a WHERE a.usuario.id = :usuarioId AND a.estado = 'ACTIVO'")
    Long getTotalStorageByUsuario(@Param("usuarioId") Long usuarioId);
}
