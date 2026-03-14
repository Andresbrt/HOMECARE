package com.homecare.service;

import com.homecare.dto.PagoDTO;
import com.homecare.exception.NotFoundException;
import com.homecare.exception.PaymentException;
import com.homecare.model.Pago;
import com.homecare.model.Pago.EstadoPago;
import com.homecare.model.ServicioAceptado;
import com.homecare.repository.PagoRepository;
import com.homecare.repository.ServicioAceptadoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PagoRepository pagoRepository;
    private final ServicioAceptadoRepository servicioRepository;
    private final NotificationService notificationService;
    private final RestTemplate restTemplate;

    @Value("${wompi.api-url:https://production.wompi.co}")
    private String wompiApiUrl;

    @Value("${wompi.public-key}")
    private String wompiPublicKey;

    @Value("${wompi.private-key}")
    private String wompiPrivateKey;

    @Value("${wompi.event-secret}")
    private String wompiEventSecret;

    @Value("${payment.commission-rate:0.10}")
    private BigDecimal commissionRate; // 10% por defecto

    @Value("${payment.callback-url}")
    private String callbackUrl;

    @Transactional
    public PagoDTO.PagoResponse crearPago(Long usuarioId, PagoDTO.CrearPago request) {
        ServicioAceptado servicio = servicioRepository.findById(request.getServicioId())
                .orElseThrow(() -> new NotFoundException("Servicio no encontrado"));

        if (!servicio.getCliente().getId().equals(usuarioId)) {
            throw new PaymentException("No autorizado para crear pago de este servicio");
        }

        if (!servicio.getEstado().equals(ServicioAceptado.EstadoServicio.COMPLETADO)) {
            throw new PaymentException("El servicio debe estar completado para procesar el pago");
        }

        Optional<Pago> pagoExistente = pagoRepository.findByServicioIdAndEstado(
                request.getServicioId(), EstadoPago.APROBADO
        );
        if (pagoExistente.isPresent()) {
            throw new PaymentException("Ya existe un pago aprobado para este servicio");
        }

        BigDecimal comision = request.getMonto()
                .multiply(commissionRate)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal montoProveedor = request.getMonto().subtract(comision);

        String referencia = generateReferencia(servicio.getId());

        Pago pago = new Pago();
        pago.setServicio(servicio);
        pago.setMonto(request.getMonto());
        pago.setComisionPlataforma(comision);
        pago.setMontoProveedor(montoProveedor);
        pago.setMetodoPago(request.getMetodoPago().name());
        pago.setEstado(EstadoPago.PENDIENTE);
        pago.setReferencia(referencia);

        pago = pagoRepository.save(pago);

        try {
            String paymentLink = crearTransaccionWompi(pago, request);
            pago.setPaymentLink(paymentLink);
            pago = pagoRepository.save(pago);

            log.info("Pago creado exitosamente: {} para servicio {}", pago.getId(), servicio.getId());

        } catch (Exception e) {
            pago.setEstado(EstadoPago.FALLIDO);
            pago.setMensajeError("Error al crear transacción en Wompi: " + e.getMessage());
            pagoRepository.save(pago);
            log.error("Error al crear transacción Wompi: {}", e.getMessage(), e);
            throw new PaymentException("Error al procesar el pago: " + e.getMessage());
        }

        return mapToResponse(pago);
    }

    @Transactional
    public void procesarWebhookWompi(PagoDTO.WompiWebhookEvent webhook) {
        if (!validarSignatureWompi(webhook)) {
            log.error("Signature inválida en webhook de Wompi");
            throw new PaymentException("Signature inválida");
        }

        PagoDTO.WompiTransaction transaction = webhook.getData();
        String referencia = transaction.getReference();

        Pago pago = pagoRepository.findByReferencia(referencia)
                .orElseThrow(() -> new NotFoundException("Pago no encontrado con referencia: " + referencia));

        EstadoPago estadoAnterior = pago.getEstado();
        
        switch (transaction.getStatus()) {
            case "APPROVED" -> {
                if (pago.getEstado() != EstadoPago.APROBADO) {
                    pago.setEstado(EstadoPago.APROBADO);
                    pago.setTransaccionWompiId(transaction.getId());
                    pago.setAprobadoAt(LocalDateTime.now());
                    pago.setMetodoPagoDetalle(transaction.getPaymentMethodType());
                    
                    notificarPagoExitoso(pago);
                    log.info("Pago {} aprobado exitosamente", pago.getId());
                }
            }
            case "DECLINED", "ERROR" -> {
                pago.setEstado(EstadoPago.RECHAZADO);
                pago.setTransaccionWompiId(transaction.getId());
                pago.setMensajeError(transaction.getStatusMessage());
                
                notificarPagoRechazado(pago, transaction.getStatusMessage());
                log.warn("Pago {} rechazado: {}", pago.getId(), transaction.getStatusMessage());
            }
            case "VOIDED" -> {
                pago.setEstado(EstadoPago.REEMBOLSADO);
                pago.setReembolsadoAt(LocalDateTime.now());
                
                log.info("Pago {} anulado/reembolsado", pago.getId());
            }
            default -> {
                log.warn("Estado desconocido en webhook: {}", transaction.getStatus());
            }
        }

        pagoRepository.save(pago);

        if (!estadoAnterior.equals(pago.getEstado())) {
            registrarAuditoria(pago, estadoAnterior, pago.getEstado(), webhook.getEvent());
        }
    }

    @Transactional
    public PagoDTO.ReembolsoResponse procesarReembolso(Long pagoId, PagoDTO.ReembolsoRequest request) {
        Pago pago = pagoRepository.findById(pagoId)
                .orElseThrow(() -> new NotFoundException("Pago no encontrado"));

        if (pago.getEstado() != EstadoPago.APROBADO) {
            throw new PaymentException("Solo se pueden reembolsar pagos aprobados");
        }

        BigDecimal montoReembolso = request.getMontoReembolso() != null ?
                request.getMontoReembolso() : pago.getMonto();

        if (montoReembolso.compareTo(pago.getMonto()) > 0) {
            throw new PaymentException("El monto de reembolso no puede ser mayor al monto del pago");
        }

        try {
            String transaccionId = ejecutarReembolsoWompi(pago, montoReembolso, request.getMotivo());

            pago.setEstado(EstadoPago.REEMBOLSADO);
            pago.setReembolsadoAt(LocalDateTime.now());
            pago.setMensajeError("Reembolso: " + request.getMotivo());
            pagoRepository.save(pago);

            notificarReembolso(pago, montoReembolso);

            log.info("Reembolso procesado para pago {}: ${}", pagoId, montoReembolso);

            return new PagoDTO.ReembolsoResponse(
                    pagoId,
                    montoReembolso,
                    "REEMBOLSADO",
                    transaccionId,
                    LocalDateTime.now()
            );

        } catch (Exception e) {
            log.error("Error al procesar reembolso para pago {}: {}", pagoId, e.getMessage(), e);
            throw new PaymentException("Error al procesar reembolso: " + e.getMessage());
        }
    }

    public PagoDTO.PagoResponse obtenerPago(Long pagoId, Long usuarioId) {
        Pago pago = pagoRepository.findById(pagoId)
                .orElseThrow(() -> new NotFoundException("Pago no encontrado"));

        if (!pago.getServicio().getCliente().getId().equals(usuarioId) &&
            !pago.getServicio().getProveedor().getId().equals(usuarioId)) {
            throw new PaymentException("No autorizado para ver este pago");
        }

        return mapToResponse(pago);
    }

    public List<PagoDTO.PagoResponse> obtenerPagosPorUsuario(Long usuarioId, EstadoPago estado) {
        List<Pago> pagos;
        
        if (estado != null) {
            pagos = pagoRepository.findByServicioClienteIdAndEstado(usuarioId, estado);
            pagos.addAll(pagoRepository.findByServicioProveedorIdAndEstado(usuarioId, estado));
        } else {
            pagos = pagoRepository.findByServicioClienteId(usuarioId);
            pagos.addAll(pagoRepository.findByServicioProveedorId(usuarioId));
        }

        return pagos.stream()
                .map(this::mapToResponse)
                .sorted((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()))
                .toList();
    }

    public PagoDTO.EstadisticasPagos obtenerEstadisticas(LocalDateTime desde, LocalDateTime hasta) {
        List<Pago> pagos = pagoRepository.findByCreatedAtBetween(desde, hasta);

        BigDecimal totalRecaudado = pagos.stream()
                .filter(p -> p.getEstado() == EstadoPago.APROBADO)
                .map(Pago::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal comisionesTotales = pagos.stream()
                .filter(p -> p.getEstado() == EstadoPago.APROBADO)
                .map(Pago::getComisionPlataforma)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pagosPendientes = pagos.stream()
                .filter(p -> p.getEstado() == EstadoPago.PENDIENTE)
                .map(Pago::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalTransacciones = pagos.size();
        long pagosAprobados = pagos.stream().filter(p -> p.getEstado() == EstadoPago.APROBADO).count();
        long pagosRechazados = pagos.stream().filter(p -> p.getEstado() == EstadoPago.RECHAZADO).count();
        long pagosReembolsados = pagos.stream().filter(p -> p.getEstado() == EstadoPago.REEMBOLSADO).count();

        double tasaExito = totalTransacciones > 0 ?
                (pagosAprobados * 100.0 / totalTransacciones) : 0.0;

        return new PagoDTO.EstadisticasPagos(
                totalRecaudado,
                comisionesTotales,
                pagosPendientes,
                totalTransacciones,
                pagosAprobados,
                pagosRechazados,
                pagosReembolsados,
                BigDecimal.valueOf(tasaExito).setScale(2, RoundingMode.HALF_UP).doubleValue()
        );
    }

    @Async
    @Transactional
    public void verificarPagosPendientes() {
        LocalDateTime limiteExpiracion = LocalDateTime.now().minusHours(24);
        List<Pago> pagosPendientes = pagoRepository.findByEstadoAndCreatedAtBefore(
                EstadoPago.PENDIENTE, limiteExpiracion
        );

        for (Pago pago : pagosPendientes) {
            try {
                String estado = consultarEstadoWompi(pago.getTransaccionWompiId());
                
                if ("APPROVED".equals(estado)) {
                    pago.setEstado(EstadoPago.APROBADO);
                    pago.setAprobadoAt(LocalDateTime.now());
                    notificarPagoExitoso(pago);
                } else if ("DECLINED".equals(estado) || "ERROR".equals(estado)) {
                    pago.setEstado(EstadoPago.RECHAZADO);
                } else if ("PENDING".equals(estado)) {
                    pago.setEstado(EstadoPago.EXPIRADO);
                }
                
                pagoRepository.save(pago);
                log.info("Estado de pago {} actualizado a: {}", pago.getId(), pago.getEstado());
                
            } catch (Exception e) {
                log.error("Error al verificar pago {}: {}", pago.getId(), e.getMessage());
            }
        }

        log.info("Verificación de pagos pendientes completada. Procesados: {}", pagosPendientes.size());
    }

    private String crearTransaccionWompi(Pago pago, PagoDTO.CrearPago request) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("amount_in_cents", pago.getMonto().multiply(BigDecimal.valueOf(100)).intValue());
            requestBody.put("currency", "COP");
            requestBody.put("reference", pago.getReferencia());
            requestBody.put("public_key", wompiPublicKey);
            
            Map<String, String> customerInfo = new HashMap<>();
            customerInfo.put("email", request.getEmail() != null ? request.getEmail() : 
                    pago.getServicio().getCliente().getEmail());
            customerInfo.put("full_name", pago.getServicio().getCliente().getNombre());
            customerInfo.put("phone_number", request.getTelefono() != null ? request.getTelefono() :
                    pago.getServicio().getCliente().getTelefono());
            requestBody.put("customer_data", customerInfo);
            
            requestBody.put("redirect_url", callbackUrl + "/payment-result");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + wompiPrivateKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(
                    wompiApiUrl + "/v1/transactions",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED) {
                @SuppressWarnings("unchecked")
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
                    String transactionId = (String) data.get("id");
                    pago.setTransaccionWompiId(transactionId);
                    
                    return (String) data.get("payment_link_url");
                }
            }

            throw new PaymentException("Respuesta inválida de Wompi");

        } catch (Exception e) {
            log.error("Error al crear transacción en Wompi: {}", e.getMessage(), e);
            throw new PaymentException("Error al comunicarse con Wompi: " + e.getMessage());
        }
    }

    private String ejecutarReembolsoWompi(Pago pago, BigDecimal monto, String motivo) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("transaction_id", pago.getTransaccionWompiId());
            requestBody.put("amount_in_cents", monto.multiply(BigDecimal.valueOf(100)).intValue());
            requestBody.put("reason", motivo);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + wompiPrivateKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(
                    wompiApiUrl + "/v1/transactions/" + pago.getTransaccionWompiId() + "/void",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                @SuppressWarnings("unchecked")
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
                    return (String) data.get("id");
                }
            }

            throw new PaymentException("Error al procesar reembolso en Wompi");

        } catch (Exception e) {
            log.error("Error al ejecutar reembolso en Wompi: {}", e.getMessage(), e);
            throw new PaymentException("Error al procesar reembolso: " + e.getMessage());
        }
    }

    private String consultarEstadoWompi(String transactionId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + wompiPrivateKey);

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(
                    wompiApiUrl + "/v1/transactions/" + transactionId,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                @SuppressWarnings("unchecked")
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
                    return (String) data.get("status");
                }
            }

            return "UNKNOWN";

        } catch (Exception e) {
            log.error("Error al consultar estado en Wompi: {}", e.getMessage());
            return "ERROR";
        }
    }

    /**
     * Valida la firma oficial del webhook de Wompi usando SHA-256.
     * Wompi envía: X-Event-Checksum = SHA256(timestamp + "." + eventSecret + "." + rawBody)
     * Usa MessageDigest.isEqual() para comparación time-constant (previene timing attacks).
     */
    public boolean validarWebhookSignature(String rawBody, String checksum, String timestamp) {
        try {
            String concatenated = timestamp + "." + wompiEventSecret + "." + rawBody;

            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(concatenated.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }

            String calculatedChecksum = hexString.toString();
            boolean valid = java.security.MessageDigest.isEqual(
                    calculatedChecksum.getBytes(StandardCharsets.UTF_8),
                    checksum.getBytes(StandardCharsets.UTF_8)
            );

            if (!valid) {
                log.warn("Wompi webhook checksum mismatch");
            }
            return valid;

        } catch (java.security.NoSuchAlgorithmException e) {
            log.error("Error al calcular SHA-256 para validación Wompi: {}", e.getMessage());
            return false;
        }
    }

    private boolean validarSignatureWompi(PagoDTO.WompiWebhookEvent webhook) {
        try {
            String payload = webhook.getEvent() + webhook.getData().getId() +
                    webhook.getData().getStatus() + webhook.getData().getAmountInCents();

            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    wompiEventSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"
            );
            mac.init(secretKeySpec);

            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String calculatedSignature = Base64.getEncoder().encodeToString(hash);

            return calculatedSignature.equals(webhook.getSignature());

        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Error al validar signature: {}", e.getMessage());
            return false;
        }
    }

    private String generateReferencia(Long servicioId) {
        return "HC-" + servicioId + "-" + System.currentTimeMillis();
    }

    private void notificarPagoExitoso(Pago pago) {
        notificationService.notificarPagoExitoso(
                pago.getId(),
                pago.getServicio().getCliente().getId(),
                pago.getMonto().doubleValue()
        );

        Map<String, String> data = new HashMap<>();
        data.put("tipo", "PAGO_PROVEEDOR");
        data.put("pagoId", pago.getId().toString());

        notificationService.enviarNotificacion(
                pago.getServicio().getProveedor().getId(),
                "Pago recibido",
                "Has recibido un pago de $" + pago.getMontoProveedor(),
                data,
                null
        );
    }

    private void notificarPagoRechazado(Pago pago, String motivo) {
        Map<String, String> data = new HashMap<>();
        data.put("tipo", "PAGO_RECHAZADO");
        data.put("pagoId", pago.getId().toString());

        notificationService.enviarNotificacion(
                pago.getServicio().getCliente().getId(),
                "Pago rechazado",
                "Tu pago fue rechazado: " + motivo,
                data,
                null
        );
    }

    private void notificarReembolso(Pago pago, BigDecimal monto) {
        Map<String, String> data = new HashMap<>();
        data.put("tipo", "REEMBOLSO");
        data.put("pagoId", pago.getId().toString());

        notificationService.enviarNotificacion(
                pago.getServicio().getCliente().getId(),
                "Reembolso procesado",
                "Se ha procesado un reembolso de $" + monto,
                data,
                null
        );
    }

    private void registrarAuditoria(Pago pago, EstadoPago estadoAnterior,
                                    EstadoPago nuevoEstado, String evento) {
        log.info("Auditoría de pago {}: {} -> {} (Evento: {})",
                pago.getId(), estadoAnterior, nuevoEstado, evento);
    }

    /**
     * Procesa pago para suscripción usando Wompi
     */
    @Transactional
    public String procesarPagoSuscripcion(Long usuarioId, BigDecimal monto, 
                                        String metodoPagoId, String descripcion) {
        try {
            log.info("Procesando pago suscripción: Usuario={}, Monto={}", usuarioId, monto);

            // Crear transacción en Wompi
            Map<String, Object> paymentData = new HashMap<>();
            paymentData.put("amount_in_cents", monto.multiply(new BigDecimal(100)).intValue());
            paymentData.put("currency", "COP");
            paymentData.put("customer_email", "user" + usuarioId + "@homecare.app");
            paymentData.put("reference", "SUBSCRIPTION_" + System.currentTimeMillis());
            paymentData.put("payment_method", Map.of(
                    "type", "CARD",
                    "token", metodoPagoId
            ));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + wompiPrivateKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(paymentData, headers);
            
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    wompiApiUrl + "/v1/transactions",
                    HttpMethod.POST,
                    request,
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && "APPROVED".equals(responseBody.get("status"))) {
                String transactionId = (String) responseBody.get("id");
                log.info("Pago de suscripción aprobado: {}", transactionId);
                return transactionId;
            } else {
                log.error("Pago de suscripción rechazado: {}", responseBody);
                throw new PaymentException("Pago rechazado por la pasarela de pagos");
            }

        } catch (Exception e) {
            log.error("Error procesando pago de suscripción: {}", e.getMessage(), e);
            throw new PaymentException("Error procesando el pago: " + e.getMessage());
        }
    }

    private PagoDTO.PagoResponse mapToResponse(Pago pago) {
        return new PagoDTO.PagoResponse(
                pago.getId(),
                pago.getServicio().getId(),
                pago.getMonto(),
                pago.getComisionPlataforma(),
                pago.getMontoProveedor(),
                pago.getMetodoPago(),
                pago.getEstado(),
                pago.getTransaccionWompiId(),
                pago.getPaymentLink(),
                pago.getReferencia(),
                pago.getCreatedAt(),
                pago.getAprobadoAt()
        );
    }
}
