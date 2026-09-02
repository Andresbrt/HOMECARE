package com.homecare.domain.user.validator;

import com.homecare.common.exception.AuthException;
import org.springframework.stereotype.Component;

@Component
public class PasswordValidator {

    public void validate(String password) {
        if (password == null || password.length() < 8) {
            throw new AuthException("La contraseña debe tener al menos 8 caracteres");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new AuthException("La contraseña debe contener al menos una letra mayúscula");
        }
        if (!password.matches(".*[a-z].*")) {
            throw new AuthException("La contraseña debe contener al menos una letra minúscula");
        }
        if (!password.matches(".*[0-9].*")) {
            throw new AuthException("La contraseña debe contener al menos un número");
        }
        if (!password.matches(".*[!@#$%^&*(),.?\":{}|<>].*")) {
            throw new AuthException("La contraseña debe contener al menos un carácter especial");
        }
    }
}
