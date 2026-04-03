package com.homecare.domain.user.service;

import com.homecare.dto.AuthDTO;
import com.homecare.common.exception.AuthException;
import com.homecare.common.exception.DuplicateResourceException;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.model.Rol;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.domain.user.repository.RolRepository;
import com.homecare.security.CustomUserDetails;
import com.homecare.security.JwtTokenProvider;
import com.homecare.domain.common.service.NotificationService;
import com.homecare.domain.common.service.EmailService;
import com.homecare.domain.common.service.FirebaseTokenService;
import com.homecare.domain.user.model.UserToken;
import com.homecare.domain.user.model.UserTokenType;
import com.homecare.domain.user.repository.UserTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final UserTokenRepository userTokenRepository;
    private final com.homecare.domain.common.service.FileStorageService fileStorageService;
    private final com.homecare.domain.user.validator.PasswordValidator passwordValidator;
    private final FirebaseTokenService firebaseTokenService;

    @Value("${app.frontend.base-url:https://homecare.works}")
    private String frontendBaseUrl;

    @Value("${app.backend.base-url:https://api.homecare.works}")
    private String backendBaseUrl;

    @Transactional
    public AuthDTO.LoginResponse registro(AuthDTO.Registro registroDTO) {
        if (usuarioRepository.existsByEmail(registroDTO.getEmail())) {
            throw new DuplicateResourceException("El email '" + registroDTO.getEmail() + "' ya está registrado en nuestra plataforma.");
        }

        passwordValidator.validate(registroDTO.getPassword());

        if (usuarioRepository.existsByTelefono(registroDTO.getTelefono())) {
            throw new DuplicateResourceException("El número de teléfono '" + registroDTO.getTelefono() + "' ya está asociado a otra cuenta.");
        }

        String rolNombre = "ROLE_" + registroDTO.getRol().toUpperCase();
        Rol rol = rolRepository.findByNombre(rolNombre)
                .orElseGet(() -> {
                    // Si el rol no existe en H2 (memoria), lo creamos al vuelo
                    Rol nuevoRol = new Rol();
                    nuevoRol.setNombre(rolNombre);
                    nuevoRol.setDescripcion("Autogenerado");
                    return rolRepository.save(nuevoRol);
                });

        Usuario usuario = Usuario.builder()
                .email(registroDTO.getEmail())
                .password(passwordEncoder.encode(registroDTO.getPassword()))
                .nombre(registroDTO.getNombre())
                .apellido(registroDTO.getApellido())
                .telefono(registroDTO.getTelefono())
                .documentoIdentidad(registroDTO.getDocumentoIdentidad())
                .descripcion(registroDTO.getDescripcion())
                .experienciaAnos(registroDTO.getExperienciaAnos())
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

        // Si es proveedor, guardar documentos DESPUÃ‰S de obtener el ID (savedUser)
        if (registroDTO.getRol().equalsIgnoreCase("SERVICE_PROVIDER")) {
            // Guardar documentos de identidad si vienen en base64
            if (registroDTO.getFotoSelfieBase64() != null) {
                savedUser.setFotoSelfieVerificacion(fileStorageService.saveBase64(registroDTO.getFotoSelfieBase64(), "verificacion", "selfie_" + savedUser.getId()));
            }
            if (registroDTO.getFotoCedulaFrontalBase64() != null) {
                savedUser.setFotoCedulaFrontal(fileStorageService.saveBase64(registroDTO.getFotoCedulaFrontalBase64(), "verificacion", "cedula_front_" + savedUser.getId()));
            }
            if (registroDTO.getFotoCedulaPosteriorBase64() != null) {
                savedUser.setFotoCedulaPosterior(fileStorageService.saveBase64(registroDTO.getFotoCedulaPosteriorBase64(), "verificacion", "cedula_back_" + savedUser.getId()));
            }
            if (registroDTO.getArchivoAntecedentesBase64() != null) {
                savedUser.setArchivoAntecedentes(fileStorageService.saveBase64(registroDTO.getArchivoAntecedentesBase64(), "verificacion", "antecedentes_" + savedUser.getId()));
            }
            
            savedUser = usuarioRepository.save(savedUser); // Actualizar con las rutas de archivos
        }
        
        // Generar token de verificaciÃ³n
        String token = java.util.UUID.randomUUID().toString();
        UserToken userToken = UserToken.builder()
                .usuario(savedUser)
                .tokenHash(token)
                .tokenType(UserTokenType.VERIFICATION)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        userTokenRepository.save(userToken);

        // Enviar email de verificación
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", savedUser.getNombre());
        String verificationUrl = backendBaseUrl + "/api/auth/verify-link?token=" + token;
        variables.put("verificationLink", verificationUrl);
        variables.put("expiryHours", 24);
        emailService.sendHtmlEmail(savedUser.getEmail(), "Verifica tu email - HOME CARE", "email/verification", variables);
        
        CustomUserDetails userDetails = CustomUserDetails.create(savedUser);
        String jwtToken = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        return AuthDTO.LoginResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .tipo("Bearer")
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .nombre(savedUser.getNombre())
                .apellido(savedUser.getApellido())
                .fotoPerfil(savedUser.getFotoPerfil())
                .rol(rolNombre)
                .expiresIn(jwtTokenProvider.getJwtExpirationMs() / 1000)
                .build();
    }

    @Transactional
    public void solicitarRecuperacionPassword(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) return; // Por seguridad no revelamos si el email existe

        // Limpiar tokens anteriores
        userTokenRepository.deleteByUsuarioIdAndTokenType(usuario.getId(), UserTokenType.PASSWORD_RESET);

        String token = UUID.randomUUID().toString();
        UserToken userToken = UserToken.builder()
                .usuario(usuario)
                .tokenHash(token)
                .tokenType(UserTokenType.PASSWORD_RESET)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();
        userTokenRepository.save(userToken);

        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", usuario.getNombre());
        variables.put("resetLink", frontendBaseUrl + "/reset-password?token=" + token);
        variables.put("expiryHours", 1);
        emailService.sendHtmlEmail(usuario.getEmail(), "Recupera tu contraseña - HOME CARE", "email/password-reset", variables);
    }

    @Transactional
    public void resetearPassword(String token, String nuevaPassword) {
        UserToken userToken = userTokenRepository.findByTokenHashAndTokenType(token, UserTokenType.PASSWORD_RESET)
                .orElseThrow(() -> new AuthException("Token inválido o expirado"));

        if (userToken.getUsed() || userToken.isExpired()) {
            throw new AuthException("Token inválido o expirado");
        }

        Usuario usuario = userToken.getUsuario();
        usuario.setPassword(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);

        userToken.setUsed(true);
        userToken.setUsedAt(LocalDateTime.now());
        userTokenRepository.save(userToken);
    }

    @Transactional
    public void verificarEmail(String token) {
        UserToken userToken = userTokenRepository.findByTokenHashAndTokenType(token, UserTokenType.VERIFICATION)
                .orElseThrow(() -> new AuthException("Token de verificación inválido o expirado"));

        if (userToken.getUsed() || userToken.isExpired()) {
            throw new AuthException("Token de verificación inválido o expirado");
        }

        Usuario usuario = userToken.getUsuario();
        usuario.setVerificado(true);
        usuarioRepository.save(usuario);

        userToken.setUsed(true);
        userToken.setUsedAt(LocalDateTime.now());
        userTokenRepository.save(userToken);
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

    @Transactional(readOnly = true)
    public AuthDTO.UsuarioInfo obtenerInfoUsuario(Long userId) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        String mainRole = usuario.getRoles().isEmpty() ? "USER" : usuario.getRoles().iterator().next().getNombre();

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
    public AuthDTO.LoginResponse loginWithFirebase(AuthDTO.FirebaseLogin dto) {
        com.google.firebase.auth.FirebaseToken decoded = firebaseTokenService.verifyIdToken(dto.getFirebaseToken());
        String email = decoded.getEmail();
        if (email == null || email.isBlank()) {
            throw new AuthException("El token de Firebase no contiene un email válido");
        }

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseGet(() -> crearUsuarioDesdeFirebase(decoded, dto));

        if (!usuario.getActivo()) {
            throw new AuthException("Su cuenta está inactiva. Contacte al administrador.");
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

    private Usuario crearUsuarioDesdeFirebase(com.google.firebase.auth.FirebaseToken decoded, AuthDTO.FirebaseLogin dto) {
        String displayName = decoded.getName() != null ? decoded.getName() : "";
        String nombre = dto.getNombre() != null && !dto.getNombre().isBlank() ? dto.getNombre()
                : (displayName.contains(" ") ? displayName.substring(0, displayName.indexOf(" "))
                : displayName.isEmpty() ? "Usuario" : displayName);
        String apellido = dto.getApellido() != null && !dto.getApellido().isBlank() ? dto.getApellido()
                : (displayName.contains(" ") ? displayName.substring(displayName.indexOf(" ") + 1) : "Google");

        String rolNombre = "ROLE_" + (dto.getRol() != null && !dto.getRol().isBlank()
                ? dto.getRol().toUpperCase() : "CUSTOMER");

        Rol rol = rolRepository.findByNombre(rolNombre)
                .orElseGet(() -> {
                    Rol nuevoRol = new Rol();
                    nuevoRol.setNombre(rolNombre);
                    nuevoRol.setDescripcion("Autogenerado");
                    return rolRepository.save(nuevoRol);
                });

        Usuario usuario = Usuario.builder()
                .email(decoded.getEmail())
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .nombre(nombre)
                .apellido(apellido)
                .telefono(dto.getTelefono())
                .activo(true)
                .verificado(true)
                .roles(new HashSet<>(Set.of(rol)))
                .build();

        if (rolNombre.contains("SERVICE_PROVIDER")) {
            usuario.setDisponible(false);
            usuario.setCalificacionPromedio(BigDecimal.ZERO);
        }

        return usuarioRepository.save(usuario);
    }

    // ─── OTP ─────────────────────────────────────────────────────────────────────

    @Transactional
    public AuthDTO.OTPResponse generarYEnviarOTP(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        long enviosUltimaHora = userTokenRepository.countByUsuarioIdAndTokenTypeAndCreatedAtAfter(
                usuario.getId(), UserTokenType.OTP_VERIFICATION, LocalDateTime.now().minusHours(1));
        if (enviosUltimaHora >= 5) {
            throw new AuthException("Demasiados intentos. Espera una hora antes de solicitar otro código.");
        }

        userTokenRepository.deleteByUsuarioIdAndTokenType(usuario.getId(), UserTokenType.OTP_VERIFICATION);

        String codigo = String.format("%04d", ThreadLocalRandom.current().nextInt(0, 10000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10);

        UserToken otpToken = UserToken.builder()
                .usuario(usuario)
                .tokenHash(codigo)
                .tokenType(UserTokenType.OTP_VERIFICATION)
                .expiresAt(expiresAt)
                .used(false)
                .attempts(0)
                .build();
        userTokenRepository.save(otpToken);

        emailService.sendHtmlEmail(email, "Tu código de verificación — HOME CARE",
                "email/otp-verification",
                Map.of("userName", usuario.getNombre(), "otpCode", codigo, "expiryMinutes", 10));

        return AuthDTO.OTPResponse.builder()
                .mensaje("Código enviado a " + email)
                .expiresInSeconds(600L)
                .build();
    }

    @Transactional
    public AuthDTO.LoginResponse verificarOTP(String email, String codigo) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        UserToken otpToken = userTokenRepository
                .findByUsuarioIdAndTokenType(usuario.getId(), UserTokenType.OTP_VERIFICATION)
                .orElseThrow(() -> new AuthException("No hay un código de verificación activo para este email"));

        if (otpToken.getUsed() || otpToken.isExpired()) {
            throw new AuthException("El código ha expirado. Solicita uno nuevo.");
        }

        int intentos = otpToken.getAttempts() + 1;
        if (intentos > 3) {
            throw new AuthException("Demasiados intentos fallidos. Solicita un nuevo código.");
        }

        if (!otpToken.getTokenHash().equals(codigo)) {
            otpToken.setAttempts(intentos);
            userTokenRepository.save(otpToken);
            int restantes = 3 - intentos;
            throw new AuthException("Código incorrecto. Te quedan " + restantes + " intento(s).");
        }

        otpToken.setUsed(true);
        otpToken.setUsedAt(LocalDateTime.now());
        userTokenRepository.save(otpToken);

        usuario.setVerificado(true);
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
}

