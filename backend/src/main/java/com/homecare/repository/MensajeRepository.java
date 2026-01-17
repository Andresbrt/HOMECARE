package com.homecare.repository;

import com.homecare.model.Mensaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MensajeRepository extends JpaRepository<Mensaje, Long> {

    // Mensajes de una solicitud (chat completo)
    List<Mensaje> findBySolicitudIdOrderByCreatedAtAsc(Long solicitudId);

    // Mensajes entre dos usuarios en una solicitud
    @Query("""
        SELECT m FROM Mensaje m
        WHERE m.solicitud.id = :solicitudId
        AND (
            (m.remitente.id = :usuario1Id AND m.destinatario.id = :usuario2Id)
            OR
            (m.remitente.id = :usuario2Id AND m.destinatario.id = :usuario1Id)
        )
        ORDER BY m.createdAt ASC
        """)
    List<Mensaje> findMensajesEntreUsuarios(
        @Param("solicitudId") Long solicitudId,
        @Param("usuario1Id") Long usuario1Id,
        @Param("usuario2Id") Long usuario2Id
    );

    // Mensajes no leídos para un usuario
    @Query("""
        SELECT m FROM Mensaje m
        WHERE m.destinatario.id = :usuarioId
        AND m.leido = false
        ORDER BY m.createdAt DESC
        """)
    List<Mensaje> findMensajesNoLeidosByUsuario(@Param("usuarioId") Long usuarioId);

    // Contar mensajes no leídos
    long countByDestinatarioIdAndLeidoFalse(Long destinatarioId);

    // Contar mensajes por destinatario y estado leído
    long countByDestinatarioIdAndLeido(Long destinatarioId, boolean leido);

    // Marcar todos los mensajes como leídos
    @org.springframework.data.jpa.repository.Modifying
    @Query("""
        UPDATE Mensaje m SET m.leido = true, m.leidoAt = CURRENT_TIMESTAMP
        WHERE m.solicitud.id = :solicitudId
        AND m.destinatario.id = :destinatarioId
        AND m.leido = false
        """)
    void marcarTodosLeidosPorDestinatario(
        @Param("solicitudId") Long solicitudId,
        @Param("destinatarioId") Long destinatarioId
    );

    // Contar mensajes no leídos de una solicitud
    @Query("""
        SELECT COUNT(m) FROM Mensaje m
        WHERE m.solicitud.id = :solicitudId
        AND m.destinatario.id = :usuarioId
        AND m.leido = false
        """)
    long countMensajesNoLeidosBySolicitudAndUsuario(
        @Param("solicitudId") Long solicitudId,
        @Param("usuarioId") Long usuarioId
    );

    // Últimos mensajes por solicitud para el usuario
    @Query(value = """
        SELECT DISTINCT ON (m.solicitud_id) m.*
        FROM mensajes m
        WHERE m.remitente_id = :usuarioId OR m.destinatario_id = :usuarioId
        ORDER BY m.solicitud_id, m.created_at DESC
        """, nativeQuery = true)
    List<Mensaje> findUltimosMensajesByUsuario(@Param("usuarioId") Long usuarioId);

    // Obtener solicitudes con mensajes para un usuario
    @Query("""
        SELECT DISTINCT m.solicitud FROM Mensaje m
        WHERE m.remitente.id = :usuarioId OR m.destinatario.id = :usuarioId
        ORDER BY m.createdAt DESC
        """)
    List<com.homecare.model.Solicitud> findSolicitudesConMensajes(@Param("usuarioId") Long usuarioId);

    // Obtener el último mensaje de una solicitud
    @Query("""
        SELECT m FROM Mensaje m
        WHERE m.solicitud.id = :solicitudId
        ORDER BY m.createdAt DESC
        LIMIT 1
        """)
    java.util.Optional<Mensaje> findTopBySolicitudIdOrderByCreatedAtDesc(@Param("solicitudId") Long solicitudId);

    // Contar mensajes no leídos por solicitud y destinatario
    long countBySolicitudIdAndDestinatarioIdAndLeido(Long solicitudId, Long destinatarioId, boolean leido);
}
