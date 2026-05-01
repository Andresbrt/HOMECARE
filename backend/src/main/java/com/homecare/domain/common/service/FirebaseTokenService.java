package com.homecare.domain.common.service;

import com.homecare.common.exception.AuthException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * @deprecated Firebase Auth eliminado. Usar JwtTokenProvider con tokens de Supabase Auth.
 * Clase mantenida como stub vacio para evitar errores de compilacion durante la transicion.
 */
@Deprecated
@Service
@Slf4j
public class FirebaseTokenService {

    /**
     * @deprecated Firebase eliminado. Lanza AuthException siempre.
     */
    @Deprecated
    public Object verifyIdToken(String idToken) {
        log.warn("FirebaseTokenService.verifyIdToken() llamado -- Firebase eliminado. Migrar a Supabase Auth.");
        throw new AuthException("Firebase Auth eliminado. Usar autenticacion con Supabase.");
    }
}
