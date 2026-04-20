package com.homecare.domain.payment.service;

import com.homecare.dto.PagoDTO;
import com.homecare.dto.SubscriptionDTO;
import com.homecare.common.exception.NotFoundException;
import com.homecare.common.exception.PaymentException;
import com.homecare.domain.payment.model.Pago;
import com.homecare.domain.payment.model.Pago.EstadoPago;
import com.homecare.domain.payment.model.Subscription.PlanType;
import com.homecare.model.ServicioAceptado;
import com.homecare.domain.payment.repository.PagoRepository;
import com.homecare.domain.service_order.repository.ServicioAceptadoRepository;
import com.homecare.domain.common.service.NotificationService;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.payment.PaymentRefundClient;
import com.mercadopago.client.preference.PreferenceBackUrlsRequest;
import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceItemRequest;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.preference.Preference;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PagoRepository pagoRepository;
    private final ServicioAceptadoRepository servicioRepository;
    private final NotificationService notificationService;

    @Value("${mercadopago.access-token}")
    private String mpAccessToken;

    @Value("${mercadopago.public-key}")
    private String mpPublicKey;

    @Value("${mercadopago.commission-rate:0.10}")
    private BigDecimal commissionRate;

    @Value("${mercadopago.callback-url}")
    private String callbackUrl;

    @Value("${wompi.event.secret:}")
    private String wompiEventSecret;

    /** Secreto para validar notificaciones de Mercado Pago (x-signature header) */
    @Value("${mercadopago.webhook-secret:}")
    private String mpWebhookSecret;

    /** Inyectar SubscriptionService con @Lazy para evitar dependencia circular */
    @Lazy
    @Autowired
    private SubscriptionService subscriptionService;

    @PostConstruct
    public void init() {
        if (mpAccessToken != null && !mpAccessToken.isEmpty() && !mpAccessToken.contains("XXXX")) {
            MercadoPagoConfig.setAccessToken(mpAccessToken);
            log.info("Mercado Pago configurado con Access Token");
        } else {
            log.warn("Mercado Pago Access Token no configurado o contiene valores de prueba");
        }
    }

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

        BigDecimal comision = request.getMonto()
                .multiply(commissionRate)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal montoProveedor = request.getMonto().subtract(comision);

        String referencia = generateReferencia(servicio.getId());

        Pago pago = new Pago();
        pago.setServicio(servicio);
        pago.setCliente(servicio.getCliente());
        pago.setProveedor(servicio.getProveedor());
        pago.setMontoTotal(request.getMonto());
        pago.setComisionPlataforma(comision);
        pago.setMontoProveedor(montoProveedor);
        pago.setMetodoPago(request.getMetodoPago().name());
        pago.setEstado(EstadoPago.PENDIENTE);
        pago.setReferencia(referencia);

        pago = pagoRepository.save(pago);

        // Si viene con token (Checkout Bricks), procesar inmediatamente
        if (request.getCardToken() != null && !request.getCardToken().isEmpty()) {
            return procesarPagoConToken(pago, request);
        }

        // Si no, crear preferencia (Checkout Pro / Redirect)
        try {
            Preference preference = crearPreferenciaMP(pago);
            pago.setPreferenciaId(preference.getId());
            pago.setPaymentLink(preference.getInitPoint());
            pago = pagoRepository.save(pago);

            log.info("Preferencia de Mercado Pago creada exitosamente: {} para pago {}", preference.getId(), pago.getId());

        } catch (Exception e) {
            pago.setEstado(EstadoPago.FALLIDO);
            pago.setMensajeError("Error al crear preferencia en Mercado Pago: " + e.getMessage());
            pagoRepository.save(pago);
            log.error("Error al crear preferencia MP: {}", e.getMessage(), e);
            throw new PaymentException("Error al procesar el pago: " + e.getMessage());
        }

        return mapToResponse(pago);
    }

    private PagoDTO.PagoResponse procesarPagoConToken(Pago pago, PagoDTO.CrearPago request) {
        try {
            PaymentClient client = new PaymentClient();

            com.mercadopago.client.payment.PaymentCreateRequest createRequest =
                com.mercadopago.client.payment.PaymentCreateRequest.builder()
                    .token(request.getCardToken())
                    .description("Pago de servicio HomeCare #" + pago.getServicio().getId())
                    .installments(request.getInstallments() != null ? request.getInstallments() : 1)
                    .paymentMethodId(request.getPaymentMethodId())
                    .transactionAmount(pago.getMontoTotal())
                    .externalReference(pago.getReferencia())
                    .notificationUrl(callbackUrl.replaceAll("/api$", "") + "/api/payments/webhook/mercadopago")
                    .issuerId(request.getIssuerId())
                    .payer(com.mercadopago.client.payment.PaymentPayerRequest.builder()
                        .email(request.getEmail() != null ? request.getEmail() : pago.getCliente().getEmail())
                        .build())
                    .build();

            Payment response = client.create(createRequest);

            pago.setTransaccionExternaId(String.valueOf(response.getId()));
            pago.setMetodoPagoDetalle(response.getPaymentMethodId());

            if ("approved".equals(response.getStatus())) {
                pago.setEstado(EstadoPago.APROBADO);
                pago.setAprobadoAt(LocalDateTime.now());
                notificarPagoExitoso(pago);
            } else if ("in_process".equals(response.getStatus())) {
                pago.setEstado(EstadoPago.PROCESANDO);
            } else {
                pago.setEstado(EstadoPago.FALLIDO);
                pago.setMensajeError(response.getStatusDetail());
            }

            pago = pagoRepository.save(pago);
            return mapToResponse(pago);

        } catch (Exception e) {
            log.error("Error al procesar pago con Bricks (token): {}", e.getMessage(), e);
            pago.setEstado(EstadoPago.FALLIDO);
            pago.setMensajeError("Error al procesar tarjeta: " + e.getMessage());
            pagoRepository.save(pago);
            throw new PaymentException("Error al procesar el pago con tarjeta: " + e.getMessage());
        }
    }

    @Transactional
    public void procesarWebhookMP(PagoDTO.MercadoPagoWebhookEvent event) {
        if (event.getData() == null || event.getData().getId() == null) {
            log.warn("Webhook de Mercado Pago sin ID de datos: {}", event);
            return;
        }

        try {
            PaymentClient client = new PaymentClient();
            Payment payment = client.get(Long.valueOf(event.getData().getId()));

            String referencia = payment.getExternalReference();

            // Suscripciones tienen el prefijo HC-SUB-; enrutar a SubscriptionService
            if (referencia != null && referencia.startsWith("HC-SUB-")) {
                log.info("[MP-WEBHOOK] Enrutando a SubscriptionService — ref: {}, paymentId: {}, estado: {}",
                        referencia, payment.getId(), payment.getStatus());
                subscriptionService.activarSuscripcionPorWebhook(payment);
                return;
            }

            Pago pago = pagoRepository.findByReferencia(referencia)
                    .orElseThrow(() -> new NotFoundException("Pago no encontrado con referencia: " + referencia));

            EstadoPago estadoAnterior = pago.getEstado();
            String mpStatus = payment.getStatus();

            log.info("Procesando webhook para pago {}, estado MP: {}", pago.getId(), mpStatus);

            switch (mpStatus) {
                case "approved" -> {
                    if (pago.getEstado() != EstadoPago.APROBADO) {
                        pago.setEstado(EstadoPago.APROBADO);
                        pago.setTransaccionExternaId(String.valueOf(payment.getId()));
                        pago.setAprobadoAt(LocalDateTime.now());
                        pago.setMetodoPagoDetalle(payment.getPaymentMethodId());
                        
                        notificarPagoExitoso(pago);
                        log.info("Pago {} aprobado por Mercado Pago", pago.getId());
                    }
                }
                case "rejected", "cancelled" -> {
                    pago.setEstado(EstadoPago.RECHAZADO);
                    pago.setTransaccionExternaId(String.valueOf(payment.getId()));
                    pago.setMensajeError(payment.getStatusDetail());
                    
                    notificarPagoRechazado(pago, payment.getStatusDetail());
                    log.warn("Pago {} rechazado por Mercado Pago: {}", pago.getId(), payment.getStatusDetail());
                }
                case "refunded" -> {
                    pago.setEstado(EstadoPago.REEMBOLSADO);
                    pago.setReembolsadoAt(LocalDateTime.now());
                    log.info("Pago {} marcado como reembolsado", pago.getId());
                }
            }

            pagoRepository.save(pago);

            if (!estadoAnterior.equals(pago.getEstado())) {
                registrarAuditoria(pago, estadoAnterior, pago.getEstado(), event.getAction());
            }

        } catch (Exception e) {
            log.error("Error al procesar webhook de Mercado Pago: {}", e.getMessage(), e);
            throw new PaymentException("Error al procesar notificacion de pago");
        }
    }

    @Transactional
    public PagoDTO.ReembolsoResponse procesarReembolso(Long pagoId, PagoDTO.ReembolsoRequest request) {
        Pago pago = pagoRepository.findById(pagoId)
                .orElseThrow(() -> new NotFoundException("Pago no encontrado"));

        if (pago.getEstado() != EstadoPago.APROBADO) {
            throw new PaymentException("Solo se pueden reembolsar pagos aprobados");
        }

        try {
            PaymentRefundClient refundClient = new PaymentRefundClient();
            refundClient.refund(Long.valueOf(pago.getTransaccionExternaId()));

            pago.setEstado(EstadoPago.REEMBOLSADO);
            pago.setReembolsadoAt(LocalDateTime.now());
            pago.setMensajeError("Reembolso: " + (request.getMotivo() != null ? request.getMotivo() : "Sin motivo"));
            pagoRepository.save(pago);

            notificarReembolso(pago, pago.getMontoTotal());

            log.info("Reembolso procesado para pago {} en Mercado Pago", pagoId);

            return new PagoDTO.ReembolsoResponse(
                    pagoId,
                    pago.getMontoTotal(),
                    "REEMBOLSADO",
                    pago.getTransaccionExternaId(),
                    LocalDateTime.now()
            );

        } catch (Exception e) {
            log.error("Error al procesar reembolso en Mercado Pago para pago {}: {}", pagoId, e.getMessage(), e);
            throw new PaymentException("Error al procesar reembolso: " + e.getMessage());
        }
    }

    private Preference crearPreferenciaMP(Pago pago) throws Exception {
        PreferenceClient client = new PreferenceClient();

        List<PreferenceItemRequest> items = new ArrayList<>();
        PreferenceItemRequest item = PreferenceItemRequest.builder()
                .title("Servicio HomeCare - " + pago.getServicio().getId())
                .quantity(1)
                .unitPrice(pago.getMontoTotal())
                .currencyId("COP")
                .build();
        items.add(item);

        PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                .success(callbackUrl + "/payment/success")
                .pending(callbackUrl + "/payment/pending")
                .failure(callbackUrl + "/payment/failure")
                .build();

        PreferenceRequest request = PreferenceRequest.builder()
                .items(items)
                .backUrls(backUrls)
                .externalReference(pago.getReferencia())
                .autoReturn("approved")
                .notificationUrl(callbackUrl.replaceAll("/api$", "") + "/api/payments/webhook/mercadopago")
                .build();

        return client.create(request);
    }

    /**
     * Crea una preferencia de Checkout Pro en Mercado Pago para el pago de una suscripción.
     * Es llamado por SubscriptionService y devuelve la URL init_point lista para el WebView.
     *
     * @param usuarioId ID del usuario que contrata la suscripción
     * @param planType  Plan al que se está suscribiendo
     * @param precio    Precio del plan en la moneda configurada (COP)
     * @param email     Email del pagador (enviado a MP para pre-llenar el formulario)
     * @return CheckoutResponse con initPoint, preferenceId y externalReference
     */
    public SubscriptionDTO.CheckoutResponse crearPreferenciaSuscripcion(
            Long usuarioId, PlanType planType, BigDecimal precio, String email) {

        try {
            PreferenceClient client = new PreferenceClient();

            String externalReference = "HC-SUB-" + planType.name()
                    + "-" + usuarioId
                    + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

            // Precio en COP + IVA 19% - Colombia
            PreferenceItemRequest item = PreferenceItemRequest.builder()
                    .title("Homecare Colorimetria — Suscripcion Premium")
                    .description("Suscripcion mensual Premium. Incluye IVA 19%. Precio: $35.700 COP/mes")
                    .quantity(1)
                    .unitPrice(precio)
                    .currencyId("COP")
                    .build();

            PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                    .success(callbackUrl + "/payments/subscription/success")
                    .pending(callbackUrl + "/payments/subscription/pending")
                    .failure(callbackUrl + "/payments/subscription/failure")
                    .build();

            PreferenceRequest request = PreferenceRequest.builder()
                    .items(List.of(item))
                    .backUrls(backUrls)
                    .externalReference(externalReference)
                    .autoReturn("approved")
                    .notificationUrl(callbackUrl.replaceAll("/api$", "") + "/api/payments/webhook/mercadopago")
                    .build();

            Preference preference = client.create(request);

            log.info("[MP-SUBS] Preferencia creada — plan: {}, usuario: {}, monto: ${} COP, preferenceId: {}, extRef: {}",
                    planType.name(), usuarioId, precio.toPlainString(), preference.getId(), externalReference);

            return SubscriptionDTO.CheckoutResponse.builder()
                    .initPoint(preference.getInitPoint())
                    .preferenceId(preference.getId())
                    .externalReference(externalReference)
                    .plan(planType.name())
                    .monto(precio)
                    .moneda("COP")
                    .build();

        } catch (Exception e) {
            log.error("Error al crear preferencia de suscripción MP para usuario {}: {}", usuarioId, e.getMessage(), e);
            throw new PaymentException("No se pudo iniciar el proceso de pago: " + e.getMessage());
        }
    }

    private String generateReferencia(Long servicioId) {
        return "HC-SER-" + servicioId + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private void notificarPagoExitoso(Pago pago) {
        notificationService.enviarNotificacion(
                pago.getServicio().getCliente().getId(),
                "Pago Aprobado",
                "Tu pago por el servicio #" + pago.getServicio().getId() + " fue aprobado exitosamente.",
                Map.of("pagoId", String.valueOf(pago.getId()), "tipo", "PAGO_APROBADO"),
                null
        );
        
        notificationService.enviarNotificacion(
                pago.getServicio().getProveedor().getId(),
                "Pago Recibido",
                "Has recibido un pago de $" + pago.getMontoProveedor() + " por el servicio #" + pago.getServicio().getId(),
                Map.of("pagoId", String.valueOf(pago.getId()), "tipo", "PAGO_RECIBIDO"),
                null
        );
    }

    private void notificarPagoRechazado(Pago pago, String motivo) {
        notificationService.enviarNotificacion(
                pago.getServicio().getCliente().getId(),
                "Pago Rechazado",
                "Tu pago fue rechazado. Motivo: " + motivo,
                Map.of("pagoId", String.valueOf(pago.getId()), "tipo", "PAGO_RECHAZADO"),
                null
        );
    }

    private void notificarReembolso(Pago pago, BigDecimal monto) {
        notificationService.enviarNotificacion(
                pago.getServicio().getCliente().getId(),
                "Reembolso Procesado",
                "Se ha procesado un reembolso de $" + monto + " por el servicio #" + pago.getServicio().getId(),
                Map.of("pagoId", String.valueOf(pago.getId()), "tipo", "REEMBOLSO"),
                null
        );
    }

    private void registrarAuditoria(Pago pago, EstadoPago anterior, EstadoPago nuevo, String evento) {
        log.info("AUDITORIA PAGO - ID: {}, Referencia: {}, Cambio: {} -> {}, Evento: {}",
                pago.getId(), pago.getReferencia(), anterior, nuevo, evento);
    }

    private PagoDTO.PagoResponse mapToResponse(Pago pago) {
        return new PagoDTO.PagoResponse(
                pago.getId(),
                pago.getServicio().getId(),
                pago.getMontoTotal(),
                pago.getComisionPlataforma(),
                pago.getMontoProveedor(),
                pago.getMetodoPago(),
                pago.getEstado(),
                pago.getTransaccionExternaId(),
                pago.getPreferenciaId(),
                pago.getPaymentLink(),
                pago.getReferencia(),
                pago.getCreatedAt(),
                pago.getAprobadoAt()
        );
    }

    /**
     * Valida la firma de un webhook de Mercado Pago.
     * Formato del header x-signature: "ts=TIMESTAMP,v1=HMAC_HEX"
     * Mensaje a firmar: "id:{dataId};request-id:{requestId};ts:{ts};"
     *
     * @param xSignature  valor del header x-signature
     * @param requestId   valor del header x-request-id
     * @param dataId      data.id del evento (payment ID)
     * @return true si la firma es válida o si no hay secreto configurado
     */
    public boolean validarFirmaWebhookMP(String xSignature, String requestId, String dataId) {
        if (mpWebhookSecret == null || mpWebhookSecret.isBlank()) {
            log.warn("⚠️  MP webhook secret no configurado (sandbox) — validación de firma OMITIDA. Configura mercadopago.webhook-secret en producción.");
            return true; // sin secreto configurado, se acepta (modo sandbox)
        }
        if (xSignature == null || xSignature.isBlank()) {
            log.warn("Webhook MP sin header x-signature");
            return false;
        }
        try {
            // Parsear ts y v1 del header
            String ts = null, v1 = null;
            for (String part : xSignature.split(",")) {
                String[] kv = part.trim().split("=", 2);
                if (kv.length == 2) {
                    if ("ts".equals(kv[0]))   ts = kv[1];
                    if ("v1".equals(kv[0]))   v1 = kv[1];
                }
            }
            if (ts == null || v1 == null) {
                log.warn("x-signature de MP con formato inválido: {}", xSignature);
                return false;
            }
            // Validación anti-replay: el timestamp no puede tener más de 5 minutos de antigüedad
            long tsEpoch = Long.parseLong(ts);
            long nowEpoch = Instant.now().getEpochSecond();
            if (Math.abs(nowEpoch - tsEpoch) > 300) {
                log.warn("Webhook MP rechazado: timestamp fuera de ventana — ts={}, now={}", tsEpoch, nowEpoch);
                return false;
            }
            // Construir el manifiesto y calcular HMAC-SHA256
            String manifest = "id:" + (dataId != null ? dataId : "") +
                              ";request-id:" + (requestId != null ? requestId : "") +
                              ";ts:" + ts + ";";
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(mpWebhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] computed = mac.doFinal(manifest.getBytes(StandardCharsets.UTF_8));
            // Hex-encode el digest
            StringBuilder hex = new StringBuilder(computed.length * 2);
            for (byte b : computed) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            // Comparación en tiempo constante
            byte[] expected = hex.toString().getBytes(StandardCharsets.UTF_8);
            byte[] provided = v1.getBytes(StandardCharsets.UTF_8);
            return MessageDigest.isEqual(expected, provided);
        } catch (Exception e) {
            log.error("Error validando firma webhook MP: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validates a Wompi webhook signature using constant-time comparison.
     * Expected checksum: SHA-256(timestamp + "." + wompiEventSecret + "." + rawBody)
     *
     * @param rawBody   raw UTF-8 request body
     * @param checksum  value from X-Event-Checksum header
     * @param timestamp value from X-Event-Timestamp header
     * @return true only when the computed digest matches the provided checksum
     */
    public boolean validarWebhookSignature(String rawBody, String checksum, String timestamp) {
        try {
            String concatenated = timestamp + "." + wompiEventSecret + "." + rawBody;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] computed = digest.digest(concatenated.getBytes(StandardCharsets.UTF_8));

            // Hex-encode the computed digest
            StringBuilder hex = new StringBuilder(computed.length * 2);
            for (byte b : computed) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }

            // Constant-time comparison to prevent timing attacks
            byte[] expected = hex.toString().getBytes(StandardCharsets.UTF_8);
            byte[] provided = (checksum == null ? "" : checksum).getBytes(StandardCharsets.UTF_8);
            return MessageDigest.isEqual(expected, provided);

        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 not available", e);
            return false;
        }
    }

    @Async
    @Transactional
    public void verificarPagosPendientes() {
        // Implementar consulta periodica a MP si es necesario
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
                .map(Pago::getMontoTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal comisionesTotales = pagos.stream()
                .filter(p -> p.getEstado() == EstadoPago.APROBADO)
                .map(Pago::getComisionPlataforma)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pagosPendientes = pagos.stream()
                .filter(p -> p.getEstado() == EstadoPago.PENDIENTE)
                .map(Pago::getMontoTotal)
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
}
