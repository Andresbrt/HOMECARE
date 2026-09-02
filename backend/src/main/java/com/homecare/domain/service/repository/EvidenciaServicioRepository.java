package com.homecare.domain.service.repository;

import com.homecare.domain.service.model.EvidenciaServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvidenciaServicioRepository extends JpaRepository<EvidenciaServicio, Long> {
    List<EvidenciaServicio> findByServicioIdOrderByCreatedAtAsc(Long servicioId);
    boolean existsByServicioIdAndTipo(Long servicioId, EvidenciaServicio.TipoEvidencia tipo);
}
