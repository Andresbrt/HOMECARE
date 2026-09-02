package com.homecare.domain.user.service;

import com.homecare.common.exception.ConflictBusinessException;
import com.homecare.common.exception.NotFoundException;
import com.homecare.common.exception.UnauthorizedException;
import com.homecare.domain.common.service.EmailService;
import com.homecare.domain.common.service.NotificationService;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.model.VerificacionProveedor;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.domain.user.repository.VerificacionProveedorRepository;
import com.homecare.dto.VerificacionProveedorDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VerificacionProveedorService {

    private final UsuarioRepository usuarioRepository;
    private final VerificacionProveedorRepository verificacionRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional
    public VerificacionProveedorDTO.Response solicitarVerificacion(Long proveedorId, VerificacionProveedorDTO.Crear request) {
        Usuario proveedor = usuarioRepository.findById(proveedorId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        if (!proveedor.getRoles().stream().anyMatch(r -> r.getNombre().equals("ROLE_SERVICE_PROVIDER"))) {
            throw new UnauthorizedException("Solo los proveedores pueden solicitar verificación");
        }

        if (Boolean.TRUE.equals(proveedor.getVerificado())) {
            throw new ConflictBusinessException("PROVEEDOR_YA_VERIFICADO", "El proveedor ya está verificado");
        }

        if (verificacionRepository.existsByProveedorIdAndEstado(proveedorId, VerificacionProveedor.EstadoVerificacion.PENDIENTE)) {
            throw new ConflictBusinessException("VERIFICACION_DUPLICADA", "Ya existe una solicitud de verificación pendiente para este proveedor");
        }

        VerificacionProveedor solicitud = VerificacionProveedor.builder()
                .proveedor(proveedor)
                .tipoDocumento(request.getTipoDocumento())
                .numeroDocumento(request.getNumeroDocumento())
                .urlDocumentoFrontal(request.getUrlDocumentoFrontal())
                .urlDocumentoTrasero(request.getUrlDocumentoTrasero())
                .urlSelfieVerificacion(request.getUrlSelfieVerificacion())
                .estado(VerificacionProveedor.EstadoVerificacion.PENDIENTE)
                .build();

        VerificacionProveedor creada = verificacionRepository.save(solicitud);
        log.info("Solicitud de verificación {} creada para proveedor {}", creada.getId(), proveedorId);

        notificationService.enviarNotificacion(
                proveedorId,
                "Solicitud de verificación enviada",
                "Tu solicitud de verificación ha sido enviada. Un administrador la revisará pronto.",
                Map.of("tipo", "VERIFICACION_SOLICITUD", "solicitudId", String.valueOf(creada.getId())),
                null
        );

        return mapToResponse(creada);
    }

    public List<VerificacionProveedorDTO.Response> listarSolicitudesPendientes() {
        return verificacionRepository.findByEstado(VerificacionProveedor.EstadoVerificacion.PENDIENTE).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public VerificacionProveedorDTO.Response resolverSolicitud(Long solicitudId, Long adminId, VerificacionProveedorDTO.Resolver request) {
        VerificacionProveedor solicitud = verificacionRepository.findById(solicitudId)
                .orElseThrow(() -> new NotFoundException("Solicitud de verificación no encontrada"));

        if (!solicitud.getEstado().equals(VerificacionProveedor.EstadoVerificacion.PENDIENTE)) {
            throw new ConflictBusinessException("SOLICITUD_NO_PENDIENTE", "Solo se pueden resolver solicitudes pendientes");
        }

        Usuario admin = usuarioRepository.findById(adminId)
                .orElseThrow(() -> new NotFoundException("Administrador no encontrado"));

        solicitud.setEstado(request.getEstado());
        solicitud.setRevisadoPor(admin);
        solicitud.setFechaRevision(LocalDateTime.now());
        solicitud.setMotivoRechazo(request.getMotivoRechazo());

        if (request.getEstado() == VerificacionProveedor.EstadoVerificacion.APROBADO) {
            Usuario proveedor = solicitud.getProveedor();
            proveedor.setVerificado(true);
            proveedor.setFechaVerificacion(LocalDateTime.now());
            proveedor.setActivo(true);
            usuarioRepository.save(proveedor);

            emailService.sendHtmlEmail(
                    proveedor.getEmail(),
                    "Verificación aprobada",
                    "profesional-verificado",
                    Map.of("nombre", proveedor.getNombre())
            );
        } else if (request.getEstado() == VerificacionProveedor.EstadoVerificacion.RECHAZADO) {
            emailService.sendHtmlEmail(
                    solicitud.getProveedor().getEmail(),
                    "Verificación rechazada",
                    "profesional-rechazado",
                    Map.of("nombre", solicitud.getProveedor().getNombre(), "motivo", request.getMotivoRechazo() == null ? "Sin motivo" : request.getMotivoRechazo())
            );
        }

        VerificacionProveedor actualizada = verificacionRepository.save(solicitud);
        log.info("Solicitud de verificación {} resuelta por admin {} con estado {} y motivo {}", solicitudId, adminId, request.getEstado(), request.getMotivoRechazo());

        return mapToResponse(actualizada);
    }

    private VerificacionProveedorDTO.Response mapToResponse(VerificacionProveedor solicitud) {
        return VerificacionProveedorDTO.Response.builder()
                .id(solicitud.getId())
                .proveedorId(solicitud.getProveedor().getId())
                .tipoDocumento(solicitud.getTipoDocumento())
                .numeroDocumento(solicitud.getNumeroDocumento())
                .urlDocumentoFrontal(solicitud.getUrlDocumentoFrontal())
                .urlDocumentoTrasero(solicitud.getUrlDocumentoTrasero())
                .urlSelfieVerificacion(solicitud.getUrlSelfieVerificacion())
                .estado(solicitud.getEstado())
                .revisadoPorId(solicitud.getRevisadoPor() != null ? solicitud.getRevisadoPor().getId() : null)
                .motivoRechazo(solicitud.getMotivoRechazo())
                .fechaRevision(solicitud.getFechaRevision())
                .fechaCreacion(solicitud.getFechaCreacion())
                .fechaActualizacion(solicitud.getFechaActualizacion())
                .build();
    }
}
