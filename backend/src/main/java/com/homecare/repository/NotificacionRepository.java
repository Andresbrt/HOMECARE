package com.homecare.repository;

import com.homecare.model.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    // Notificaciones del usuario
    List<Notificacion> findByUsuarioIdOrderByCreatedAtDesc(Long usuarioId);

    // Notificaciones no leídas
    List<Notificacion> findByUsuarioIdAndLeidaFalseOrderByCreatedAtDesc(Long usuarioId);

    // Contar notificaciones no leídas
    long countByUsuarioIdAndLeidaFalse(Long usuarioId);

    // Notificaciones por tipo
    List<Notificacion> findByUsuarioIdAndTipoOrderByCreatedAtDesc(Long usuarioId, String tipo);

    // Notificaciones no enviadas
    @Query("""
        SELECT n FROM Notificacion n
        WHERE n.enviada = false
        ORDER BY n.createdAt ASC
        """)
    List<Notificacion> findNotificacionesNoEnviadas();

    // Marcar todas como leídas
    @Query("""
        UPDATE Notificacion n
        SET n.leida = true, n.leidaAt = CURRENT_TIMESTAMP
        WHERE n.usuario.id = :usuarioId
        AND n.leida = false
        """)
    void marcarTodasComoLeidas(@Param("usuarioId") Long usuarioId);
}
