package com.homecare.domain.user.repository;

import com.homecare.domain.user.model.VerificacionProveedor;
import com.homecare.domain.user.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VerificacionProveedorRepository extends JpaRepository<VerificacionProveedor, Long> {

    List<VerificacionProveedor> findByEstado(VerificacionProveedor.EstadoVerificacion estado);

    Optional<VerificacionProveedor> findFirstByProveedorIdAndEstadoOrderByFechaCreacionDesc(Long proveedorId, VerificacionProveedor.EstadoVerificacion estado);

    boolean existsByProveedorIdAndEstado(Long proveedorId, VerificacionProveedor.EstadoVerificacion estado);
}
