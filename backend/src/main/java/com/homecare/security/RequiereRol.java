package com.homecare.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Anotación declarativa para exigir un rol de negocio específico.
 *
 * Uso en métodos de servicio o controlador:
 *
 *   @RequiereRol("PROVEEDOR")
 *   public void crearOferta(...) { ... }
 *
 *   @RequiereRol(value = "CLIENTE", mensaje = "Solo clientes pueden crear solicitudes")
 *   public void crearSolicitud(...) { ... }
 *
 * El aspecto RolValidacionAspect intercepta la llamada y lanza
 * AccessDeniedException si el usuario autenticado no tiene el rol indicado.
 *
 * Roles válidos en el sistema:
 *   CLIENTE / CUSTOMER / ROLE_CUSTOMER
 *   PROVEEDOR / SERVICE_PROVIDER / ROLE_SERVICE_PROVIDER
 *   ADMIN / ROLE_ADMIN
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiereRol {

    /**
     * Nombre lógico del rol requerido (sin prefijo ROLE_).
     * Ej: "PROVEEDOR", "CLIENTE", "ADMIN"
     */
    String value();

    /**
     * Mensaje personalizado cuando el acceso es denegado.
     * Si está vacío, se usa el mensaje por defecto.
     */
    String mensaje() default "";
}
