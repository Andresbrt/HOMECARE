package com.homecare.domain.user.service;

import com.homecare.dto.UsuarioDTO;
import com.homecare.common.exception.NotFoundException;
import com.homecare.common.exception.UnauthorizedException;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.domain.service_order.repository.ServicioAceptadoRepository;
import com.homecare.domain.service_order.repository.CalificacionRepository;
import com.homecare.domain.common.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final ServicioAceptadoRepository servicioRepository;
    private final CalificacionRepository calificacionRepository;
    @SuppressWarnings("unused")
    private final FileStorageService fileStorageService;

    public UsuarioDTO.Response obtenerPerfil(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        return mapToResponse(usuario);
    }

    @Transactional
    public UsuarioDTO.Response actualizarPerfil(Long usuarioId, UsuarioDTO.Actualizar request) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        if (request.getNombre() != null) usuario.setNombre(request.getNombre());
        if (request.getTelefono() != null) usuario.setTelefono(request.getTelefono());
        if (request.getDireccion() != null) usuario.setDireccion(request.getDireccion());

        usuario = usuarioRepository.save(usuario);
        log.info("Perfil actualizado para usuario {}", usuarioId);
        return mapToResponse(usuario);
    }

    @Transactional
    public void actualizarUbicacion(Long usuarioId, BigDecimal latitud, BigDecimal longitud) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        usuario.setLatitud(latitud);
        usuario.setLongitud(longitud);
        usuarioRepository.save(usuario);
        log.info("UbicaciÃ³n actualizada para usuario {}: {}, {}", usuarioId, latitud, longitud);
    }

    @Transactional
    public void cambiarDisponibilidad(Long usuarioId, Boolean disponible) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        if (!usuario.getRoles().stream().anyMatch(r -> r.getNombre().equals("ROLE_SERVICE_PROVIDER"))) {
            throw new UnauthorizedException("Solo los proveedores pueden cambiar su disponibilidad");
        }

        usuario.setDisponible(disponible);
        usuarioRepository.save(usuario);
        log.info("Disponibilidad cambiada para proveedor {}: {}", usuarioId, disponible);
    }

    public UsuarioDTO.Estadisticas obtenerEstadisticas(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        Long serviciosCompletados = servicioRepository.countServiciosCompletadosPorUsuario(usuarioId);
        BigDecimal totalGanado = servicioRepository.calcularTotalGanadoPorProveedor(usuarioId);
        Long totalCalificaciones = calificacionRepository.countByCalificadoId(usuarioId);

        return new UsuarioDTO.Estadisticas(
                serviciosCompletados,
                totalGanado != null ? totalGanado : BigDecimal.ZERO,
                usuario.getCalificacionPromedio(),
                totalCalificaciones
        );
    }

    public UsuarioDTO.Response obtenerPerfilPublico(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        return mapToResponse(usuario);
    }

    private UsuarioDTO.Response mapToResponse(Usuario usuario) {
        return new UsuarioDTO.Response(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getTelefono(),
                usuario.getFotoPerfil(),
                usuario.getDireccion(),
                usuario.getLatitud(),
                usuario.getLongitud(),
                usuario.getDisponible(),
                usuario.getCalificacionPromedio(),
                usuario.getRoles().stream()
                        .map(r -> r.getNombre().replace("ROLE_", ""))
                        .toList()
        );
    }
}

