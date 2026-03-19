package com.homecare.domain.user.service;

import com.homecare.dto.AuthDTO;
import com.homecare.common.exception.AuthException;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.model.Rol;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.domain.user.repository.RolRepository;
import com.homecare.security.CustomUserDetails;
import com.homecare.security.JwtTokenProvider;
import com.homecare.domain.common.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final NotificationService notificationService;

    @Transactional
    public AuthDTO.LoginResponse registro(AuthDTO.Registro registroDTO) {
        if (usuarioRepository.existsByEmail(registroDTO.getEmail())) {
            throw new AuthException("El email ya estÃ¡ registrado");
        }

        if (usuarioRepository.existsByTelefono(registroDTO.getTelefono())) {
            throw new AuthException("El telÃ©fono ya estÃ¡ registrado");
        }

        String rolNombre = "ROLE_" + registroDTO.getRol().toUpperCase();
        Rol rol = rolRepository.findByNombre(rolNombre)
                .orElseThrow(() -> new AuthException("Rol no encontrado: " + rolNombre));

        Usuario usuario = Usuario.builder()
                .email(registroDTO.getEmail())
                .password(passwordEncoder.encode(registroDTO.getPassword()))
                .nombre(registroDTO.getNombre())
                .apellido(registroDTO.getApellido())
                .telefono(registroDTO.getTelefono())
                .activo(true)
                .verificado(false)
                .roles(new HashSet<>(Set.of(rol)))
                .build();

        if (registroDTO.getRol().equalsIgnoreCase("SERVICE_PROVIDER")) {
            usuario.setDisponible(false);
            usuario.setCalificacionPromedio(BigDecimal.ZERO);
        }

        if (registroDTO.getLatitud() != null && registroDTO.getLongitud() != null) {
            usuario.setLatitud(registroDTO.getLatitud());
            usuario.setLongitud(registroDTO.getLongitud());
            usuario.setUltimaUbicacion(LocalDateTime.now());
        }

        Usuario savedUser = usuarioRepository.save(usuario);
        
        CustomUserDetails userDetails = CustomUserDetails.create(savedUser);
        String token = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        return AuthDTO.LoginResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .tipo("Bearer")
                .email(savedUser.getEmail())
                .rol(rolNombre)
                .expiresIn(jwtTokenProvider.getJwtExpirationMs() / 1000)
                .build();
    }

    @Transactional
    public AuthDTO.LoginResponse login(String email, String password) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Credenciales invÃ¡lidas"));

        if (!passwordEncoder.matches(password, usuario.getPassword())) {
            throw new BadCredentialsException("Credenciales invÃ¡lidas");
        }

        if (!usuario.getActivo()) {
            throw new AuthException("Su cuenta estÃ¡ inactiva. Contacte al administrador.");
        }

        usuario.setUltimoAcceso(LocalDateTime.now());
        usuarioRepository.save(usuario);

        CustomUserDetails userDetails = CustomUserDetails.create(usuario);
        String token = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        String mainRole = usuario.getRoles().iterator().next().getNombre();

        return AuthDTO.LoginResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .tipo("Bearer")
                .email(usuario.getEmail())
                .rol(mainRole)
                .expiresIn(jwtTokenProvider.getJwtExpirationMs() / 1000)
                .build();
    }

    @Transactional(readOnly = true)
    public AuthDTO.LoginResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new AuthException("Token de refresco invÃ¡lido");
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        if (!usuario.getActivo()) {
            throw new AuthException("Su cuenta estÃ¡ inactiva");
        }

        CustomUserDetails userDetails = CustomUserDetails.create(usuario);
        String newToken = jwtTokenProvider.generateToken(userDetails);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        String mainRole = usuario.getRoles().iterator().next().getNombre();

        return AuthDTO.LoginResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .tipo("Bearer")
                .email(usuario.getEmail())
                .rol(mainRole)
                .expiresIn(jwtTokenProvider.getJwtExpirationMs() / 1000)
                .build();
    }

    @Transactional
    public void cambiarPassword(Long userId, String oldPassword, String newPassword) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        if (!passwordEncoder.matches(oldPassword, usuario.getPassword())) {
            throw new AuthException("La contraseÃ±a actual es incorrecta");
        }

        if (oldPassword.equals(newPassword)) {
            throw new AuthException("La nueva contraseÃ±a debe ser diferente a la actual");
        }

        usuario.setPassword(passwordEncoder.encode(newPassword));
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void resetearPassword(String token, String newPassword) {
        if (!jwtTokenProvider.validateToken(token)) {
            throw new AuthException("Enlace de restablecimiento vencido o invÃ¡lido");
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        usuario.setPassword(passwordEncoder.encode(newPassword));
        usuarioRepository.save(usuario);
    }

    @Transactional(readOnly = true)
    public AuthDTO.UsuarioInfo obtenerInfoUsuario(Long userId) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        String mainRole = usuario.getRoles().iterator().next().getNombre();

        return AuthDTO.UsuarioInfo.builder()
                .id(usuario.getId())
                .email(usuario.getEmail())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .telefono(usuario.getTelefono())
                .rol(mainRole)
                .activo(usuario.getActivo())
                .verificado(usuario.getVerificado())
                .fotoPerfil(usuario.getFotoUrl())
                .build();
    }

    @Transactional
    public void solicitarRecuperacionPassword(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElse(null);

        if (usuario != null) {
            String token = jwtTokenProvider.generatePasswordResetToken(usuario.getId());
            // Enviar email con el token...
            notificationService.sendPasswordResetEmail(email, token);
        }
    }
}

