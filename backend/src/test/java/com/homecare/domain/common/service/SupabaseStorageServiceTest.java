package com.homecare.domain.common.service;

import com.homecare.common.exception.FileStorageException;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests de integración para {@link SupabaseStorageService}.
 *
 * Usa {@link MockWebServer} (OkHttp3) para simular la API REST de Supabase Storage.
 * El WebClient real hace la conexión HTTP al servidor mock, lo que verifica tanto
 * la serialización/deserialización como los headers y el path construido.
 */
@DisplayName("SupabaseStorageService")
class SupabaseStorageServiceTest {

    private MockWebServer      mockWebServer;
    private SupabaseStorageService storageService;

    /** Bytes de imagen JPEG mínimos (magic bytes JPEG: FF D8). */
    private static final byte[] FAKE_JPEG = new byte[]{(byte) 0xFF, (byte) 0xD8, 0x01, 0x02};

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        // Construir la base URL sin trailing slash
        String baseUrl = "http://localhost:" + mockWebServer.getPort();

        WebClient webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("apikey", "test-service-key")
                .defaultHeader("Authorization", "Bearer test-service-key")
                .build();

        storageService = new SupabaseStorageService(webClient, baseUrl);
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    // ─── subirFotoPerfil ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("subirFotoPerfil()")
    class SubirFotoPerfil {

        @Test
        @DisplayName("éxito → retorna URL pública con uid en el path")
        void success_returnsPublicUrl() throws InterruptedException {
            mockWebServer.enqueue(successJson("{\"Key\":\"user-123/avatar_test.jpg\"}"));

            String url = storageService.subirFotoPerfil("user-123", FAKE_JPEG, "image/jpeg");

            // URL debe contener la estructura pública del bucket y el uid
            assertThat(url).contains("/storage/v1/object/public/perfiles-usuarios/user-123/");
            assertThat(url).endsWith(".jpg");
            assertThat(url).startsWith("http");

            RecordedRequest req = mockWebServer.takeRequest();
            assertThat(req.getMethod()).isEqualTo("POST");
            assertThat(req.getPath()).startsWith("/storage/v1/object/perfiles-usuarios/user-123%2F");
            assertThat(req.getHeader("x-upsert")).isEqualTo("true"); // avatares se reemplazan
        }

        @Test
        @DisplayName("con image/png → URL termina en .png")
        void pngMime_urlEndsWithPng() throws InterruptedException {
            mockWebServer.enqueue(successJson("{\"Key\":\"uid/avatar.png\"}"));

            String url = storageService.subirFotoPerfil("uid-png", FAKE_JPEG, "image/png");

            assertThat(url).endsWith(".png");
            mockWebServer.takeRequest(); // consume la request
        }

        @Test
        @DisplayName("con image/webp → URL termina en .webp")
        void webpMime_urlEndsWithWebp() throws InterruptedException {
            mockWebServer.enqueue(successJson("{\"Key\":\"uid/avatar.webp\"}"));

            String url = storageService.subirFotoPerfil("uid-webp", FAKE_JPEG, "image/webp");

            assertThat(url).endsWith(".webp");
            mockWebServer.takeRequest();
        }

        @Test
        @DisplayName("Supabase devuelve 403 (RLS) → lanza FileStorageException con status 403")
        void supabase403_throwsFileStorageException() {
            mockWebServer.enqueue(errorResponse(403, "{\"error\":\"Unauthorized\"}"));

            assertThatThrownBy(() ->
                    storageService.subirFotoPerfil("uid-403", FAKE_JPEG, "image/jpeg"))
                    .isInstanceOf(FileStorageException.class)
                    .hasMessageContaining("403");
        }

        @Test
        @DisplayName("Supabase devuelve 413 (archivo grande) → lanza FileStorageException")
        void supabase413_throwsFileStorageException() {
            mockWebServer.enqueue(errorResponse(413, "{\"error\":\"Payload Too Large\"}"));

            assertThatThrownBy(() ->
                    storageService.subirFotoPerfil("uid-413", FAKE_JPEG, "image/jpeg"))
                    .isInstanceOf(FileStorageException.class);
        }
    }

    // ─── subirFotoEvidencia ───────────────────────────────────────────────────

    @Nested
    @DisplayName("subirFotoEvidencia()")
    class SubirFotoEvidencia {

        @Test
        @DisplayName("tipo 'antes' → retorna path relativo con servicioId/uid/antes_*")
        void tipoAntes_returnsRelativePath() throws InterruptedException {
            mockWebServer.enqueue(successJson("{\"Key\":\"99/proveedor-uid/antes_abc.jpg\"}"));

            String path = storageService.subirFotoEvidencia(
                    99L, "proveedor-uid", "antes", FAKE_JPEG, "image/jpeg");

            // Path relativo (sin http) — el cliente pide URL firmada después
            assertThat(path).doesNotStartWith("http");
            assertThat(path).startsWith("99/proveedor-uid/antes_");
            assertThat(path).endsWith(".jpg");

            RecordedRequest req = mockWebServer.takeRequest();
            assertThat(req.getPath()).startsWith("/storage/v1/object/evidencias-servicios/99%2Fproveedor-uid%2Fantes_");
            assertThat(req.getHeader("x-upsert")).isEqualTo("false"); // evidencias no se reemplazan
        }

        @Test
        @DisplayName("tipo 'despues' → path contiene 'despues_'")
        void tipoDespues_pathContainsDespues() throws InterruptedException {
            mockWebServer.enqueue(successJson("{\"Key\":\"5/uid/despues_xyz.jpg\"}"));

            String path = storageService.subirFotoEvidencia(
                    5L, "uid", "despues", FAKE_JPEG, "image/jpeg");

            assertThat(path).startsWith("5/uid/despues_");
            mockWebServer.takeRequest();
        }

        @Test
        @DisplayName("tipo inválido → lanza FileStorageException inmediatamente (sin HTTP call)")
        void invalidType_throwsBeforeHttpCall() {
            assertThatThrownBy(() ->
                    storageService.subirFotoEvidencia(1L, "uid", "durante", FAKE_JPEG, "image/jpeg"))
                    .isInstanceOf(FileStorageException.class)
                    .hasMessageContaining("Tipo de foto inv");

            // No se encolaron requests
            assertThat(mockWebServer.getRequestCount()).isZero();
        }
    }

    // ─── generarUrlFirmada ────────────────────────────────────────────────────

    @Nested
    @DisplayName("generarUrlFirmada()")
    class GenerarUrlFirmada {

        @Test
        @DisplayName("Supabase retorna signedURL relativo → se construye URL absoluta")
        void relativeSignedUrl_becomesAbsolute() throws InterruptedException {
            String relPath = "/storage/v1/object/sign/evidencias-servicios/123/uid/antes.jpg?token=abc";
            mockWebServer.enqueue(successJson("{\"signedURL\":\"" + relPath + "\"}"));

            String url = storageService.generarUrlFirmada("123/uid/antes.jpg", 3600);

            assertThat(url).startsWith("http");
            assertThat(url).contains("sign");

            RecordedRequest req = mockWebServer.takeRequest();
            assertThat(req.getMethod()).isEqualTo("POST");
            assertThat(req.getPath())
                    .startsWith("/storage/v1/object/sign/evidencias-servicios/");
        }

        @Test
        @DisplayName("Supabase retorna signedURL absoluto → se usa tal cual")
        void absoluteSignedUrl_usedAsIs() throws InterruptedException {
            String absUrl = "https://test.supabase.co/storage/v1/object/sign/evidencias-servicios/p?token=xyz";
            mockWebServer.enqueue(successJson("{\"signedURL\":\"" + absUrl + "\"}"));

            String url = storageService.generarUrlFirmada("path/file.jpg", 7200);

            assertThat(url).isEqualTo(absUrl); // ya es absoluta, no debe modificarse
            mockWebServer.takeRequest();
        }

        @Test
        @DisplayName("método sin TTL usa TTL de 1 año por defecto")
        void defaultTtl_usesOneYear() throws InterruptedException {
            mockWebServer.enqueue(successJson("{\"signedURL\":\"/storage/v1/object/sign/...?token=t\"}"));

            // No lanza excepción — TTL por defecto = 365 días en segundos
            assertThatCode(() -> storageService.generarUrlFirmada("some/path.jpg"))
                    .doesNotThrowAnyException();

            RecordedRequest req = mockWebServer.takeRequest();
            // Body debe contener expiresIn = 31536000 (365 * 24 * 3600)
            assertThat(req.getBody().readUtf8()).contains("31536000");
        }

        @Test
        @DisplayName("Supabase devuelve error → lanza FileStorageException")
        void supabaseError_throwsFileStorageException() {
            mockWebServer.enqueue(errorResponse(500, "{\"error\":\"Storage error\"}"));

            assertThatThrownBy(() -> storageService.generarUrlFirmada("path.jpg", 3600))
                    .isInstanceOf(FileStorageException.class);
        }
    }

    // ─── eliminarArchivo ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("eliminarArchivo()")
    class EliminarArchivo {

        @Test
        @DisplayName("Supabase devuelve 200 → no lanza excepción")
        void success_noException() {
            mockWebServer.enqueue(successJson("{\"message\":\"Successfully deleted\"}"));

            assertThatCode(() ->
                    storageService.eliminarArchivo("perfiles-usuarios", "uid/avatar.jpg"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Supabase devuelve 404 (archivo no existe) → no lanza excepción")
        void notFound_noException() {
            mockWebServer.enqueue(errorResponse(404, "{\"error\":\"Not found\"}"));

            // onErrorResume absorbe el error — no debe propagar al caller
            assertThatCode(() ->
                    storageService.eliminarArchivo("perfiles-usuarios", "uid/ghost.jpg"))
                    .doesNotThrowAnyException();
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static MockResponse successJson(String body) {
        return new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(body);
    }

    private static MockResponse errorResponse(int code, String body) {
        return new MockResponse()
                .setResponseCode(code)
                .setHeader("Content-Type", "application/json")
                .setBody(body);
    }
}
