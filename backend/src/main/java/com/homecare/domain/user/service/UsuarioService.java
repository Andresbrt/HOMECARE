package com.homecare.domain.user.service;

import com.homecare.dto.UsuarioDTO;
import com.homecare.common.exception.NotFoundException;
import com.homecare.common.exception.UnauthorizedException;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.domain.service_order.repository.ServicioAceptadoRepository;
import com.homecare.domain.service_order.repository.CalificacionRepository;
import com.homecare.domain.common.service.FileStorageService;
import com.homecare.domain.common.service.EmailService;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final ServicioAceptadoRepository servicioRepository;
    private final CalificacionRepository calificacionRepository;
    private final EmailService emailService;
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
        log.info("Ubicación actualizada para usuario {}: {}, {}", usuarioId, latitud, longitud);
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

    public UsuarioDTO.PerfilPublicoResponse obtenerPerfilPublico(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        return mapToPerfilPublicoResponse(usuario);
    }

    private UsuarioDTO.PerfilPublicoResponse mapToPerfilPublicoResponse(Usuario usuario) {
        int servicios = usuario.getServiciosCompletados() != null ? usuario.getServiciosCompletados() : 0;
        return new UsuarioDTO.PerfilPublicoResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getFotoPerfil(),
                usuario.getDisponible(),
                usuario.getVerificado(),
                usuario.getCalificacionPromedio(),
                servicios,
                calcularNivelRanking(servicios),
                calcularBonusVisibilidad(servicios),
                usuario.getRoles().stream()
                        .map(r -> r.getNombre().replace("ROLE_", ""))
                        .toList()
        );
    }

    public List<UsuarioDTO.Response> listarProveedoresPendientesVerificacion() {
        return usuarioRepository.findProveedoresPendientesVerificacion().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public UsuarioDTO.Verificacion obtenerEstadoVerificacion(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        return UsuarioDTO.Verificacion.builder()
                .verificado(usuario.getVerificado())
                .fotoSelfieVerificacion(usuario.getFotoSelfieVerificacion())
                .fotoCedulaFrontal(usuario.getFotoCedulaFrontal())
                .fotoCedulaPosterior(usuario.getFotoCedulaPosterior())
                .archivoAntecedentes(usuario.getArchivoAntecedentes())
                .verificacionIAScore(usuario.getVerificacionIAScore())
                .comentariosVerificacion(usuario.getComentariosVerificacion())
                .fechaVerificacion(usuario.getFechaVerificacion())
                .intentoVerificacionConcluido(usuario.getIntentoVerificacionConcluido())
                .build();
    }

    @Transactional
    public void verificarProfesional(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        if (!usuario.getRoles().stream().anyMatch(r -> r.getNombre().equals("ROLE_SERVICE_PROVIDER"))) {
            throw new UnauthorizedException("El usuario no es un proveedor de servicios.");
        }

        usuario.setVerificado(true);
        usuario.setFechaVerificacion(java.time.LocalDateTime.now());
        usuario.setActivo(true); // Asegurar que esté habilitado tras verificar
        usuarioRepository.save(usuario);

        log.info("Profesional {} verificado exitosamente por administrador", usuarioId);

        // Notificar por correo
        Map<String, Object> variables = new HashMap<>();
        variables.put("nombre", usuario.getNombre());
        
        emailService.sendHtmlEmail(
            usuario.getEmail(),
            "¡Tu cuenta de HomeCare ha sido verificada!",
            "profesional-verificado",
            variables
        );
    }

    public static String calcularNivelRanking(int serviciosCompletados) {
        if (serviciosCompletados >= 36) return "ELITE";
        if (serviciosCompletados >= 16) return "PRO";
        return "BASIC";
    }

    public static int calcularBonusVisibilidad(int serviciosCompletados) {
        if (serviciosCompletados >= 36) return 10;
        if (serviciosCompletados >= 16) return 5;
        return 0;
    }

    private UsuarioDTO.Response mapToResponse(Usuario usuario) {
        int servicios = usuario.getServiciosCompletados() != null ? usuario.getServiciosCompletados() : 0;
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
                usuario.getVerificado(),
                usuario.getCalificacionPromedio(),
                servicios,
                calcularNivelRanking(servicios),
                calcularBonusVisibilidad(servicios),
                usuario.getRoles().stream()
                        .map(r -> r.getNombre().replace("ROLE_", ""))
                        .toList()
        );
    }

    @Transactional
    public void desactivarCuenta(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        usuario.setActivo(false);
        usuario.setDisponible(false);
        usuario.setNombre("Usuario");
        usuario.setApellido("Inactivo");
        usuario.setTelefono(null);
        usuario.setFotoPerfil(null);
        usuario.setDireccion(null);
        usuarioRepository.save(usuario);
        log.info("Cuenta de usuario {} desactivada y anonimizada exitosamente", usuarioId);
    }
}

