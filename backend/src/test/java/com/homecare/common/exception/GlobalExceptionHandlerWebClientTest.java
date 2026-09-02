package com.homecare.common.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.net.ConnectException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests unitarios para los handlers de {@link GlobalExceptionHandler} relacionados con WebClient.
 *
 * Se instancia el handler directamente sin contexto Spring — prueba las reglas de negocio
 * (qué HTTP status retornar para cada tipo de error Supabase).
 */
@DisplayName("GlobalExceptionHandler — WebClient handlers")
class GlobalExceptionHandlerWebClientTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    // ─── WebClientResponseException ──────────────────────────────────────────

    @Nested
    @DisplayName("handleWebClientResponse() — errores HTTP de Supabase API")
    class HandleWebClientResponse {

        @Test
        @DisplayName("status 403 (RLS violation) → responde 403 FORBIDDEN")
        void status403_returnsForbidden() {
            WebClientResponseException ex = makeResponseException(403, "{\"error\":\"RLS violation\"}");

            ResponseEntity<Map<String, Object>> response = handler.handleWebClientResponse(ex);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(response.getBody()).containsEntry("status", 403);
            assertThat(response.getBody().get("message").toString()).contains("Supabase");
        }

        @Test
        @DisplayName("status 500 (error interno Supabase) → responde 502 BAD_GATEWAY")
        void status500_returnsBadGateway() {
            WebClientResponseException ex = makeResponseException(500, "{\"error\":\"Storage down\"}");

            ResponseEntity<Map<String, Object>> response = handler.handleWebClientResponse(ex);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
            assertThat(response.getBody()).containsEntry("status", 502);
        }

        @Test
        @DisplayName("status 413 (archivo demasiado grande) → responde 502 BAD_GATEWAY")
        void status413_returnsBadGateway() {
            WebClientResponseException ex = makeResponseException(413, "{\"error\":\"File too large\"}");

            ResponseEntity<Map<String, Object>> response = handler.handleWebClientResponse(ex);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        }

        @Test
        @DisplayName("status 404 (objeto no encontrado en Storage) → responde 502 BAD_GATEWAY")
        void status404_returnsBadGateway() {
            WebClientResponseException ex = makeResponseException(404, "{\"error\":\"Object not found\"}");

            ResponseEntity<Map<String, Object>> response = handler.handleWebClientResponse(ex);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        }

        @Test
        @DisplayName("respuesta contiene timestamp, status, error y message")
        void response_hasRequiredFields() {
            WebClientResponseException ex = makeResponseException(500, "{}");

            ResponseEntity<Map<String, Object>> response = handler.handleWebClientResponse(ex);

            assertThat(response.getBody()).containsKeys("timestamp", "status", "error", "message");
        }
    }

    // ─── WebClientRequestException ────────────────────────────────────────────

    @Nested
    @DisplayName("handleWebClientRequest() — fallos de conexión con Supabase")
    class HandleWebClientRequest {

        @Test
        @DisplayName("Connection refused → responde 503 SERVICE_UNAVAILABLE")
        void connectionRefused_returnsServiceUnavailable() {
            WebClientRequestException ex = makeRequestException("Connection refused");

            ResponseEntity<Map<String, Object>> response = handler.handleWebClientRequest(ex);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
            assertThat(response.getBody()).containsEntry("status", 503);
        }

        @Test
        @DisplayName("mensaje de error menciona el servicio de almacenamiento")
        void message_mentionsStorage() {
            WebClientRequestException ex = makeRequestException("Timeout connecting to Supabase");

            ResponseEntity<Map<String, Object>> response = handler.handleWebClientRequest(ex);

            assertThat(response.getBody().get("message").toString())
                    .contains("almacenamiento");
        }

        @Test
        @DisplayName("respuesta contiene los campos requeridos")
        void response_hasRequiredFields() {
            WebClientRequestException ex = makeRequestException("Network unreachable");

            ResponseEntity<Map<String, Object>> response = handler.handleWebClientRequest(ex);

            assertThat(response.getBody()).containsKeys("timestamp", "status", "error", "message");
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private WebClientResponseException makeResponseException(int statusCode, String body) {
        return WebClientResponseException.create(
                statusCode,
                "Status " + statusCode,
                HttpHeaders.EMPTY,
                body.getBytes(StandardCharsets.UTF_8),
                StandardCharsets.UTF_8);
    }

    private WebClientRequestException makeRequestException(String message) {
        return new WebClientRequestException(
                new ConnectException(message),
                HttpMethod.POST,
                URI.create("https://test.supabase.co/storage/v1/object"),
                HttpHeaders.EMPTY);
    }
}
