package com.homecare.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTOs para Autenticación y Usuario
 */
public class AuthDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Login {
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "Email inválido")
        private String email;

        @NotBlank(message = "La contraseña es obligatoria")
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Registro {
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "Email inválido")
        private String email;

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
        private String password;

        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
        private String nombre;

        @NotBlank(message = "El apellido es obligatorio")
        @Size(min = 2, max = 100, message = "El apellido debe tener entre 2 y 100 caracteres")
        private String apellido;

        @Pattern(regexp = "^[0-9]{10}$", message = "El teléfono debe tener 10 dígitos")
        private String telefono;

        @NotBlank(message = "El rol es obligatorio")
        private String rol; // CUSTOMER, SERVICE_PROVIDER

        // Alias para compatibilidad
        public String getTipoUsuario() {
            return rol;
        }

        public void setTipoUsuario(String tipoUsuario) {
            this.rol = tipoUsuario;
        }

        // Campos adicionales para proveedores
        private String documentoIdentidad;
        private String descripcion;
        private Integer experienciaAnos;

        // Ubicación inicial (opcional)
        private BigDecimal latitud;
        private BigDecimal longitud;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginResponse {
        private String token;
        private String refreshToken;
        private String tipo;
        private Long id;
        private String email;
        private String nombre;
        private String apellido;
        private String fotoPerfil;
        private String rol;
        private Long expiresIn; // Segundos hasta expiración
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefreshToken {
        @NotBlank(message = "El refresh token es obligatorio")
        private String refreshToken;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UsuarioInfo {
        private Long id;
        private String email;
        private String nombre;
        private String apellido;
        private String telefono;
        private String fotoPerfil;
        private String rol;
        private Boolean activo;
        private Boolean verificado;
        private Boolean disponible;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UsuarioRespuesta {
        private Long id;
        private String email;
        private String nombre;
        private String apellido;
        private String nombreCompleto;
        private String telefono;
        private String fotoPerfil;
        private String documentoIdentidad;
        private String descripcion;
        private Integer experienciaAnos;
        private Integer serviciosCompletados;
        private BigDecimal calificacionPromedio;
        private BigDecimal latitud;
        private BigDecimal longitud;
        private String direccion;
        private Boolean activo;
        private Boolean verificado;
        private Boolean disponible;
        private String rol;
        private String createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActualizarPerfil {
        private String nombre;
        private String apellido;
        private String telefono;
        private String fotoPerfil;
        private String descripcion;
        private Integer experienciaAnos;
        private BigDecimal latitud;
        private BigDecimal longitud;
        private String direccion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CambiarPassword {
        @NotBlank(message = "La contraseña actual es obligatoria")
        private String passwordActual;

        @NotBlank(message = "La nueva contraseña es obligatoria")
        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
        private String passwordNueva;

        // Alias para compatibilidad
        public String getNuevaPassword() {
            return passwordNueva;
        }

        public void setNuevaPassword(String nueva) {
            this.passwordNueva = nueva;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecuperarPassword {
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "Email inválido")
        private String email;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResetPassword {
        @NotBlank(message = "El token es obligatorio")
        private String token;

        @NotBlank(message = "La nueva contraseña es obligatoria")
        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
        private String nuevaPassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActualizarDisponibilidad {
        @NotNull(message = "El estado de disponibilidad es obligatorio")
        private Boolean disponible;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActualizarUbicacion {
        @NotNull(message = "La latitud es obligatoria")
        private BigDecimal latitud;

        @NotNull(message = "La longitud es obligatoria")
        private BigDecimal longitud;

        private String direccion;
    }

    /**
     * Login/registro usando Firebase ID Token
     * El token se obtiene en el cliente después de autenticarse con Firebase Auth
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FirebaseLogin {
        @NotBlank(message = "El firebaseToken es obligatorio")
        private String firebaseToken;

        // Campos requeridos sólo al crear el usuario (primer login)
        private String nombre;
        private String apellido;
        private String telefono;

        /** CUSTOMER o SERVICE_PROVIDER */
        private String rol;
    }
}
