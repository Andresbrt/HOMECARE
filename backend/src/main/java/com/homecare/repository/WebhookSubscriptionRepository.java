package com.homecare.repository;

import com.homecare.model.WebhookSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para gestión de webhooks
 */
@Repository
public interface WebhookSubscriptionRepository extends JpaRepository<WebhookSubscription, Long> {

    /**
     * Busca webhooks activos
     */
    List<WebhookSubscription> findByActivoTrue();

    /**
     * Busca webhooks por URL
     */
    Optional<WebhookSubscription> findByUrl(String url);

    /**
     * Busca webhooks que escuchan un evento específico
     */
    @Query("SELECT w FROM WebhookSubscription w WHERE w.activo = true " +
           "AND :evento MEMBER OF w.eventos")
    List<WebhookSubscription> findByEventoAndActivoTrue(@Param("evento") String evento);

    /**
     * Cuenta webhooks activos
     */
    Long countByActivoTrue();

    /**
     * Busca webhooks creados en un rango de fechas
     */
    List<WebhookSubscription> findByFechaCreacionBetween(LocalDateTime inicio, LocalDateTime fin);

    /**
     * Busca webhooks con fallos recientes
     */
    @Query("SELECT w FROM WebhookSubscription w WHERE w.activo = true " +
           "AND w.ultimoError IS NOT NULL " +
           "AND w.ultimoError >= :desde")
    List<WebhookSubscription> findWebhooksConFallosRecientes(@Param("desde") LocalDateTime desde);

    /**
     * Obtiene estadísticas de envíos
     */
    @Query("SELECT SUM(w.totalEnvios), SUM(w.enviosExitosos), SUM(w.enviosFallidos) " +
           "FROM WebhookSubscription w WHERE w.activo = true")
    Object[] getEstadisticasEnvios();

    /**
     * Busca webhooks inactivos
     */
    List<WebhookSubscription> findByActivoFalse();

    /**
     * Actualiza último envío
     */
    @Query("UPDATE WebhookSubscription w SET w.ultimoEnvio = :fecha, " +
           "w.totalEnvios = w.totalEnvios + 1, " +
           "w.enviosExitosos = w.enviosExitosos + 1 " +
           "WHERE w.id = :id")
    void actualizarEnvioExitoso(@Param("id") Long id, @Param("fecha") LocalDateTime fecha);

    /**
     * Actualiza fallo de envío
     */
    @Query("UPDATE WebhookSubscription w SET w.ultimoError = :fecha, " +
           "w.totalEnvios = w.totalEnvios + 1, " +
           "w.enviosFallidos = w.enviosFallidos + 1 " +
           "WHERE w.id = :id")
    void actualizarEnvioFallido(@Param("id") Long id, @Param("fecha") LocalDateTime fecha);
}