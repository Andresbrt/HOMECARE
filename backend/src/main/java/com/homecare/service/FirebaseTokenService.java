package com.homecare.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.homecare.exception.AuthException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Servicio para verificar Firebase ID Tokens
 * Usa el FirebaseApp inicializado por NotificationService
 */
@Service
@Slf4j
public class FirebaseTokenService {

    /**
     * Verifica un Firebase ID Token y retorna los claims del token.
     *
     * @param idToken Token JWT emitido por Firebase Authentication en el cliente
     * @return FirebaseToken con uid, email y claims del usuario
     * @throws AuthException si el token es inválido, expirado o Firebase no está disponible
     */
    public FirebaseToken verifyIdToken(String idToken) {
        if (FirebaseApp.getApps().isEmpty()) {
            throw new AuthException("Firebase no está inicializado. Configura FIREBASE_CREDENTIALS_JSON.");
        }
        try {
            FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(idToken);
            log.debug("Firebase ID Token verificado para uid: {}", decoded.getUid());
            return decoded;
        } catch (FirebaseAuthException e) {
            log.warn("Firebase ID Token inválido: {}", e.getMessage());
            throw new AuthException("Token de Firebase inválido o expirado");
        }
    }
}
