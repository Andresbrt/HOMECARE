package com.homecare.security;

import com.homecare.common.exception.AuthException;
import com.homecare.domain.user.repository.RolRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Collection;
import java.util.Set;

/**
 * Aspecto AOP que intercepta métodos anotados con @RequiereRol.
 *
 * FLUJO DE VALIDACIÓN:
 * 1. Extrae el usuario del SecurityContext (cargado por JwtAuthenticationFilter)
 * 2. Normaliza los alias de roles (PROVEEDOR = SERVICE_PROVIDER = ROLE_SERVICE_PROVIDER)
 * 3. Verifica que el usuario tenga el rol requerido
 * 4. Lanza AccessDeniedException si no tiene permiso
 *
 * Ventaja sobre @PreAuthorize: centraliza la lógica de alias de roles y
 * produce mensajes de error consistentes en español para la app.
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class RolValidacionAspect {

    private final RolRepository rolRepository;

    /**
     * Mapa de alias de roles: nombre lógico → variantes aceptadas en la DB.
     * Maneja los diferentes nombres históricos que puede tener un rol.
     */
    private static final java.util.Map<String, Set<String>> ROL_ALIAS = java.util.Map.of(
        "PROVEEDOR",  Set.of("PROVEEDOR", "SERVICE_PROVIDER", "ROLE_SERVICE_PROVIDER"),
        "CLIENTE",    Set.of("CLIENTE", "CUSTOMER", "ROLE_CUSTOMER"),
        "ADMIN",      Set.of("ADMIN", "ROLE_ADMIN")
    );

    /**
     * Intercede ALREDEDOR de cualquier método anotado con @RequiereRol
     * (en cualquier bean gestionado por Spring).
     */
    @Around("@annotation(com.homecare.security.RequiereRol) || " +
            "@within(com.homecare.security.RequiereRol)")
    public Object validarRol(ProceedingJoinPoint joinPoint) throws Throwable {

        // 1. Resolver la anotación (puede estar en el método o en la clase)
        Method method = ((MethodSignature) joinPoint.getSignature()).getMethod();
        RequiereRol anotacion = method.getAnnotation(RequiereRol.class);
        if (anotacion == null) {
            // Buscar en la clase si no está en el método
            anotacion = joinPoint.getTarget().getClass().getAnnotation(RequiereRol.class);
        }
        if (anotacion == null) {
            return joinPoint.proceed(); // Sin anotación, pasar sin restricción
        }

        String rolRequerido = anotacion.value().toUpperCase();

        // 2. Obtener el usuario autenticado del contexto de seguridad
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException("Se requiere autenticación para esta operación");
        }

        // 3. Extraer las authorities del usuario (ya cargadas por JwtAuthenticationFilter)
        Collection<? extends GrantedAuthority> authorities = auth.getAuthorities();

        // 4. Verificar que tenga el rol requerido (respetando todos los alias)
        boolean tieneRol = tieneRolOAlias(rolRequerido, authorities);

        if (!tieneRol) {
            String mensaje = anotacion.mensaje().isBlank()
                ? construirMensajeDenegado(rolRequerido, auth.getName())
                : anotacion.mensaje();

            log.warn("[RolValidacion] Acceso denegado — usuario: {}, requiere: {}, tiene: {}",
                auth.getName(), rolRequerido, extraerNombresRoles(authorities));

            throw new AccessDeniedException(mensaje);
        }

        log.debug("[RolValidacion] Acceso permitido — usuario: {}, rol: {}",
            auth.getName(), rolRequerido);

        return joinPoint.proceed();
    }

    /**
     * Verifica si las authorities del usuario incluyen el rol requerido
     * o cualquiera de sus alias equivalentes.
     */
    private boolean tieneRolOAlias(String rolRequerido, Collection<? extends GrantedAuthority> authorities) {
        Set<String> alias = ROL_ALIAS.getOrDefault(rolRequerido, Set.of(rolRequerido));

        return authorities.stream()
            .map(GrantedAuthority::getAuthority)
            .map(String::toUpperCase)
            .anyMatch(authority -> {
                // Comparar sin prefijo ROLE_ para mayor flexibilidad
                String sinPrefijo = authority.startsWith("ROLE_")
                    ? authority.substring(5)
                    : authority;
                return alias.contains(authority) || alias.contains(sinPrefijo);
            });
    }

    private Set<String> extraerNombresRoles(Collection<? extends GrantedAuthority> authorities) {
        java.util.Set<String> roles = new java.util.LinkedHashSet<>();
        authorities.forEach(a -> roles.add(a.getAuthority()));
        return roles;
    }

    private String construirMensajeDenegado(String rolRequerido, String email) {
        return switch (rolRequerido) {
            case "PROVEEDOR" -> "Solo los proveedores de servicio pueden realizar esta acción";
            case "CLIENTE"   -> "Solo los clientes pueden realizar esta acción";
            case "ADMIN"     -> "Se requieren permisos de administrador";
            default          -> "No tienes el permiso '" + rolRequerido + "' para esta acción";
        };
    }
}
