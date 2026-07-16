package com.homecare.domain.service.repository;

import com.homecare.domain.service.model.ConformidadCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConformidadClienteRepository extends JpaRepository<ConformidadCliente, Long> {
    Optional<ConformidadCliente> findByServicioId(Long servicioId);
}
