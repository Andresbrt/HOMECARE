package com.homecare.domain.common.service;

import com.homecare.dto.WebhookDTO;
import com.homecare.common.exception.NotFoundException;
import com.homecare.model.WebhookSubscription;
import com.homecare.domain.common.repository.WebhookSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookService {

    private final WebhookSubscriptionRepository subscriptionRepository;
    private final RestTemplate restTemplate;

    @Transactional
    public WebhookDTO.Response registrarWebhook(WebhookDTO.Crear request) {
        WebhookSubscription subscription = new WebhookSubscription();
        subscription.setUrl(request.getUrl());
        subscription.setEventos(request.getEventos());
        subscription.setSecretKey(generateSecretKey());
        subscription.setActivo(true);

        subscription = subscriptionRepository.save(subscription);
        log.info("Webhook registrado: {} para eventos {}", subscription.getUrl(), subscription.getEventos());

        return new WebhookDTO.Response(
                subscription.getId(),
                subscription.getUrl(),
                subscription.getEventos(),
                subscription.getSecretKey(),
                subscription.getActivo()
        );
    }

    @Async
    public void enviarEvento(String eventoTipo, Object payload) {
        List<WebhookSubscription> subscriptions = subscriptionRepository.findByActivoTrue();

        for (WebhookSubscription sub : subscriptions) {
            if (sub.getEventos().contains(eventoTipo)) {
                try {
                    String signature = generateSignature(payload.toString(), sub.getSecretKey());

                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_JSON);
                    headers.set("X-Webhook-Signature", signature);
                    headers.set("X-Event-Type", eventoTipo);

                    HttpEntity<Object> request = new HttpEntity<>(payload, headers);

                    restTemplate.postForEntity(sub.getUrl(), request, String.class);
                    log.info("Evento {} enviado a webhook {}", eventoTipo, sub.getUrl());

                } catch (Exception e) {
                    log.error("Error enviando webhook a {}: {}", sub.getUrl(), e.getMessage());
                }
            }
        }
    }

    public boolean verificarSignature(String payload, String receivedSignature, String secretKey) {
        try {
            String calculatedSignature = generateSignature(payload, secretKey);
            return calculatedSignature.equals(receivedSignature);
        } catch (Exception e) {
            log.error("Error verificando signature: {}", e.getMessage());
            return false;
        }
    }

    @Transactional
    public void desactivarWebhook(Long webhookId) {
        WebhookSubscription subscription = subscriptionRepository.findById(webhookId)
                .orElseThrow(() -> new NotFoundException("Webhook no encontrado"));

        subscription.setActivo(false);
        subscriptionRepository.save(subscription);
        log.info("Webhook {} desactivado", webhookId);
    }

    private String generateSecretKey() {
        return Base64.getEncoder().encodeToString(
                String.valueOf(System.currentTimeMillis()).getBytes()
        );
    }

    private String generateSignature(String payload, String secretKey) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(
                secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"
        );
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hash);
    }
}

