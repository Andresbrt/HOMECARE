package com.homecare.service;

import com.homecare.dto.AuthDTO;
import com.homecare.exception.AuthException;
import com.homecare.model.Rol;
import com.homecare.model.Usuario;
import com.homecare.repository.RolRepository;
import com.homecare.repository.UsuarioRepository;
import com.homecare.security.CustomUserDetails;
import com.homecare.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    @SuppressWarnings("unused")
    private final NotificationService notificationService;

    @Transactional
    public AuthDTO.LoginResponse registro(AuthDTO.Registro request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("El email ya está registrado");
        }

        if (usuarioRepository.existsByTelefono(request.getTelefono())) {
            throw new AuthException("El teléfono ya está registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setEmail(request.getEmail());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setNombre(request.getNombre());
        usuario.setTelefono(request.getTelefono());
        usuario.setActivo(true);

        if (request.getLatitud() != null && request.getLongitud() != null) {
            usuario.setLatitud(request.getLatitud());
            usuario.setLongitud(request.getLongitud());
            usuario.setUltimaUbicacion(LocalDateTime.now());
        }

        String rolNombre = "ROLE_" + request.getTipoUsuario().toUpperCase();
        Rol rol = rolRepository.findByNombre(rolNombre)
                .orElseThrow(() -> new AuthException("Rol no encontrado: " + rolNombre));

        Set<Rol> roles = new HashSet<>();
        roles.add(rol);
        usuario.setRoles(roles);

        if ("ROLE_SERVICE_PROVIDER".equals(rolNombre)) {
            usuario.setDisponible(false); // Disponible después de completar perfil
            usuario.setCalificacionPromedio(BigDecimal.ZERO);
        }

        usuario = usuarioRepository.save(usuario);

        CustomUserDetails userDetails = new CustomUserDetails(usuario);
        String accessToken = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        log.info("Usuario registrado exitosamente: {} ({})", usuario.getEmail(), rolNombre);

        return new AuthDTO.LoginResponse(
                accessToken,
                refreshToken,
                "Bearer",
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getFotoPerfil(),
                usuario.getRoles().iterator().next().getNombre(),
                jwtTokenProvider.getJwtExpirationMs() / 1000
        );
    }

    @Transactional
    public AuthDTO.LoginResponse login(String email, String password) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Credenciales inválidas"));

        if (!passwordEncoder.matches(password, usuario.getPassword())) {
            log.warn("Intento de login fallido para usuario: {}", email);
            throw new BadCredentialsException("Credenciales inválidas");
        }

        if (!usuario.getActivo()) {
            throw new AuthException("La cuenta está inactiva. Contacta a soporte.");
        }

        usuario.setUltimoAcceso(LocalDateTime.now());
        usuarioRepository.save(usuario);

        CustomUserDetails userDetails = new CustomUserDetails(usuario);
        String accessToken = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        log.info("Usuario autenticado: {}", email);

        return new AuthDTO.LoginResponse(
                accessToken,
                refreshToken,
                "Bearer",
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getFotoPerfil(),
                usuario.getRoles().iterator().next().getNombre(),
                jwtTokenProvider.getJwtExpirationMs() / 1000
        );
    }

    public AuthDTO.LoginResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new AuthException("Refresh token inválido o expirado");
        }

        Long usuarioId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        if (!usuario.getActivo()) {
            throw new AuthException("La cuenta está inactiva");
        }

        CustomUserDetails userDetails = new CustomUserDetails(usuario);
        String newAccessToken = jwtTokenProvider.generateToken(userDetails);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        log.info("Token refrescado para usuario: {}", usuario.getEmail());

        return new AuthDTO.LoginResponse(
                newAccessToken,
                newRefreshToken,
                "Bearer",
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getFotoPerfil(),
                usuario.getRoles().iterator().next().getNombre(),
                jwtTokenProvider.getJwtExpirationMs() / 1000
        );
    }

    @Transactional
    public void cambiarPassword(Long usuarioId, String passwordActual, String nuevaPassword) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        if (!passwordEncoder.matches(passwordActual, usuario.getPassword())) {
            throw new AuthException("La contraseña actual es incorrecta");
        }

        if (passwordActual.equals(nuevaPassword)) {
            throw new AuthException("La nueva contraseña debe ser diferente a la actual");
        }

        usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);

        log.info("Contraseña cambiada para usuario: {}", usuario.getEmail());
    }

    @Transactional
    public void solicitarRecuperacionPassword(String email) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        
        if (usuarioOpt.isEmpty()) {
            log.warn("Solicitud de recuperación para email no registrado: {}", email);
            return;
        }

        Usuario usuario = usuarioOpt.get();
        @SuppressWarnings("unused")
        String resetToken = jwtTokenProvider.generatePasswordResetToken(usuario.getId());

        log.info("Token de recuperación generado para usuario: {}", email);
    }

    @Transactional
    public void resetearPassword(String token, String nuevaPassword) {
        if (!jwtTokenProvider.validateToken(token)) {
            throw new AuthException("Token de recuperación inválido o expirado");
        }

        Long usuarioId = jwtTokenProvider.getUserIdFromToken(token);
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);

        log.info("Contraseña reseteada para usuario: {}", usuario.getEmail());
    }

    public AuthDTO.UsuarioInfo obtenerInfoUsuario(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        return mapToUsuarioInfo(usuario);
    }

    private AuthDTO.UsuarioInfo mapToUsuarioInfo(Usuario usuario) {
        String rol = usuario.getRoles().isEmpty() ? "USER" : 
                     usuario.getRoles().iterator().next().getNombre();
        
        return new AuthDTO.UsuarioInfo(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getTelefono(),
                usuario.getFotoPerfil(),
                rol,
                usuario.getActivo(),
                usuario.getVerificado(),
                usuario.getDisponible()
        );
    }
}
