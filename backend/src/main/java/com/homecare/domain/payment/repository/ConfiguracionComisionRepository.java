package com.homecare.domain.payment.repository;

import com.homecare.domain.payment.model.ConfiguracionComision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface ConfiguracionComisionRepository extends JpaRepository<ConfiguracionComision, Long> {

    @Query("SELECT c FROM ConfiguracionComision c WHERE (c.tipoServicio = :tipoServicio OR c.tipoServicio IS NULL) " +
           "AND (c.vigenciaDesde IS NULL OR c.vigenciaDesde <= :fecha) " +
           "AND (c.vigenciaHasta IS NULL OR c.vigenciaHasta >= :fecha) " +
           "ORDER BY CASE WHEN c.tipoServicio IS NULL THEN 1 ELSE 0 END, c.porcentajeComision DESC")
    Optional<ConfiguracionComision> findTopByTipoServicioOrGlobal(@Param("tipoServicio") String tipoServicio,
                                                                   @Param("fecha") LocalDate fecha);
}
