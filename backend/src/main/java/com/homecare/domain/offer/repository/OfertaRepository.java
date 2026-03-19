package com.homecare.domain.offer.repository;

import com.homecare.domain.offer.model.Oferta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OfertaRepository extends JpaRepository<Oferta, Long> {

    // Ofertas de una solicitud especÃ­fica
    List<Oferta> findBySolicitudIdOrderByPrecioOfrecidoAsc(Long solicitudId);

    // Ofertas pendientes de una solicitud
    @Query("""
        SELECT o FROM Oferta o
        WHERE o.solicitud.id = :solicitudId
        AND o.estado = 'PENDIENTE'
        ORDER BY o.precioOfrecido ASC
        """)
    List<Oferta> findOfertasPendientesBySolicitud(@Param("solicitudId") Long solicitudId);

    // Ofertas del proveedor
    List<Oferta> findByProveedorIdOrderByCreatedAtDesc(Long proveedorId);

    // Ofertas por solicitud y estado
    List<Oferta> findBySolicitudIdAndEstado(Long solicitudId, Oferta.EstadoOferta estado);

    // Ofertas por proveedor y estado
    List<Oferta> findByProveedorIdAndEstadoOrderByCreatedAtDesc(Long proveedorId, Oferta.EstadoOferta estado);

    // Verificar si el proveedor ya ofertÃ³ en una solicitud
    boolean existsBySolicitudIdAndProveedorId(Long solicitudId, Long proveedorId);

    // Obtener oferta especÃ­fica
    Optional<Oferta> findBySolicitudIdAndProveedorId(Long solicitudId, Long proveedorId);

    // Contar ofertas de una solicitud
    long countBySolicitudId(Long solicitudId);

    // EstadÃ­sticas de ofertas del proveedor
    @Query("""
        SELECT COUNT(o) FROM Oferta o
        WHERE o.proveedor.id = :proveedorId
        AND o.estado = :estado
        """)
    long countOfertasByProveedorAndEstado(
        @Param("proveedorId") Long proveedorId,
        @Param("estado") Oferta.EstadoOferta estado
    );

    // Precio promedio de ofertas de un proveedor
    @Query("""
        SELECT AVG(o.precioOfrecido) FROM Oferta o
        WHERE o.proveedor.id = :proveedorId
        AND o.estado = 'ACEPTADA'
        """)
    BigDecimal getPromedioPreciosAceptadosByProveedor(@Param("proveedorId") Long proveedorId);

    // Ofertas no vistas por el cliente
    @Query("""
        SELECT o FROM Oferta o
        WHERE o.solicitud.cliente.id = :clienteId
        AND o.vistaPorCliente = false
        AND o.estado = 'PENDIENTE'
        ORDER BY o.createdAt DESC
        """)
    List<Oferta> findOfertasNoVistasByCliente(@Param("clienteId") Long clienteId);
}

