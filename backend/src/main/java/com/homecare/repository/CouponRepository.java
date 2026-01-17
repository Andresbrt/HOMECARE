package com.homecare.repository;

import com.homecare.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para gestión de cupones
 */
@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    /**
     * Busca un cupón por promoción y usuario
     */
    Optional<Coupon> findByPromocionIdAndUsuarioId(Long promocionId, Long usuarioId);

    /**
     * Busca todos los cupones de un usuario
     */
    List<Coupon> findByUsuarioIdOrderByUsadoAtDesc(Long usuarioId);

    /**
     * Busca cupones usados por un usuario
     */
    List<Coupon> findByUsuarioIdAndUsadoTrue(Long usuarioId);

    /**
     * Busca cupones no usados por un usuario
     */
    List<Coupon> findByUsuarioIdAndUsadoFalse(Long usuarioId);

    /**
     * Cuenta cupones usados por promoción
     */
    Long countByPromocionIdAndUsadoTrue(Long promocionId);

    /**
     * Busca cupones usados en un rango de tiempo
     */
    List<Coupon> findByUsadoTrueAndUsadoAtBetween(LocalDateTime inicio, LocalDateTime fin);

    /**
     * Verifica si un usuario ya usó una promoción específica
     */
    boolean existsByPromocionIdAndUsuarioIdAndUsadoTrue(Long promocionId, Long usuarioId);

    /**
     * Obtiene estadísticas de uso por usuario
     */
    @Query("SELECT c.usuario.id, COUNT(c) FROM Coupon c " +
           "WHERE c.usado = true GROUP BY c.usuario.id ORDER BY COUNT(c) DESC")
    List<Object[]> getEstadisticasUsoPorUsuario();

    /**
     * Busca cupones por promoción
     */
    List<Coupon> findByPromocionId(Long promocionId);

    /**
     * Obtiene el total de cupones usados
     */
    @Query("SELECT COUNT(c) FROM Coupon c WHERE c.usado = true")
    Long countCuponesUsados();

    /**
     * Busca cupones usados recientemente
     */
    @Query("SELECT c FROM Coupon c WHERE c.usado = true " +
           "AND c.usadoAt >= :desde ORDER BY c.usadoAt DESC")
    List<Coupon> findCuponesUsadosRecientes(@Param("desde") LocalDateTime desde);

    /**
     * Elimina cupones antiguos no usados
     */
    void deleteByUsadoFalseAndFechaCreacionBefore(LocalDateTime fecha);
}