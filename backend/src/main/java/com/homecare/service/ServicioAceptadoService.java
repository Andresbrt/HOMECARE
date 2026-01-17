package com.homecare.service;

import com.homecare.dto.ServicioDTO;
import com.homecare.exception.NotFoundException;
import com.homecare.exception.UnauthorizedException;
import com.homecare.model.ServicioAceptado;
import com.homecare.model.ServicioAceptado.EstadoServicio;
import com.homecare.repository.ServicioAceptadoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServicioAceptadoService {

    private final ServicioAceptadoRepository servicioRepository;
    private final NotificationService notificationService;

    @Transactional
    public ServicioDTO.Response actualizarEstado(Long servicioId, Long proveedorId,
                                                 EstadoServicio nuevoEstado) {
        ServicioAceptado servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado"));

        if (!servicio.getProveedor().getId().equals(proveedorId)) {
            throw new UnauthorizedException("No autorizado para actualizar este servicio");
        }

        EstadoServicio estadoAnterior = servicio.getEstado();
        servicio.setEstado(nuevoEstado);

        switch (nuevoEstado) {
            case CONFIRMADO -> servicio.setConfirmadoAt(LocalDateTime.now());
            case EN_CAMINO -> servicio.setEnCaminoAt(LocalDateTime.now());
            case LLEGUE -> servicio.setLlegueAt(LocalDateTime.now());
            case EN_PROGRESO -> servicio.setIniciadoAt(LocalDateTime.now());
            case COMPLETADO -> servicio.setCompletadoAt(LocalDateTime.now());
            case CANCELADO -> servicio.setCanceladoAt(LocalDateTime.now());
        }

        servicio = servicioRepository.save(servicio);

        notificationService.notificarCambioEstadoServicio(
                servicioId,
                servicio.getCliente().getId(),
                nuevoEstado.name()
        );

        log.info("Servicio {} cambió de estado: {} -> {} por proveedor {}",
                servicioId, estadoAnterior, nuevoEstado, proveedorId);

        return mapToResponse(servicio);
    }

    public ServicioDTO.Response obtenerServicio(Long servicioId, Long usuarioId) {
        ServicioAceptado servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado"));

        if (!servicio.getCliente().getId().equals(usuarioId) &&
            !servicio.getProveedor().getId().equals(usuarioId)) {
            throw new UnauthorizedException("No autorizado para ver este servicio");
        }

        return mapToResponse(servicio);
    }

    public List<ServicioDTO.Response> obtenerServiciosActivos(Long usuarioId) {
        List<ServicioAceptado> servicios = servicioRepository.findServiciosActivosByUsuario(usuarioId);
        return servicios.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<ServicioDTO.Response> obtenerHistorial(Long usuarioId, EstadoServicio estado) {
        List<ServicioAceptado> servicios;

        if (estado != null) {
            servicios = servicioRepository.findByClienteIdOrProveedorIdAndEstado(
                    usuarioId, usuarioId, estado
            );
        } else {
            servicios = servicioRepository.findByClienteIdOrProveedorId(usuarioId, usuarioId);
        }

        return servicios.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private ServicioDTO.Response mapToResponse(ServicioAceptado servicio) {
        return new ServicioDTO.Response(
                servicio.getId(),
                servicio.getSolicitud().getId(),
                servicio.getOferta().getId(),
                servicio.getCliente().getId(),
                servicio.getCliente().getNombre(),
                servicio.getCliente().getFotoPerfil(),
                servicio.getCliente().getTelefono(),
                servicio.getProveedor().getId(),
                servicio.getProveedor().getNombre(),
                servicio.getProveedor().getFotoPerfil(),
                servicio.getProveedor().getTelefono(),
                servicio.getPrecioAcordado(),
                servicio.getEstado().name(),
                servicio.getSolicitud().getDireccion(),
                servicio.getSolicitud().getLatitud(),
                servicio.getSolicitud().getLongitud(),
                servicio.getConfirmadoAt() != null ? servicio.getConfirmadoAt().toString() : null,
                servicio.getEnCaminoAt() != null ? servicio.getEnCaminoAt().toString() : null,
                servicio.getLlegueAt() != null ? servicio.getLlegueAt().toString() : null,
                servicio.getIniciadoAt() != null ? servicio.getIniciadoAt().toString() : null,
                servicio.getCompletadoAt() != null ? servicio.getCompletadoAt().toString() : null,
                servicio.getCanceladoAt() != null ? servicio.getCanceladoAt().toString() : null,
                servicio.getMotivoCancelacion(),
                servicio.getFotosAntes(),
                servicio.getFotosDespues(),
                servicio.getCreatedAt().toString()
        );
    }
}
