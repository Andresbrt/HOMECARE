package com.homecare.domain.service.repository;

import com.homecare.domain.service.model.Disputa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputaRepository extends JpaRepository<Disputa, Long> {

    List<Disputa> findByClienteId(Long clienteId);

    List<Disputa> findByProveedorId(Long proveedorId);

    List<Disputa> findByEstado(Disputa.EstadoDisputa estado);

    boolean existsByServicioIdAndEstadoIn(Long servicioId, List<Disputa.EstadoDisputa> estados);
}
