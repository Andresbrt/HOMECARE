package com.homecare.service;

import com.homecare.dto.CalificacionDTO;
import com.homecare.exception.BadRequestException;
import com.homecare.exception.NotFoundException;
import com.homecare.exception.UnauthorizedException;
import com.homecare.model.Calificacion;
import com.homecare.model.ServicioAceptado;
import com.homecare.model.ServicioAceptado.EstadoServicio;
import com.homecare.model.Usuario;
import com.homecare.repository.CalificacionRepository;
import com.homecare.repository.ServicioAceptadoRepository;
import com.homecare.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CalificacionService {

    private final CalificacionRepository calificacionRepository;
    private final ServicioAceptadoRepository servicioRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificationService notificationService;

    @Transactional
    public CalificacionDTO.Response calificar(Long calificadorId, CalificacionDTO.Crear request) {
        ServicioAceptado servicio = servicioRepository.findById(request.getServicioId())
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado"));

        if (servicio.getEstado() != EstadoServicio.COMPLETADO) {
            throw new BadRequestException("Solo se pueden calificar servicios completados");
        }

        boolean esCliente = servicio.getCliente().getId().equals(calificadorId);
        boolean esProveedor = servicio.getProveedor().getId().equals(calificadorId);

        if (!esCliente && !esProveedor) {
            throw new UnauthorizedException("No autorizado para calificar este servicio");
        }

        Usuario calificado = esCliente ? servicio.getProveedor() : servicio.getCliente();

        if (calificacionRepository.existsByServicioIdAndCalificadorId(
                request.getServicioId(), calificadorId)) {
            throw new BadRequestException("Ya has calificado este servicio");
        }

        Usuario calificador = usuarioRepository.findById(calificadorId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        Calificacion calificacion = new Calificacion();
        calificacion.setServicio(servicio);
        calificacion.setCalificador(calificador);
        calificacion.setCalificado(calificado);
        calificacion.setPuntuacion(request.getPuntuacion());
        calificacion.setComentario(request.getComentario());

        calificacion = calificacionRepository.save(calificacion);

        actualizarPromedioCalificacion(calificado.getId());

        String mensaje = esCliente ? 
                "Has recibido una nueva calificación de un cliente" :
                "Has recibido una nueva calificación de un proveedor";
        notificationService.enviarNotificacion(
                calificado.getId(),
                "Nueva Calificación",
                mensaje,
                Map.of("tipo", "NUEVA_CALIFICACION", "puntuacion", request.getPuntuacion().toString()),
                null
        );

        log.info("Calificación creada: {} calificó a {} con {} estrellas",
                calificadorId, calificado.getId(), request.getPuntuacion());

        return mapToResponse(calificacion);
    }

    public List<CalificacionDTO.Response> obtenerCalificacionesUsuario(Long usuarioId) {
        List<Calificacion> calificaciones = calificacionRepository.findByCalificadoIdOrderByCreatedAtDesc(usuarioId);
        return calificaciones.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public CalificacionDTO.EstadisticasDistribucion obtenerEstadisticasDistribucion(Long usuarioId) {
        List<Calificacion> calificaciones = calificacionRepository.findByCalificadoIdOrderByCreatedAtDesc(usuarioId);

        long estrellas5 = calificaciones.stream().filter(c -> c.getPuntuacion() == 5).count();
        long estrellas4 = calificaciones.stream().filter(c -> c.getPuntuacion() == 4).count();
        long estrellas3 = calificaciones.stream().filter(c -> c.getPuntuacion() == 3).count();
        long estrellas2 = calificaciones.stream().filter(c -> c.getPuntuacion() == 2).count();
        long estrellas1 = calificaciones.stream().filter(c -> c.getPuntuacion() == 1).count();

        BigDecimal promedio = calcularPromedio(usuarioId);

        return new CalificacionDTO.EstadisticasDistribucion(
                (long) calificaciones.size(),
                promedio != null ? promedio.doubleValue() : 0.0,
                estrellas5,
                estrellas4,
                estrellas3,
                estrellas2,
                estrellas1
        );
    }

    private void actualizarPromedioCalificacion(Long usuarioId) {
        BigDecimal promedio = calcularPromedio(usuarioId);
        usuarioRepository.updateCalificacionPromedio(usuarioId, promedio);
        log.info("Promedio de calificación actualizado para usuario {}: {}", usuarioId, promedio);
    }

    private BigDecimal calcularPromedio(Long usuarioId) {
        List<Calificacion> calificaciones = calificacionRepository.findByCalificadoIdOrderByCreatedAtDesc(usuarioId);
        
        if (calificaciones.isEmpty()) {
            return BigDecimal.ZERO;
        }

        double promedio = calificaciones.stream()
                .mapToInt(Calificacion::getPuntuacion)
                .average()
                .orElse(0.0);

        return BigDecimal.valueOf(promedio).setScale(2, RoundingMode.HALF_UP);
    }

    private CalificacionDTO.Response mapToResponse(Calificacion calificacion) {
        return new CalificacionDTO.Response(
                calificacion.getId(),
                calificacion.getServicio().getId(),
                calificacion.getCalificador().getId(),
                calificacion.getCalificador().getNombre(),
                calificacion.getCalificador().getFotoPerfil(),
                calificacion.getCalificado().getId(),
                calificacion.getCalificado().getNombre(),
                calificacion.getPuntuacion(),
                calificacion.getComentario(),
                calificacion.getTipo().name(),
                calificacion.getCreatedAt().toString()
        );
    }
}
