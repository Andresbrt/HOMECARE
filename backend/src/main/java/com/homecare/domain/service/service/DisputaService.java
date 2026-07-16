package com.homecare.domain.service.service;

import com.homecare.dto.DisputaDTO;
import com.homecare.common.exception.NotFoundException;
import com.homecare.common.exception.UnauthorizedException;
import com.homecare.domain.service.model.Disputa;
import com.homecare.domain.service.repository.DisputaRepository;
import com.homecare.domain.service_order.repository.ServicioAceptadoRepository;
import com.homecare.domain.common.service.NotificationService;
import com.homecare.model.ServicioAceptado;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DisputaService {

    private final DisputaRepository disputaRepository;
    private final ServicioAceptadoRepository servicioAceptadoRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificationService notificationService;

    @Transactional
    public DisputaDTO.Response crearDisputa(Long usuarioId, DisputaDTO.Crear request) {
        ServicioAceptado servicio = servicioAceptadoRepository.findById(request.getServicioId())
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        if (!servicio.getCliente().getId().equals(usuarioId) && !servicio.getProveedor().getId().equals(usuarioId)) {
            throw new UnauthorizedException("No autorizado para crear una disputa en este servicio");
        }

        Disputa disputa = Disputa.builder()
                .servicio(servicio)
                .cliente(servicio.getCliente())
                .proveedor(servicio.getProveedor())
                .iniciadoPor(usuario)
                .motivo(request.getMotivo())
                .descripcion(request.getDescripcion())
                .build();

        Disputa guardada = disputaRepository.save(disputa);

        notificationService.enviarNotificacion(
                servicio.getCliente().getId(),
                "Nueva disputa creada",
                "Se ha iniciado una disputa para el servicio #" + servicio.getId() + ".",
                java.util.Map.of("disputaId", String.valueOf(guardada.getId()), "servicioId", String.valueOf(servicio.getId())),
                null
        );

        notificationService.enviarNotificacion(
                servicio.getProveedor().getId(),
                "Nueva disputa creada",
                "Se ha iniciado una disputa para el servicio #" + servicio.getId() + ".",
                java.util.Map.of("disputaId", String.valueOf(guardada.getId()), "servicioId", String.valueOf(servicio.getId())),
                null
        );

        return mapToResponse(guardada);
    }

    public List<DisputaDTO.Response> listarDisputasUsuario(Long usuarioId) {
        List<Disputa> disputasCliente = disputaRepository.findByClienteId(usuarioId);
        List<Disputa> disputasProveedor = disputaRepository.findByProveedorId(usuarioId);

        return java.util.stream.Stream.concat(disputasCliente.stream(), disputasProveedor.stream())
                .distinct()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<DisputaDTO.Response> listarDisputasAdmin(Disputa.EstadoDisputa estado) {
        List<Disputa> disputas;
        if (estado != null) {
            disputas = disputaRepository.findByEstado(estado);
        } else {
            disputas = disputaRepository.findAll();
        }
        return disputas.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public DisputaDTO.Response resolverDisputa(Long disputaId, Long adminId, DisputaDTO.Resolver request) {
        Disputa disputa = disputaRepository.findById(disputaId)
                .orElseThrow(() -> new NotFoundException("Disputa no encontrada"));

        Usuario admin = usuarioRepository.findById(adminId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        disputa.setEstado(Disputa.EstadoDisputa.RESUELTA);
        disputa.setResultado(request.getResultado());
        disputa.setResolucion(request.getResolucion());
        disputa.setAdminResponsable(admin);
        disputa.setComentarioResolucion(request.getResolucion());

        Disputa actualizada = disputaRepository.save(disputa);
        log.info("Disputa {} resuelta por admin {} con resultado {}", disputaId, adminId, request.getResultado());

        notificationService.enviarNotificacion(
                disputa.getCliente().getId(),
                "Disputa resuelta",
                "Tu disputa para el servicio #" + disputa.getServicio().getId() + " ha sido resuelta.",
                java.util.Map.of("disputaId", String.valueOf(actualizada.getId())),
                null
        );

        notificationService.enviarNotificacion(
                disputa.getProveedor().getId(),
                "Disputa resuelta",
                "La disputa para el servicio #" + disputa.getServicio().getId() + " ha sido resuelta.",
                java.util.Map.of("disputaId", String.valueOf(actualizada.getId())),
                null
        );

        return mapToResponse(actualizada);
    }

    public DisputaDTO.Response obtenerDisputa(Long disputaId, Long usuarioId) {
        Disputa disputa = disputaRepository.findById(disputaId)
                .orElseThrow(() -> new NotFoundException("Disputa no encontrada"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        boolean esAdmin = usuario.getRoles().stream()
                .anyMatch(r -> r.getNombre().equals("ROLE_ADMIN"));

        if (!disputa.getCliente().getId().equals(usuarioId) &&
            !disputa.getProveedor().getId().equals(usuarioId) &&
            !esAdmin) {
            throw new UnauthorizedException("No autorizado para ver esta disputa");
        }

        return mapToResponse(disputa);
    }

    private DisputaDTO.Response mapToResponse(Disputa disputa) {
        return new DisputaDTO.Response(
                disputa.getId(),
                disputa.getServicio().getId(),
                disputa.getCliente().getId(),
                disputa.getProveedor().getId(),
                disputa.getIniciadoPor().getId(),
                disputa.getEstado(),
                disputa.getResultado(),
                disputa.getMotivo(),
                disputa.getDescripcion(),
                disputa.getResolucion(),
                disputa.getAdminResponsable() != null ? disputa.getAdminResponsable().getId() : null,
                disputa.getComentarioResolucion(),
                disputa.getCreatedAt(),
                disputa.getUpdatedAt()
        );
    }
}
