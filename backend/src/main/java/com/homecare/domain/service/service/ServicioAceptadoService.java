package com.homecare.domain.service.service;

import com.homecare.dto.ConformidadDTO;
import com.homecare.dto.EvidenciaDTO;
import com.homecare.dto.ServicioDTO;
import com.homecare.common.exception.ConflictBusinessException;
import com.homecare.common.exception.NotFoundException;
import com.homecare.common.exception.UnauthorizedException;
import com.homecare.domain.service.model.ConformidadCliente;
import com.homecare.domain.service.model.EvidenciaServicio;
import com.homecare.domain.service.model.EvidenciaServicio.TipoEvidencia;
import com.homecare.domain.service.repository.ConformidadClienteRepository;
import com.homecare.domain.service.repository.EvidenciaServicioRepository;
import com.homecare.domain.common.service.FileStorageService;
import com.homecare.domain.common.service.NotificationService;
import com.homecare.domain.payment.repository.PagoRepository;
import com.homecare.domain.payment.service.PaymentService;
import com.homecare.domain.service_order.repository.ServicioAceptadoRepository;
import com.homecare.model.ServicioAceptado;
import com.homecare.model.ServicioAceptado.EstadoServicio;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServicioAceptadoService {

    private final ServicioAceptadoRepository servicioRepository;
    private final NotificationService notificationService;
    private final EvidenciaServicioRepository evidenciaRepository;
    private final ConformidadClienteRepository conformidadRepository;
    private final FileStorageService fileStorageService;
    private final PagoRepository pagoRepository;
    private final PaymentService paymentService;

    @Transactional
    public ServicioDTO.Response actualizarEstado(Long servicioId, Long proveedorId,
                                                 EstadoServicio nuevoEstado) {
        ServicioAceptado servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado"));

        if (!servicio.getProveedor().getId().equals(proveedorId)) {
            throw new UnauthorizedException("No autorizado para actualizar este servicio");
        }

        if (nuevoEstado == EstadoServicio.COMPLETADO) {
            boolean tieneFotoDespues = evidenciaRepository.existsByServicioIdAndTipo(servicioId, TipoEvidencia.DESPUES);
            if (!tieneFotoDespues) {
                throw new ConflictBusinessException("EVIDENCIA_INSUFICIENTE", "No se puede completar el servicio sin al menos una evidencia de tipo DESPUES");
            }
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

        if (nuevoEstado == EstadoServicio.COMPLETADO) {
            paymentService.intentarLiberarPago(pagoRepository.findByServicioId(servicioId)
                    .orElse(null));
        }

        notificationService.enviarNotificacion(
                servicio.getCliente().getId(),
                "Estado de servicio actualizado",
                "El proveedor ha cambiado el estado del servicio a " + nuevoEstado.name(),
                Map.of("servicioId", servicioId.toString(), "estado", nuevoEstado.name()),
                null
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

    @Transactional
    public EvidenciaDTO.Response agregarEvidencia(Long servicioId, Long usuarioId,
                                                  TipoEvidencia tipo,
                                                  String urlArchivo,
                                                  String descripcion) {
        ServicioAceptado servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado"));

        if (!servicio.getProveedor().getId().equals(usuarioId) && !servicio.getCliente().getId().equals(usuarioId)) {
            throw new UnauthorizedException("No autorizado para agregar evidencia a este servicio");
        }

        EvidenciaServicio evidencia = EvidenciaServicio.builder()
                .servicio(servicio)
                .tipo(tipo)
                .urlArchivo(urlArchivo)
                .subidoPor(servicio.getProveedor().getId().equals(usuarioId) ? servicio.getProveedor() : servicio.getCliente())
                .descripcion(descripcion)
                .build();

        evidencia = evidenciaRepository.save(evidencia);

        return buildEvidenciaResponse(evidencia);
    }

    @Transactional
    public EvidenciaDTO.Response agregarEvidenciaArchivo(Long servicioId, Long usuarioId,
                                                          TipoEvidencia tipo,
                                                          MultipartFile archivo,
                                                          String descripcion) {
        ServicioAceptado servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado"));

        if (!servicio.getProveedor().getId().equals(usuarioId) && !servicio.getCliente().getId().equals(usuarioId)) {
            throw new UnauthorizedException("No autorizado para agregar evidencia a este servicio");
        }

        com.homecare.model.Archivo.TipoArchivo tipoArchivo = switch (tipo) {
            case ANTES -> com.homecare.model.Archivo.TipoArchivo.FOTO_ANTES;
            case DURANTE -> com.homecare.model.Archivo.TipoArchivo.FOTO_DURANTE;
            case DESPUES -> com.homecare.model.Archivo.TipoArchivo.FOTO_DESPUES;
        };

        var uploaded = fileStorageService.uploadFile(
                archivo,
                tipoArchivo,
                usuarioId,
                null,
                servicioId
        );

        EvidenciaServicio evidencia = EvidenciaServicio.builder()
                .servicio(servicio)
                .tipo(tipo)
                .urlArchivo(uploaded.getUrlPublica())
                .subidoPor(servicio.getProveedor().getId().equals(usuarioId) ? servicio.getProveedor() : servicio.getCliente())
                .descripcion(descripcion)
                .build();

        evidencia = evidenciaRepository.save(evidencia);

        if (tipo == TipoEvidencia.ANTES) {
            servicio.getFotosAntes().add(uploaded.getUrlPublica());
        } else if (tipo == TipoEvidencia.DESPUES) {
            servicio.getFotosDespues().add(uploaded.getUrlPublica());
        }
        servicioRepository.save(servicio);

        return buildEvidenciaResponse(evidencia);
    }

    private EvidenciaDTO.Response buildEvidenciaResponse(EvidenciaServicio evidencia) {
        return new EvidenciaDTO.Response(
                evidencia.getId(),
                evidencia.getServicio().getId(),
                evidencia.getTipo(),
                evidencia.getUrlArchivo(),
                evidencia.getSubidoPor().getId(),
                evidencia.getSubidoPor().getNombre(),
                evidencia.getCreatedAt(),
                evidencia.getDescripcion()
        );
    }

    @Transactional
    public ServicioDTO.Response reprogramarServicio(Long servicioId, Long clienteId,
                                                    java.time.LocalDate fechaServicio,
                                                    java.time.LocalTime horaInicio) {
        ServicioAceptado servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado"));

        if (!servicio.getCliente().getId().equals(clienteId)) {
            throw new UnauthorizedException("Solo el cliente puede reprogramar el servicio");
        }

        if (servicio.getEstado() == EstadoServicio.COMPLETADO || servicio.getEstado() == EstadoServicio.CANCELADO) {
            throw new ConflictBusinessException("SERVICIO_NO_REPROGRAMABLE", "No se puede reprogramar un servicio completado o cancelado");
        }

        servicio.getSolicitud().setFechaServicio(fechaServicio);
        servicio.getSolicitud().setHoraInicio(horaInicio);
        servicioRepository.save(servicio);

        notificationService.enviarNotificacion(
                servicio.getProveedor().getId(),
                "Servicio reprogramado",
                "El cliente ha reprogramado el servicio #" + servicio.getId() + " para " + fechaServicio + " a las " + horaInicio + ".",
                Map.of("servicioId", servicioId.toString()),
                null
        );

        return mapToResponse(servicio);
    }

    public List<EvidenciaDTO.Response> listarEvidencias(Long servicioId, Long usuarioId) {
        ServicioAceptado servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado"));

        if (!servicio.getProveedor().getId().equals(usuarioId) && !servicio.getCliente().getId().equals(usuarioId)) {
            throw new UnauthorizedException("No autorizado para ver evidencias de este servicio");
        }

        return evidenciaRepository.findByServicioIdOrderByCreatedAtAsc(servicioId).stream()
                .map(e -> new EvidenciaDTO.Response(
                        e.getId(),
                        servicioId,
                        e.getTipo(),
                        e.getUrlArchivo(),
                        e.getSubidoPor().getId(),
                        e.getSubidoPor().getNombre(),
                        e.getCreatedAt(),
                        e.getDescripcion()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public ConformidadDTO.Response confirmarConformidad(Long servicioId, Long clienteId,
                                                        Boolean aceptado,
                                                        String comentario,
                                                        String ipOrigen) {
        ServicioAceptado servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado"));

        if (!servicio.getCliente().getId().equals(clienteId)) {
            throw new UnauthorizedException("No autorizado para confirmar este servicio");
        }

        ConformidadCliente conformidad = conformidadRepository.findByServicioId(servicioId)
                .orElse(ConformidadCliente.builder()
                        .servicio(servicio)
                        .cliente(servicio.getCliente())
                        .build());

        conformidad.setAceptado(aceptado);
        conformidad.setComentario(comentario);
        conformidad.setIpOrigen(ipOrigen);
        conformidad = conformidadRepository.save(conformidad);

        notificationService.enviarNotificacion(
                servicio.getProveedor().getId(),
                "Cliente confirmó servicio",
                "El cliente ha " + (aceptado ? "aceptado" : "rechazado") + " el servicio.",
                Map.of("servicioId", servicioId.toString(), "aceptado", aceptado.toString()),
                null
        );

        ConformidadDTO.Response response = new ConformidadDTO.Response(
                conformidad.getId(),
                servicioId,
                conformidad.getAceptado(),
                conformidad.getComentario(),
                conformidad.getCreatedAt(),
                conformidad.getIpOrigen()
        );

        if (Boolean.TRUE.equals(conformidad.getAceptado()) && servicio.getEstado() == EstadoServicio.COMPLETADO) {
            paymentService.intentarLiberarPago(pagoRepository.findByServicioId(servicioId).orElse(null));
        }

        return response;
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

