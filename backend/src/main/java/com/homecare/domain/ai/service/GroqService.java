package com.homecare.domain.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GroqService {

    @Value("${groq.api.key:}")
    private String groqApiKey;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama3-8b-8192";

    private final WebClient webClient;

    public GroqService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    private static final String ASSISTANT_SYSTEM_PROMPT =
        "Eres el asistente virtual de HomeCare, una plataforma de servicios de limpieza del hogar en Colombia. " +
        "Tu nombre es 'HomeCare AI'. Ayudas a los clientes a: " +
        "entender cómo funciona la plataforma (cliente publica solicitud → profesionales envían ofertas → cliente acepta la mejor), " +
        "resolver dudas sobre sus solicitudes activas, " +
        "explicar los tipos de servicio disponibles: Limpieza General, Limpieza Profunda, Por Horas, Oficinas, Post-Construcción, Mudanza, Desinfección. " +
        "Precios típicos en Colombia: limpieza básica $50.000-$120.000 COP, profunda $120.000-$250.000 COP. " +
        "Responde siempre en español, de forma amable, concisa y profesional. No inventes datos específicos del usuario.";

    private static final String PRICE_SYSTEM_PROMPT =
        "Eres un experto en precios de servicios de limpieza en Colombia. " +
        "Basándote en el tipo de servicio, número de habitaciones, metros cuadrados y ciudad, sugiere un rango de precio en pesos colombianos (COP). " +
        "Responde SOLO con un JSON con este formato exacto: " +
        "{\"precioMinimo\": 80000, \"precioMaximo\": 150000, \"justificacion\": \"Breve explicación de 1-2 oraciones\"} " +
        "No incluyas texto adicional fuera del JSON.";

    private static final String SUPPORT_SYSTEM_PROMPT =
        "Eres el agente de soporte de HomeCare. Respondes preguntas frecuentes sobre: " +
        "cómo registrarse y verificar cuenta con código OTP por email, " +
        "cómo crear una solicitud de servicio, " +
        "cómo funciona el sistema de ofertas competitivas, " +
        "cómo pagar con MercadoPago (seguro y protegido), " +
        "cómo calificar un servicio completado, " +
        "política de cancelaciones: gratis hasta 2 horas antes del servicio, " +
        "para profesionales: cómo recibir solicitudes, enviar ofertas y cobrar. " +
        "Responde en español de forma clara y empática. Si no sabes algo, indica que el usuario contacte soporte@homecare.works";

    public String chat(String userMessage) {
        return callGroq(ASSISTANT_SYSTEM_PROMPT, userMessage);
    }

    public String suggestPrice(String context) {
        return callGroq(PRICE_SYSTEM_PROMPT, context);
    }

    public String support(String userMessage) {
        return callGroq(SUPPORT_SYSTEM_PROMPT, userMessage);
    }

    @SuppressWarnings("unchecked")
    private String callGroq(String systemPrompt, String userMessage) {
        if (groqApiKey == null || groqApiKey.isBlank() || groqApiKey.startsWith("PASTE")) {
            log.warn("GROQ_API_KEY not configured — returning fallback response");
            return "El asistente de IA no está configurado todavía. Configura GROQ_API_KEY en el servidor.";
        }
        try {
            var requestBody = Map.of(
                "model", MODEL,
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userMessage)
                ),
                "max_tokens", 512,
                "temperature", 0.7
            );

            var response = webClient.post()
                .uri(GROQ_URL)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + groqApiKey)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            if (response != null) {
                var choices = (List<?>) response.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    var choice = (Map<?, ?>) choices.get(0);
                    var message = (Map<?, ?>) choice.get("message");
                    if (message != null) {
                        return (String) message.get("content");
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error calling Groq API: {}", e.getMessage());
        }
        return "Lo siento, no pude procesar tu solicitud en este momento. Intenta de nuevo.";
    }
}
