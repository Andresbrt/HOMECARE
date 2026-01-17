package com.homecare.repository;

import com.homecare.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {

    // Pago por servicio
    Optional<Pago> findByServicioId(Long servicioId);

    // Pago por servicio y estado
    Optional<Pago> findByServicioIdAndEstado(Long servicioId, Pago.EstadoPago estado);

    // Pagos del cliente
    List<Pago> findByClienteIdOrderByCreatedAtDesc(Long clienteId);

    // Pagos del proveedor
    List<Pago> findByProveedorIdOrderByCreatedAtDesc(Long proveedorId);

    // Pago por transacción de Wompi
    Optional<Pago> findByTransaccionId(String transaccionId);

    Optional<Pago> findByReferencia(String referencia);

    // Pagos por estado
    List<Pago> findByEstadoOrderByCreatedAtDesc(Pago.EstadoPago estado);

    // Pagos por estado y fecha
    List<Pago> findByEstadoAndCreatedAtBefore(Pago.EstadoPago estado, java.time.LocalDateTime fecha);

    // Pagos del cliente por estado
    List<Pago> findByServicioClienteIdAndEstado(Long clienteId, Pago.EstadoPago estado);
    
    // Pagos del proveedor por estado
    List<Pago> findByServicioProveedorIdAndEstado(Long proveedorId, Pago.EstadoPago estado);

    // Pagos del cliente (todos)
    List<Pago> findByServicioClienteId(Long clienteId);
    
    // Pagos del proveedor (todos)
    List<Pago> findByServicioProveedorId(Long proveedorId);

    // Pagos por rango de fechas
    List<Pago> findByCreatedAtBetween(java.time.LocalDateTime inicio, java.time.LocalDateTime fin);

    // Total ganado por proveedor
    @Query("""
        SELECT SUM(p.montoProveedor) FROM Pago p
        WHERE p.proveedor.id = :proveedorId
        AND p.estado = 'APROBADO'
        """)
    BigDecimal getTotalGanadoByProveedor(@Param("proveedorId") Long proveedorId);

    // Total gastado por cliente
    @Query("""
        SELECT SUM(p.montoTotal) FROM Pago p
        WHERE p.cliente.id = :clienteId
        AND p.estado = 'APROBADO'
        """)
    BigDecimal getTotalGastadoByCliente(@Param("clienteId") Long clienteId);

    // Ganancias de la plataforma
    @Query("""
        SELECT SUM(p.comisionPlataforma) FROM Pago p
        WHERE p.estado = 'APROBADO'
        """)
    BigDecimal getTotalComisionesPlataforma();

    // Pagos pendientes
    @Query("""
        SELECT COUNT(p) FROM Pago p
        WHERE p.estado = 'PENDIENTE'
        """)
    long countPagosPendientes();

    // Métodos para reportes - retornan lista vacía por defecto
    default List<com.homecare.dto.ReportDTO.PagoReporte> findPagosParaReporte(
            java.time.LocalDate fechaInicio, 
            java.time.LocalDate fechaFin) {
        return List.of();
    }
}
