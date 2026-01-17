package com.homecare.repository;

import com.homecare.model.Promotion;
import com.homecare.model.Promotion.AplicaA;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para gestión de promociones
 */
@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    /**
     * Busca una promoción por código
     */
    Optional<Promotion> findByCodigo(String codigo);

    /**
     * Verifica si existe una promoción con un código específico
     */
    boolean existsByCodigo(String codigo);

    /**
     * Busca promociones activas
     */
    @Query("SELECT p FROM Promotion p WHERE p.activa = true " +
           "AND p.fechaInicio <= :fecha AND p.fechaFin >= :fecha " +
           "AND p.usoActual < p.usoMaximo")
    List<Promotion> findPromocionesActivas(@Param("fecha") LocalDate fecha);

    /**
     * Busca promociones activas por tipo de aplicación
     */
    @Query("SELECT p FROM Promotion p WHERE p.activa = true " +
           "AND p.fechaInicio <= :fecha AND p.fechaFin >= :fecha " +
           "AND p.usoActual < p.usoMaximo AND p.aplicaA = :aplicaA")
    List<Promotion> findPromocionesActivasPorTipo(
            @Param("fecha") LocalDate fecha, 
            @Param("aplicaA") AplicaA aplicaA);

    /**
     * Busca promociones que expiran pronto
     */
    @Query("SELECT p FROM Promotion p WHERE p.activa = true " +
           "AND p.fechaFin BETWEEN :fechaInicio AND :fechaFin")
    List<Promotion> findPromocionesProximasAExpirar(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin);

    /**
     * Busca promociones por rango de fechas
     */
    List<Promotion> findByFechaInicioBetween(LocalDate fechaInicio, LocalDate fechaFin);

    /**
     * Obtiene promociones ordenadas por uso
     */
    @Query("SELECT p FROM Promotion p WHERE p.activa = true " +
           "ORDER BY p.usoActual DESC")
    List<Promotion> findPromocionesOrdenPorUso();

    /**
     * Cuenta promociones activas
     */
    @Query("SELECT COUNT(p) FROM Promotion p WHERE p.activa = true " +
           "AND p.fechaInicio <= :fecha AND p.fechaFin >= :fecha")
    Long countPromocionesActivas(@Param("fecha") LocalDate fecha);

    /**
     * Obtiene estadísticas de uso de promociones
     */
    @Query("SELECT p.aplicaA, COUNT(p), SUM(p.usoActual) FROM Promotion p " +
           "WHERE p.activa = true GROUP BY p.aplicaA")
    List<Object[]> getEstadisticasUsoPorTipo();

    /**
     * Busca promociones para nuevos usuarios
     */
    @Query("SELECT p FROM Promotion p WHERE p.activa = true " +
           "AND p.primerosUsuarios = true " +
           "AND p.fechaInicio <= :fecha AND p.fechaFin >= :fecha " +
           "AND p.usoActual < p.usoMaximo")
    List<Promotion> findPromocionesParaNuevosUsuarios(@Param("fecha") LocalDate fecha);
}