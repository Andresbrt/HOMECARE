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
import com.homecare.security.SupabaseJwtValidator;
import com.homecare.domain.common.service.EmailService;
// FirebaseTokenService eliminado — autenticación 100% Supabase Auth
import com.homecare.domain.user.model.UserToken;
import com.homecare.domain.user.model.UserTokenType;
import com.homecare.domain.user.repository.UserTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final SupabaseJwtValidator supabaseJwtValidator;
    private final EmailService emailService;
    private final UserTokenRepository userTokenRepository;
    private final com.homecare.domain.common.service.FileStorageService fileStorageService;
    private final com.homecare.domain.user.validator.PasswordValidator passwordValidator;
    // firebaseTokenService eliminado — el JWT de Supabase se valida con SupabaseJwtValidator

    @Value("${app.frontend.base-url:https://homecare.works}")
    private String frontendBaseUrl;

    @Value("${app.backend.base-url:https://api.homecare.works}")
    private String backendBaseUrl;

    /**
     * Normaliza el nombre del rol para el cliente móvil.
     * La DB almacena "ROLE_CUSTOMER", "ROLE_SERVICE_PROVIDER".
     * El móvil espera "CUSTOMER", "SERVICE_PROVIDER" (sin prefijo).
     */
    private String normalizeRole(String roleName) {
        if (roleName == null) return "CUSTOMER";
        return roleName.startsWith("ROLE_") ? roleName.substring(5) : roleName;
    }

    @Transactional
    public AuthDTO.LoginResponse registro(AuthDTO.Registro registroDTO) {
        String emailNorm = registroDTO.getEmail().trim().toLowerCase();

        if (usuarioRepository.existsByEmail(emailNorm)) {
            throw new DuplicateResourceException("El email '" + emailNorm + "' ya está registrado en nuestra plataforma.");
        }

        passwordValidator.validate(registroDTO.getPassword());

        if (usuarioRepository.existsByTelefono(registroDTO.getTelefono())) {
            throw new DuplicateResourceException("El número de teléfono '" + registroDTO.getTelefono() + "' ya está asociado a otra cuenta.");
        }

        String rolNombre = "ROLE_" + registroDTO.getRol().toUpperCase();
        Rol rol = rolRepository.findByNombre(rolNombre)
                .orElseThrow(() -> new AuthException("Rol no encontrado: " + rolNombre));

        // Validar documentos obligatorios para proveedores
        if ("SERVICE_PROVIDER".equalsIgnoreCase(registroDTO.getRol())) {
            if (registroDTO.getFotoSelfieBase64() == null || registroDTO.getFotoSelfieBase64().isBlank()) {
                throw new AuthException("La foto selfie es obligatoria para proveedores de servicio");
            }
            if (registroDTO.getFotoCedulaFrontalBase64() == null || registroDTO.getFotoCedulaFrontalBase64().isBlank()) {
                throw new AuthException("La foto frontal de la cédula es obligatoria para proveedores de servicio");
            }
            if (registroDTO.getFotoCedulaPosteriorBase64() == null || registroDTO.getFotoCedulaPosteriorBase64().isBlank()) {
                throw new AuthException("La foto posterior de la cédula es obligatoria para proveedores de servicio");
            }
            if (registroDTO.getArchivoAntecedentesBase64() == null || registroDTO.getArchivoAntecedentesBase64().isBlank()) {
                throw new AuthException("El archivo de antecedentes judiciales es obligatorio para proveedores de servicio");
            }
        }

        Usuario usuario = Usuario.builder()
                .email(emailNorm)
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

        // Si es proveedor, guardar documentos DESPUÉS de obtener el ID (savedUser)
        if (registroDTO.getRol().equalsIgnoreCase("SERVICE_PROVIDER")) {
            boolean documentosGuardados = false;
            if (registroDTO.getFotoSelfieBase64() != null) {
                savedUser.setFotoSelfieVerificacion(fileStorageService.saveBase64(registroDTO.getFotoSelfieBase64(), "verificacion", "selfie_" + savedUser.getId()));
                documentosGuardados = true;
            }
            if (registroDTO.getFotoCedulaFrontalBase64() != null) {
                savedUser.setFotoCedulaFrontal(fileStorageService.saveBase64(registroDTO.getFotoCedulaFrontalBase64(), "verificacion", "cedula_front_" + savedUser.getId()));
                documentosGuardados = true;
            }
            if (registroDTO.getFotoCedulaPosteriorBase64() != null) {
                savedUser.setFotoCedulaPosterior(fileStorageService.saveBase64(registroDTO.getFotoCedulaPosteriorBase64(), "verificacion", "cedula_back_" + savedUser.getId()));
                documentosGuardados = true;
            }
            if (registroDTO.getArchivoAntecedentesBase64() != null) {
                savedUser.setArchivoAntecedentes(fileStorageService.saveBase64(registroDTO.getArchivoAntecedentesBase64(), "verificacion", "antecedentes_" + savedUser.getId()));
                documentosGuardados = true;
            }
            if (documentosGuardados) {
                savedUser = usuarioRepository.save(savedUser); // Actualizar con las rutas de archivos
            }
        }
        
        // Generar token de verificación
        String token = java.util.UUID.randomUUID().toString();
        UserToken userToken = UserToken.builder()
                .usuario(savedUser)
                .tokenHash(token)
                .tokenType(UserTokenType.VERIFICATION)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        userTokenRepository.save(userToken);

        // Enviar email de verificación (opcional en desarrollo/test)
        try {
            Map<String, Object> variables = new HashMap<>();
            variables.put("userName", savedUser.getNombre());
            String verificationUrl = backendBaseUrl + "/api/auth/verify-link?token=" + token;
            variables.put("verificationLink", verificationUrl);
            variables.put("expiryHours", 24);
            emailService.sendHtmlEmail(savedUser.getEmail(), "Verifica tu email - HOME CARE", "email/verification", variables);
        } catch (Exception e) {
            // En modo desarrollo/test, no fallar si el email no se puede enviar
            // log.warn("No se pudo enviar email de verificación: {}", e.getMessage());
        }
        
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
                .rol(normalizeRole(rolNombre))
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
        // Normalizar email: Android puede enviar mayúsculas por autocompletado o pegado
        String emailNorm = email == null ? "" : email.trim().toLowerCase();

        Usuario usuario = usuarioRepository.findByEmail(emailNorm)
                .orElseThrow(() -> new AuthException("Credenciales inválidas"));

        if (usuario.getPassword() == null || !passwordEncoder.matches(password, usuario.getPassword())) {
            throw new AuthException("Credenciales inválidas");
        }

        if (!usuario.getActivo()) {
            throw new AuthException("Su cuenta está inactiva. Contacte al administrador.");
        }

        usuario.setUltimoAcceso(LocalDateTime.now());
        usuarioRepository.save(usuario);

        CustomUserDetails userDetails = CustomUserDetails.create(usuario);
        String token = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        String mainRole = usuario.getRoles().isEmpty() ? "ROLE_CUSTOMER"
                : usuario.getRoles().iterator().next().getNombre();

        return AuthDTO.LoginResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .tipo("Bearer")
                .id(usuario.getId())
                .email(usuario.getEmail())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .fotoPerfil(usuario.getFotoPerfil())
                .rol(normalizeRole(mainRole))
                .expiresIn(jwtTokenProvider.getJwtExpirationMs() / 1000)
                .build();
    }

    @Transactional(readOnly = true)
    public AuthDTO.LoginResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new AuthException("Token de refresco inválido");
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        if (!usuario.getActivo()) {
            throw new AuthException("Su cuenta está inactiva");
        }

        CustomUserDetails userDetails = CustomUserDetails.create(usuario);
        String newToken = jwtTokenProvider.generateToken(userDetails);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        String mainRole = usuario.getRoles().isEmpty() ? "ROLE_CUSTOMER"
                : usuario.getRoles().iterator().next().getNombre();

        return AuthDTO.LoginResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .tipo("Bearer")
                .id(usuario.getId())
                .email(usuario.getEmail())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .fotoPerfil(usuario.getFotoPerfil())
                .rol(normalizeRole(mainRole))
                .expiresIn(jwtTokenProvider.getJwtExpirationMs() / 1000)
                .build();
    }

    @Transactional
    public void cambiarPassword(Long userId, String oldPassword, String newPassword) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        if (!passwordEncoder.matches(oldPassword, usuario.getPassword())) {
            throw new AuthException("La contraseña actual es incorrecta");
        }

        if (oldPassword.equals(newPassword)) {
            throw new AuthException("La nueva contraseña debe ser diferente a la actual");
        }

        usuario.setPassword(passwordEncoder.encode(newPassword));
        usuarioRepository.save(usuario);
    }

    @Transactional(readOnly = true)
    public AuthDTO.UsuarioInfo obtenerInfoUsuario(Long userId) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        String mainRole = usuario.getRoles().isEmpty() ? "CUSTOMER" : normalizeRole(usuario.getRoles().iterator().next().getNombre());

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

    /**
     * loginWithSupabaseToken
     * Valida el JWT emitido por Supabase Auth y retorna el perfil del usuario.
     * El cliente móvil envía el access_token de Supabase en el header Authorization.
     * JwtTokenProvider ya valida la firma — aquí solo extraemos el email del subject.
     *
     * @param dto  contiene el supabaseToken (JWT de Supabase)
     */
    @Transactional
    public AuthDTO.LoginResponse loginWithSupabaseToken(AuthDTO.SupabaseLogin dto) {
        String supabaseJwt = dto.getSupabaseToken();

        // Validar firma con la clave correcta de Supabase (distinta al jwt.secret del backend)
        if (!supabaseJwtValidator.isValid(supabaseJwt)) {
            throw new AuthException("Token de Supabase inválido o expirado");
        }

        String supabaseUid = supabaseJwtValidator.extractSubject(supabaseJwt);
        String emailRaw = supabaseJwtValidator.extractEmail(supabaseJwt);
        if (emailRaw == null || emailRaw.isBlank()) {
            throw new AuthException("El token de Supabase no contiene un email válido");
        }
        String email = emailRaw.trim().toLowerCase();

        // Buscar primero por supabaseUid, luego por email (usuarios migrados sin uid)
        Usuario usuario = usuarioRepository.findBySupabaseUid(supabaseUid)
                .or(() -> usuarioRepository.findByEmail(email))
                .orElseGet(() -> {
                    // Usuario existe en Supabase Auth pero no en la DB local (trigger no ejecutó aún)
                    Usuario nuevo = new Usuario();
                    nuevo.setEmail(email);
                    nuevo.setSupabaseUid(supabaseUid);
                    nuevo.setPassword("{supabase}" + java.util.UUID.randomUUID());
                    nuevo.setNombre(dto.getNombre() != null ? dto.getNombre() : "Usuario");
                    nuevo.setApellido(dto.getApellido() != null ? dto.getApellido() : "");
                    // telefono puede ser null en login Google — asignar placeholder para evitar NOT NULL constraint
                    nuevo.setTelefono(dto.getTelefono() != null && !dto.getTelefono().isBlank()
                            ? dto.getTelefono() : "0000000000");
                    nuevo.setActivo(true);
                    nuevo.setVerificado(true);

                    // Roles en DB tienen prefijo ROLE_ (ej: ROLE_CUSTOMER, ROLE_SERVICE_PROVIDER)
                    String rolNombre = "ROLE_" + (dto.getRol() != null ? dto.getRol().toUpperCase() : "CUSTOMER");
                    Rol rol = rolRepository.findByNombre(rolNombre)
                            .orElseGet(() -> rolRepository.findByNombre("ROLE_CUSTOMER")
                                    .orElseThrow(() -> new AuthException("Rol ROLE_CUSTOMER no encontrado en la base de datos")));
                    nuevo.setRoles(new HashSet<>(Set.of(rol)));
                    return usuarioRepository.save(nuevo);
                });

        // Si el usuario existía por email pero no tenía supabaseUid, actualizarlo
        if (usuario.getSupabaseUid() == null) {
            usuario.setSupabaseUid(supabaseUid);
        }

        if (!usuario.getActivo()) {
            throw new AuthException("Su cuenta está inactiva. Contacte al administrador.");
        }

        usuario.setUltimoAcceso(LocalDateTime.now());
        usuarioRepository.save(usuario);

        // Generar JWT propio del backend para llamadas subsiguientes
        CustomUserDetails userDetails = CustomUserDetails.create(usuario);
        String token = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);
        String mainRole = normalizeRole(usuario.getRoles().isEmpty() ? "CUSTOMER" :
                usuario.getRoles().iterator().next().getNombre());

        return AuthDTO.LoginResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .tipo("Bearer")
                .id(usuario.getId())
                .email(usuario.getEmail())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .fotoPerfil(usuario.getFotoUrl())
                .rol(mainRole)
                .expiresIn(jwtTokenProvider.getJwtExpirationMs() / 1000)
                .build();
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

        String codigo = String.format("%04d", new java.security.SecureRandom().nextInt(10000));
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
        String mainRole = normalizeRole(usuario.getRoles().iterator().next().getNombre());

        return AuthDTO.LoginResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .tipo("Bearer")
                .id(usuario.getId())
                .email(usuario.getEmail())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .fotoPerfil(usuario.getFotoPerfil())
                .rol(mainRole)
                .expiresIn(jwtTokenProvider.getJwtExpirationMs() / 1000)
                .build();
    }
}

