package com.homecare.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Configura el {@link WebClient} preconfigurado para la API REST de Supabase.
 *
 * <p>El bean {@code supabaseWebClient} usa la {@code service-role-key} en sus cabeceras,
 * lo que le da acceso completo a la DB y Storage (bypass de RLS). Solo debe usarse en
 * operaciones del backend — nunca exponer esta clave al cliente.</p>
 *
 * <p>Para operaciones que deben respetar RLS (en nombre del usuario), construir un
 * WebClient separado con la anon key y el JWT del usuario.</p>
 */
@Configuration
@Slf4j
public class SupabaseClientConfig {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key:}")
    private String serviceRoleKey;

    @Value("${supabase.anon-key:}")
    private String anonKey;

    @Value("${supabase.storage.upload-timeout-seconds:30}")
    private int uploadTimeoutSeconds;

    /**
     * WebClient con service-role-key para operaciones privilegiadas del backend
     * (procesar pagos, subir archivos en nombre de usuarios, operaciones admin).
     *
     * <p>Cabeceras incluidas:
     * <ul>
     *   <li>{@code apikey} — requerido por Supabase para todas las requests</li>
     *   <li>{@code Authorization: Bearer <service_role_key>} — bypass de RLS</li>
     * </ul>
     * </p>
     */
    @Bean(name = "supabaseWebClient")
    public WebClient supabaseWebClient() {
        if (serviceRoleKey == null || serviceRoleKey.isBlank()) {
            log.warn("supabase.service-role-key no configurado. " +
                     "SupabaseStorageService no funcionará hasta que se defina SUPABASE_SERVICE_ROLE_KEY.");
        }

        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10_000)
                .responseTimeout(Duration.ofSeconds(uploadTimeoutSeconds))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(uploadTimeoutSeconds, TimeUnit.SECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(uploadTimeoutSeconds, TimeUnit.SECONDS)));

        return WebClient.builder()
                .baseUrl(supabaseUrl)
                .defaultHeader("apikey", serviceRoleKey != null ? serviceRoleKey : "")
                .defaultHeader(HttpHeaders.AUTHORIZATION,
                               "Bearer " + (serviceRoleKey != null ? serviceRoleKey : ""))
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .filter(logRequest())
                .build();
    }

    /**
     * WebClient con anon-key para llamadas que usan el JWT del usuario y respetan RLS.
     * Útil si el backend necesita hacer operaciones en nombre del usuario (ej: leer sus datos).
     */
    @Bean(name = "supabaseAnonWebClient")
    public WebClient supabaseAnonWebClient() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10_000)
                .responseTimeout(Duration.ofSeconds(15));

        return WebClient.builder()
                .baseUrl(supabaseUrl)
                .defaultHeader("apikey", anonKey != null ? anonKey : "")
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }

    /** Filtro de logging para debug (solo registra URL y método, no el body). */
    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            log.debug("Supabase API → {} {}", clientRequest.method(), clientRequest.url());
            return Mono.just(clientRequest);
        });
    }
}
