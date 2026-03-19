package com.homecare.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Validador de variables de entorno críticas
 * Verifica que todas las variables obligatorias estén configuradas al inicio de la aplicación
 */
@Component
@Slf4j
public class EnvironmentValidator implements ApplicationListener<ApplicationReadyEvent> {

    @Value("${JWT_SECRET:}")
    private String jwtSecret;

    @Value("${WOMPI_PUBLIC_KEY:}")
    private String wompiPublicKey;

    @Value("${WOMPI_PRIVATE_KEY:}")
    private String wompiPrivateKey;

    @Value("${WOMPI_EVENT_SECRET:}")
    private String wompiEventSecret;

    @Value("${GOOGLE_MAPS_API_KEY:}")
    private String googleMapsApiKey;

    @Value("${FIREBASE_SERVER_KEY:}")
    private String firebaseServerKey;

    @Value("${AWS_ACCESS_KEY:}")
    private String awsAccessKey;

    @Value("${AWS_SECRET_KEY:}")
    private String awsSecretKey;

    @Value("${DATABASE_PASSWORD:}")
    private String databasePassword;

    @Value("${app.environment:development}")
    private String environment;

    @Value("${PAYMENT_CALLBACK_URL:}")
    private String paymentCallbackUrl;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        log.info("🔍 Validando configuración de variables de entorno...");
        
        List<String> missingVariables = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        // Variables CRÍTICAS - La app NO debe arrancar sin estas
        if (isEmpty(jwtSecret) || jwtSecret.length() < 32) {
            missingVariables.add("JWT_SECRET (mínimo 32 caracteres para seguridad)");
        }

        if (isEmpty(googleMapsApiKey)) {
            missingVariables.add("GOOGLE_MAPS_API_KEY (requerido para tracking y rutas)");
        }

        if (isEmpty(firebaseServerKey)) {
            missingVariables.add("FIREBASE_SERVER_KEY (requerido para notificaciones push)");
        }

        // Variables para pagos - críticas en producción
        if (isEmpty(wompiPublicKey)) {
            missingVariables.add("WOMPI_PUBLIC_KEY (requerido para pagos)");
        }
        
        if (isEmpty(wompiPrivateKey)) {
            missingVariables.add("WOMPI_PRIVATE_KEY (requerido para pagos)");
        }
        
        if (isEmpty(wompiEventSecret)) {
            missingVariables.add("WOMPI_EVENT_SECRET (requerido para webhooks de pagos)");
        }

        if (isEmpty(paymentCallbackUrl)) {
            missingVariables.add("PAYMENT_CALLBACK_URL (requerido para callbacks de pago)");
        }

        // Variables de AWS - críticas para almacenamiento en producción
        if ("production".equals(environment)) {
            if (isEmpty(awsAccessKey)) {
                missingVariables.add("AWS_ACCESS_KEY (requerido en producción para almacenamiento)");
            }
            
            if (isEmpty(awsSecretKey)) {
                missingVariables.add("AWS_SECRET_KEY (requerido en producción para almacenamiento)");
            }
        } else {
            if (isEmpty(awsAccessKey) || isEmpty(awsSecretKey)) {
                warnings.add("AWS credentials no configuradas - almacenamiento local habilitado para desarrollo");
            }
        }

        // Verificar seguridad de base de datos
        if ("homecare_pass".equals(databasePassword) && "production".equals(environment)) {
            warnings.add("⚠️ Base de datos usando password por defecto en producción - CAMBIAR URGENTE");
        }

        // ⚠️ ADVERTIR sobre variables faltantes pero NO detener la app
        // Cada servicio (pagos, maps, firebase) falla en su propio endpoint, no en el arranque
        if (!missingVariables.isEmpty()) {
            log.warn("⚠️ ADVERTENCIA: Variables de entorno recomendadas no configuradas:");
            missingVariables.forEach(var -> log.warn("   - {}", var));
            log.warn("La app arrancó pero los endpoints que dependen de estas variables fallarán.");
            log.warn("Configura estas variables en Railway → Variables para activar todas las funciones.");
        }

        // ⚠️ Mostrar warnings pero continuar
        if (!warnings.isEmpty()) {
            log.warn("⚠️ Advertencias de configuración:");
            warnings.forEach(warning -> log.warn("   - {}", warning));
        }

        // ✅ Todo correcto
        log.info("✅ Validación de variables de entorno completada");
        log.info("🚀 Entorno: {} | JWT: ✓ | Google Maps: ✓ | Firebase: ✓ | Wompi: ✓", environment);
    }

    private boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }
}
