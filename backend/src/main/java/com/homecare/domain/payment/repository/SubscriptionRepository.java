package com.homecare.domain.payment.repository;

import com.homecare.domain.payment.model.Subscription;
import com.homecare.domain.payment.model.Subscription.Estado;
import com.homecare.domain.payment.model.Subscription.PlanType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para gestiÃ³n de suscripciones
 */
@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    /**
     * Busca la suscripciÃ³n activa de un usuario
     */
    Optional<Subscription> findByUsuarioIdAndEstado(Long usuarioId, Estado estado);

    /**
     * Busca todas las suscripciones de un usuario ordenadas por fecha
     */
    List<Subscription> findByUsuarioIdOrderByFechaInicioDesc(Long usuarioId);

    /**
     * Busca suscripciones que vencen en una fecha especÃ­fica y tienen auto-renovaciÃ³n
     */
    List<Subscription> findByEstadoAndFechaFinAndAutoRenovar(Estado estado, LocalDate fechaFin, Boolean autoRenovar);

    /**
     * Busca suscripciones que vencen pronto para enviar recordatorios
     */
    @Query("SELECT s FROM Subscription s WHERE s.estado = :estado " +
           "AND s.fechaFin BETWEEN :fechaInicio AND :fechaFin " +
           "AND s.autoRenovar = false")
    List<Subscription> findSuscripcionesPorVencer(
            @Param("estado") Estado estado,
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin);

    /**
     * Cuenta suscripciones activas por plan
     */
    @Query("SELECT s.plan, COUNT(s) FROM Subscription s " +
           "WHERE s.estado = 'ACTIVA' GROUP BY s.plan")
    List<Object[]> countSuscripcionesActivasPorPlan();

    /**
     * Busca suscripciones por plan
     */
    List<Subscription> findByPlanAndEstado(PlanType plan, Estado estado);

    /**
     * Verifica si un usuario tiene una suscripciÃ³n activa
     */
    boolean existsByUsuarioIdAndEstado(Long usuarioId, Estado estado);

    /**
     * Obtiene el total de ingresos por suscripciones en un rango de fechas
     */
    @Query("SELECT SUM(s.precioMensual) FROM Subscription s " +
           "WHERE s.estado = 'ACTIVA' " +
           "AND s.fechaInicio BETWEEN :fechaInicio AND :fechaFin")
    Double calcularIngresosPorPeriodo(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin);

    /**
     * Busca suscripciones que necesitan procesamiento de pago
     */
    @Query("SELECT s FROM Subscription s WHERE s.estado = 'PENDIENTE_PAGO' " +
           "AND s.fechaFin <= :fecha")
    List<Subscription> findSuscripcionesPendientesPago(@Param("fecha") LocalDate fecha);

    /**
     * Busca suscripción por ID de transacción (idempotencia de webhook)
     */
    Optional<Subscription> findByTransactionId(String transactionId);

    /**
     * Obtiene estadÃ­sticas de retenciÃ³n por plan
     */
    @Query("SELECT s.plan, " +
           "COUNT(CASE WHEN s.estado = 'ACTIVA' THEN 1 END) as activas, " +
           "COUNT(CASE WHEN s.estado = 'CANCELADA' THEN 1 END) as canceladas " +
           "FROM Subscription s GROUP BY s.plan")
    List<Object[]> getEstadisticasRetencionPorPlan();
}

