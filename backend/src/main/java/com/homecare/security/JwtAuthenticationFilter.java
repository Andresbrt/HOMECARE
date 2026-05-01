package com.homecare.security;

import com.homecare.domain.common.service.TokenBlacklistService;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro JWT que acepta dos tipos de tokens:
 *
 * <ol>
 *   <li><b>Backend JWT</b> — emitido por {@link JwtTokenProvider} tras el login.</li>
 *   <li><b>Supabase JWT</b> — emitido directamente por Supabase Auth (fallback).
 *       Útil cuando el cliente no ha hecho el intercambio con {@code /auth/supabase-login}
 *       o en llamadas directas desde herramientas de prueba.</li>
 * </ol>
 *
 * <p>Orden de validación:
 * <ol>
 *   <li>Intentar validar como backend JWT (con {@code jwt.secret}).</li>
 *   <li>Si falla, intentar validar como Supabase JWT (con {@code supabase.jwt-secret}).</li>
 *   <li>Si el Supabase JWT es válido, buscar al usuario por {@code supabase_uid}.</li>
 * </ol>
 * </p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;
    private final TokenBlacklistService tokenBlacklistService;
    private final SupabaseJwtValidator supabaseJwtValidator;
    private final UsuarioRepository usuarioRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt)) {
                if (tryAuthenticateWithBackendJwt(jwt, request)) {
                    // Autenticado con JWT del backend — flujo normal
                } else {
                    tryAuthenticateWithSupabaseJwt(jwt, request);
                }
            }
        } catch (Exception ex) {
            log.error("No se pudo establecer la autenticación del usuario en el contexto de seguridad", ex);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Valida el token como JWT del backend y establece el contexto de seguridad.
     *
     * @return {@code true} si la autenticación fue exitosa
     */
    private boolean tryAuthenticateWithBackendJwt(String jwt, HttpServletRequest request) {
        try {
            if (!jwtTokenProvider.validateToken(jwt)) {
                return false;
            }

            // Verificar que no fue revocado (logout)
            if (tokenBlacklistService.isBlacklisted(jwt)) {
                log.debug("Token backend rechazado: está en blacklist (logout previo)");
                return false;
            }

            Long userId = jwtTokenProvider.getUserIdFromToken(jwt);
            UserDetails userDetails = customUserDetailsService.loadUserById(userId);
            setAuthentication(userDetails, request);
            return true;

        } catch (Exception ex) {
            // No loguear como error — puede ser simplemente un JWT de Supabase
            log.trace("Token no es JWT del backend: {}", ex.getMessage());
            return false;
        }
    }

    /**
     * Valida el token como JWT de Supabase y, si es válido, carga el usuario por {@code supabase_uid}.
     * Si el usuario no existe en la DB local, no se establece autenticación
     * (el cliente debe llamar primero a {@code /auth/supabase-login} para registrarse).
     */
    private void tryAuthenticateWithSupabaseJwt(String jwt, HttpServletRequest request) {
        try {
            if (!supabaseJwtValidator.isValid(jwt)) {
                return;
            }

            String supabaseUid = supabaseJwtValidator.extractSubject(jwt);

            usuarioRepository.findBySupabaseUid(supabaseUid).ifPresentOrElse(
                    usuario -> {
                        UserDetails userDetails = CustomUserDetails.build(usuario);
                        setAuthentication(userDetails, request);
                        log.debug("Autenticado con Supabase JWT — uid={}", supabaseUid);
                    },
                    () -> log.debug("Supabase JWT válido pero usuario no registrado localmente (uid={}). " +
                                   "Debe llamar a /auth/supabase-login primero.", supabaseUid)
            );

        } catch (Exception ex) {
            log.debug("Token Supabase inválido o error al cargar usuario: {}", ex.getMessage());
        }
    }

    private void setAuthentication(UserDetails userDetails, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

