package com.homecare.repository;

import com.homecare.model.Referral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para gestión de referidos
 */
@Repository
public interface ReferralRepository extends JpaRepository<Referral, Long> {

    /**
     * Busca referido por ID del usuario que refiere
     */
    Optional<Referral> findByReferrerId(Long referrerId);

    /**
     * Busca referido por código
     */
    Optional<Referral> findByCodigo(String codigo);

    /**
     * Verifica si existe un código específico
     */
    boolean existsByCodigo(String codigo);

    /**
     * Busca referidos activos por usuario
     */
    List<Referral> findByReferrerIdAndActivoTrue(Long referrerId);

    /**
     * Cuenta referidos exitosos por usuario
     */
    @Query("SELECT COUNT(r) FROM Referral r WHERE r.referrer.id = :referrerId " +
           "AND r.referee IS NOT NULL")
    Long countReferidosExitosos(@Param("referrerId") Long referrerId);

    /**
     * Busca referidos por rango de fechas
     */
    List<Referral> findByFechaCreacionBetween(LocalDateTime inicio, LocalDateTime fin);

    /**
     * Obtiene total de bonus ganados por usuario
     */
    @Query("SELECT SUM(r.bonusGanado) FROM Referral r WHERE r.referrer.id = :referrerId")
    Integer getTotalBonusGanado(@Param("referrerId") Long referrerId);

    /**
     * Busca códigos más usados
     */
    @Query("SELECT r FROM Referral r WHERE r.activo = true " +
           "ORDER BY r.usos DESC")
    List<Referral> findCodigosMasUsados();

    /**
     * Busca referidos recientes
     */
    @Query("SELECT r FROM Referral r WHERE r.fechaUltimoUso >= :desde " +
           "ORDER BY r.fechaUltimoUso DESC")
    List<Referral> findReferidosRecientes(@Param("desde") LocalDateTime desde);

    /**
     * Obtiene estadísticas generales
     */
    @Query("SELECT COUNT(r), SUM(r.usos), SUM(r.bonusGanado) FROM Referral r " +
           "WHERE r.activo = true")
    Object[] getEstadisticasGenerales();
}