package com.homecare.domain.service_order.repository;

import com.homecare.model.ServicioAceptado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServicioAceptadoRepository extends JpaRepository<ServicioAceptado, Long> {

    // Servicios del cliente
    List<ServicioAceptado> findByClienteIdOrderByCreatedAtDesc(Long clienteId);

    // Servicios del proveedor
    List<ServicioAceptado> findByProveedorIdOrderByCreatedAtDesc(Long proveedorId);

    // Servicio por solicitud
    Optional<ServicioAceptado> findBySolicitudId(Long solicitudId);

    // Servicios por estado
    List<ServicioAceptado> findByEstadoOrderByCreatedAtDesc(ServicioAceptado.EstadoServicio estado);

    // Servicios activos del proveedor
    @Query("""
        SELECT s FROM ServicioAceptado s
        WHERE s.proveedor.id = :proveedorId
        AND s.estado IN ('CONFIRMADO', 'EN_CAMINO', 'LLEGUE', 'EN_PROGRESO')
        ORDER BY s.createdAt DESC
        """)
    List<ServicioAceptado> findServiciosActivosByProveedor(@Param("proveedorId") Long proveedorId);

    // Servicios activos por usuario (cliente o proveedor)
    @Query("""
        SELECT s FROM ServicioAceptado s
        WHERE (s.cliente.id = :usuarioId OR s.proveedor.id = :usuarioId)
        AND s.estado IN ('CONFIRMADO', 'EN_CAMINO', 'LLEGUE', 'EN_PROGRESO')
        ORDER BY s.createdAt DESC
        """)
    List<ServicioAceptado> findServiciosActivosByUsuario(@Param("usuarioId") Long usuarioId);

    // Servicios por usuario y estado
    @Query("""
        SELECT s FROM ServicioAceptado s
        WHERE (s.cliente.id = :clienteId OR s.proveedor.id = :proveedorId)
        AND s.estado = :estado
        ORDER BY s.createdAt DESC
        """)
    List<ServicioAceptado> findByClienteIdOrProveedorIdAndEstado(
        @Param("clienteId") Long clienteId,
        @Param("proveedorId") Long proveedorId,
        @Param("estado") ServicioAceptado.EstadoServicio estado
    );

    // Servicios por usuario (cualquier estado)
    @Query("""
        SELECT s FROM ServicioAceptado s
        WHERE s.cliente.id = :clienteId OR s.proveedor.id = :proveedorId
        ORDER BY s.createdAt DESC
        """)
    List<ServicioAceptado> findByClienteIdOrProveedorId(
        @Param("clienteId") Long clienteId,
        @Param("proveedorId") Long proveedorId
    );

    // Servicios completados del proveedor (para estadÃ­sticas)
    @Query("""
        SELECT COUNT(s) FROM ServicioAceptado s
        WHERE s.proveedor.id = :proveedorId
        AND s.estado = 'COMPLETADO'
        """)
    long countServiciosCompletadosByProveedor(@Param("proveedorId") Long proveedorId);

    // Servicios completados del cliente
    @Query("""
        SELECT COUNT(s) FROM ServicioAceptado s
        WHERE s.cliente.id = :clienteId
        AND s.estado = 'COMPLETADO'
        """)
    long countServiciosCompletadosByCliente(@Param("clienteId") Long clienteId);

    // Contar servicios completados por usuario (cliente o proveedor)
    @Query("""
        SELECT COUNT(s) FROM ServicioAceptado s
        WHERE (s.cliente.id = :usuarioId OR s.proveedor.id = :usuarioId)
        AND s.estado = 'COMPLETADO'
        """)
    long countServiciosCompletadosPorUsuario(@Param("usuarioId") Long usuarioId);

    // Calcular total ganado por proveedor
    @Query("""
        SELECT COALESCE(SUM(s.precioAcordado), 0) FROM ServicioAceptado s
        WHERE s.proveedor.id = :proveedorId
        AND s.estado = 'COMPLETADO'
        """)
    java.math.BigDecimal calcularTotalGanadoPorProveedor(@Param("proveedorId") Long proveedorId);

    // Verificar si existe servicio activo
    @Query("""
        SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END
        FROM ServicioAceptado s
        WHERE (s.cliente.id = :usuarioId OR s.proveedor.id = :usuarioId)
        AND s.estado IN ('CONFIRMADO', 'EN_CAMINO', 'LLEGUE', 'EN_PROGRESO')
        """)
    boolean tieneServicioActivo(@Param("usuarioId") Long usuarioId);

    // MÃ©todos para reportes - retornan listas vacÃ­as por defecto
    default List<com.homecare.dto.ReportDTO.ServicioReporte> findServiciosParaReporte(
            java.time.LocalDate fechaInicio, 
            java.time.LocalDate fechaFin) {
        return List.of();
    }

    default List<com.homecare.dto.ReportDTO.ProveedorReporte> findProveedoresParaReporte(
            java.time.LocalDate fechaInicio, 
            java.time.LocalDate fechaFin) {
        return List.of();
    }
}

