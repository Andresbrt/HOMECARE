package com.homecare.domain.common.service;

import com.homecare.common.exception.FileStorageException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * Servicio para gestionar archivos en Supabase Storage.
 *
 * <p>Usa la API REST de Supabase Storage directamente via {@link WebClient}:
 * <ul>
 *   <li>Subida: {@code POST /storage/v1/object/{bucket}/{path}}</li>
 *   <li>URL pública: {@code {supabaseUrl}/storage/v1/object/public/{bucket}/{path}}</li>
 *   <li>URL firmada: {@code POST /storage/v1/object/sign/{bucket}/{path}}</li>
 * </ul>
 * </p>
 *
 * <p><b>Buckets disponibles:</b>
 * <ul>
 *   <li>{@code perfiles-usuarios} — público, máx 2 MB, JPEG/PNG/WebP</li>
 *   <li>{@code evidencias-servicios} — privado, máx 5 MB, URLs firmadas</li>
 * </ul>
 * </p>
 */
@Service
@Slf4j
public class SupabaseStorageService {

    private static final String BUCKET_PERFILES  = "perfiles-usuarios";
    private static final String BUCKET_EVIDENCIAS = "evidencias-servicios";

    // TTL para URLs firmadas de evidencias: 1 año en segundos
    private static final int SIGNED_URL_TTL_SECONDS = 365 * 24 * 3600;

    private final WebClient supabaseWebClient;
    private final String supabaseUrl;

    public SupabaseStorageService(
            @Qualifier("supabaseWebClient") WebClient supabaseWebClient,
            @Value("${supabase.url}") String supabaseUrl) {
        this.supabaseWebClient = supabaseWebClient;
        this.supabaseUrl = supabaseUrl;
    }

    // ─── Perfiles de Usuario ─────────────────────────────────────────────────

    /**
     * Sube o reemplaza la foto de perfil de un usuario.
     *
     * @param usuarioId UUID del usuario (Supabase UID, coincide con {@code auth.users.id})
     * @param imageBytes Contenido binario de la imagen (JPEG/PNG/WebP)
     * @param contentType MIME type, ej: {@code "image/jpeg"}
     * @return URL pública directa (sin expiración, el bucket es público)
     * @throws FileStorageException si Supabase devuelve un error
     */
    public String subirFotoPerfil(String usuarioId, byte[] imageBytes, String contentType) {
        String path = usuarioId + "/avatar_" + UUID.randomUUID() + extensionFromMime(contentType);

        uploadToStorage(BUCKET_PERFILES, path, imageBytes, contentType, true);

        String publicUrl = buildPublicUrl(BUCKET_PERFILES, path);
        log.info("Foto de perfil subida: bucket={} path={}", BUCKET_PERFILES, path);
        return publicUrl;
    }

    // ─── Evidencias de Servicio ──────────────────────────────────────────────

    /**
     * Sube una foto de evidencia (antes/después) al bucket privado.
     *
     * @param servicioId ID del servicio aceptado
     * @param usuarioId  UUID del usuario (proveedor)
     * @param tipo       {@code "antes"} o {@code "despues"}
     * @param imageBytes Contenido binario de la imagen
     * @param contentType MIME type, ej: {@code "image/jpeg"}
     * @return Path relativo del archivo en el bucket (ej: {@code "123/abc-def/antes_uuid.jpg"})
     * @throws FileStorageException si Supabase devuelve un error o el tipo es inválido
     */
    public String subirFotoEvidencia(Long servicioId, String usuarioId, String tipo,
                                     byte[] imageBytes, String contentType) {
        if (!tipo.equals("antes") && !tipo.equals("despues")) {
            throw new FileStorageException("Tipo de foto inválido: debe ser 'antes' o 'despues'");
        }

        String filename = tipo + "_" + UUID.randomUUID() + extensionFromMime(contentType);
        String path = servicioId + "/" + usuarioId + "/" + filename;

        uploadToStorage(BUCKET_EVIDENCIAS, path, imageBytes, contentType, false);

        log.info("Foto de evidencia subida: bucket={} path={}", BUCKET_EVIDENCIAS, path);
        return path; // retornar el path, no la URL — el cliente debe pedir URL firmada
    }

    /**
     * Genera una URL firmada (temporal) para acceder a una foto de evidencia privada.
     *
     * @param path Path relativo del archivo en el bucket {@code evidencias-servicios}
     * @param ttlSegundos Duración de la URL en segundos (máx recomendado: 1 año)
     * @return URL firmada con la que el cliente puede descargar el archivo
     * @throws FileStorageException si Supabase no puede generar la URL
     */
    public String generarUrlFirmada(String path, int ttlSegundos) {
        try {
            Map<?, ?> responseBody = supabaseWebClient.post()
                    .uri("/storage/v1/object/sign/{bucket}/{path}", BUCKET_EVIDENCIAS, path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("expiresIn", ttlSegundos))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            if (responseBody == null || !responseBody.containsKey("signedURL")) {
                throw new FileStorageException("Supabase no retornó signedURL para el path: " + path);
            }

            String signedUrl = (String) responseBody.get("signedURL");
            // El path retornado es relativo; construir URL absoluta
            if (!signedUrl.startsWith("http")) {
                signedUrl = supabaseUrl + signedUrl;
            }
            return signedUrl;

        } catch (WebClientResponseException ex) {
            log.error("Error Supabase generando URL firmada — status={} path={}", ex.getStatusCode(), path);
            throw new FileStorageException("Error al generar URL de descarga: " + ex.getResponseBodyAsString());
        }
    }

    /**
     * Genera una URL firmada con TTL de 1 año (por defecto para evidencias).
     */
    public String generarUrlFirmada(String path) {
        return generarUrlFirmada(path, SIGNED_URL_TTL_SECONDS);
    }

    /**
     * Elimina un archivo del bucket indicado.
     * No lanza excepción si el archivo no existe.
     *
     * @param bucket Nombre del bucket
     * @param path   Path relativo dentro del bucket
     */
    public void eliminarArchivo(String bucket, String path) {
        try {
            supabaseWebClient.delete()
                    .uri("/storage/v1/object/{bucket}/{path}", bucket, path)
                    .retrieve()
                    .bodyToMono(Void.class)
                    .timeout(Duration.ofSeconds(10))
                    .onErrorResume(ex -> {
                        log.warn("No se pudo eliminar archivo de Storage — bucket={} path={}: {}",
                                 bucket, path, ex.getMessage());
                        return Mono.empty();
                    })
                    .block();

            log.debug("Archivo eliminado de Storage: bucket={} path={}", bucket, path);

        } catch (Exception ex) {
            log.warn("Error no crítico eliminando archivo de Storage: {}", ex.getMessage());
        }
    }

    // ─── Helpers internos ────────────────────────────────────────────────────

    /**
     * Sube bytes al endpoint {@code /storage/v1/object/{bucket}/{path}}.
     *
     * @param upsert Si {@code true}, sobreescribe el archivo si ya existe (útil para avatares)
     */
    private void uploadToStorage(String bucket, String path, byte[] imageBytes,
                                 String contentType, boolean upsert) {
        try {
            supabaseWebClient.post()
                    .uri("/storage/v1/object/{bucket}/{path}", bucket, path)
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header("x-upsert", String.valueOf(upsert))
                    .body(BodyInserters.fromValue(imageBytes))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

        } catch (WebClientResponseException ex) {
            log.error("Error subiendo archivo a Supabase Storage — bucket={} status={} body={}",
                      bucket, ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new FileStorageException(
                    "Error al subir archivo: " + ex.getStatusCode() + " — " + ex.getResponseBodyAsString());
        } catch (Exception ex) {
            log.error("Error de conexión con Supabase Storage: {}", ex.getMessage());
            throw new FileStorageException("No se pudo conectar con el servicio de almacenamiento: " + ex.getMessage());
        }
    }

    /** Construye la URL pública para buckets con acceso público. */
    private String buildPublicUrl(String bucket, String path) {
        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + path;
    }

    /** Devuelve la extensión de archivo para un MIME type de imagen. */
    private String extensionFromMime(String contentType) {
        return switch (contentType.toLowerCase()) {
            case "image/png"  -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif"  -> ".gif";
            default           -> ".jpg";  // image/jpeg y cualquier otro
        };
    }
}
