package com.homecare.domain.payment.service;

import com.homecare.dto.SubscriptionDTO;
import com.homecare.common.exception.NotFoundException;
import com.homecare.domain.payment.model.Subscription;
import com.homecare.domain.payment.model.Subscription.Estado;
import com.homecare.domain.payment.model.Subscription.PlanType;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.payment.repository.SubscriptionRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.domain.common.service.NotificationService;
import com.mercadopago.resources.payment.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UsuarioRepository usuarioRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;

    // Precio en COP + IVA 19% - Colombia
    // Base: $30.000 COP | IVA 19%: $5.700 | Total: $35.700 COP/mes
    private static final BigDecimal PRECIO_BASE_MENSUAL_COP = new BigDecimal("30000");
    private static final BigDecimal IVA_RATE                = new BigDecimal("0.19");
    private static final BigDecimal PRECIO_CON_IVA_COP      =
            PRECIO_BASE_MENSUAL_COP
                    .multiply(BigDecimal.ONE.add(IVA_RATE))
                    .setScale(0, RoundingMode.HALF_UP); // = 35700

    private static final Map<PlanType, BigDecimal> PLAN_PRICES = Map.of(
            PlanType.PREMIUM, PRECIO_CON_IVA_COP
    );

    /** Mapeo de IDs de plan del frontend a PlanType del backend */
    private static final Map<String, PlanType> FRONTEND_PLAN_MAP = Map.of(
            "premium", PlanType.PREMIUM
    );

    @Transactional
    public SubscriptionDTO.Response crearSuscripcion(Long usuarioId, SubscriptionDTO.Crear request) {
        // Este endpoint es legacy. El flujo de pago real usa POST /subscriptions/checkout
        // que crea una preferencia en Mercado Pago (Checkout Pro) y retorna la URL de pago.
        // Activar una suscripción PREMIUM sin confirmar el pago a través de MP es inseguro.
        throw new UnsupportedOperationException(
                "El flujo de suscripción directa está deshabilitado. " +
                "Usa POST /subscriptions/checkout para iniciar el pago con Mercado Pago."
        );
    }

    @Transactional
    public void cancelarSuscripcion(Long usuarioId) {
        Subscription subscription = subscriptionRepository.findByUsuarioIdAndEstado(usuarioId, Estado.ACTIVA)
                .orElseThrow(() -> new NotFoundException("No hay suscripción activa"));

        subscription.setEstado(Estado.CANCELADA);
        subscription.setAutoRenovar(false);
        subscriptionRepository.save(subscription);

        log.info("Suscripción cancelada para usuario {}", usuarioId);
    }

    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void renovarSuscripciones() {
        LocalDate hoy = LocalDate.now();
        List<Subscription> porRenovar = subscriptionRepository.findByEstadoAndFechaFinAndAutoRenovar(
                Estado.ACTIVA, hoy, true
        );

        for (Subscription sub : porRenovar) {
            try {
                // PREMIUM: siempre requiere pago recurrente
                boolean pagoExitoso = procesarPagoRecurrente(sub);
                if (pagoExitoso) {
                    renovarAutomaticamente(sub);
                } else {
                    sub.setEstado(Estado.PENDIENTE_PAGO);
                    subscriptionRepository.save(sub);
                }
            } catch (Exception e) {
                log.error("Error renovando suscripcion {}: {}", sub.getId(), e.getMessage());
            }
        }

        log.info("Proceso de renovación completado. {} suscripciones procesadas", porRenovar.size());
    }

    private void renovarAutomaticamente(Subscription subscription) {
        subscription.setFechaInicio(LocalDate.now());
        subscription.setFechaFin(LocalDate.now().plusMonths(1));
        subscriptionRepository.save(subscription);

        notificationService.enviarNotificacion(
                subscription.getUsuario().getId(),
                "Suscripción Renovada",
                "Tu plan " + subscription.getPlan() + " ha sido renovado automáticamente",
                Map.of("tipo", "SUSCRIPCION_RENOVADA"),
                null
        );
    }

    private boolean procesarPagoRecurrente(Subscription subscription) {
        // Integración con Wompi para pagos recurrentes
        return true; // Placeholder
    }

    /**
     * Retorna la suscripción activa del usuario, o null si no tiene ninguna.
     * No lanza excepción — el frontend recibe un 200 con body null si no hay suscripción.
     * Esto es importante después de un pago: el webhook puede no haber llegado aún.
     */
    public SubscriptionDTO.Response obtenerSuscripcionActual(Long usuarioId) {
        return subscriptionRepository.findByUsuarioIdAndEstado(usuarioId, Estado.ACTIVA)
                .map(this::mapToResponse)
                .orElse(null);
    }

    /**
     * Activa (o marca como fallida) una suscripción a partir del pago confirmado por Mercado Pago.
     * Llamado desde {@link com.homecare.domain.payment.service.PaymentService#procesarWebhookMP}
     * cuando la referencia externa comienza con "HC-SUB-".
     *
     * <p>Formato de externalReference: {@code HC-SUB-{PLAN}-{userId}-{uuid8}}
     *
     * <p>Idempotente: si ya existe una suscripción ACTIVA con el mismo transactionId, no hace nada.
     */
    @Transactional
    public void activarSuscripcionPorWebhook(Payment payment) {
        String referencia = payment.getExternalReference();
        String mpPaymentId = String.valueOf(payment.getId());
        String mpStatus    = payment.getStatus();

        log.info("Webhook suscripción recibido — referencia={}, mpId={}, estado={}",
                referencia, mpPaymentId, mpStatus);

        // Idempotencia: si ya procesamos este pago, salir
        if (subscriptionRepository.findByTransactionId(mpPaymentId).isPresent()) {
            log.info("Webhook suscripción ya procesado — mpPaymentId={}", mpPaymentId);
            return;
        }

        // Parsear: HC-SUB-{PLAN}-{userId}-{uuid8}
        String[] parts = referencia.split("-");
        // parts[0]=HC, parts[1]=SUB, parts[2]=PLAN, parts[3]=userId, parts[4]=uuid8
        if (parts.length < 5) {
            log.error("Formato de externalReference inválido para suscripción: {}", referencia);
            return;
        }
        PlanType planType;
        Long usuarioId;
        try {
            planType  = PlanType.valueOf(parts[2]);
            usuarioId = Long.parseLong(parts[3]);
        } catch (Exception e) {
            log.error("No se pudo parsear plan/userId desde referencia {}: {}", referencia, e.getMessage());
            return;
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElse(null);
        if (usuario == null) {
            log.error("Usuario {} no encontrado para activar suscripción {}", usuarioId, referencia);
            return;
        }

        if ("approved".equals(mpStatus)) {
            // Cancelar cualquier suscripción activa anterior
            subscriptionRepository.findByUsuarioIdAndEstado(usuarioId, Estado.ACTIVA)
                    .ifPresent(s -> {
                        s.setEstado(Estado.CANCELADA);
                        subscriptionRepository.save(s);
                    });

            // Crear y activar la nueva suscripción
            Subscription subscription = new Subscription();
            subscription.setUsuario(usuario);
            subscription.setPlan(planType);
            subscription.setPrecioMensual(PLAN_PRICES.get(planType));
            subscription.setFechaInicio(LocalDate.now());
            subscription.setFechaFin(LocalDate.now().plusMonths(1));
            subscription.setEstado(Estado.ACTIVA);
            subscription.setAutoRenovar(true);
            subscription.setTransactionId(mpPaymentId);

            subscriptionRepository.save(subscription);

            notificationService.enviarNotificacion(
                    usuarioId,
                    "¡Suscripción activada! 🌟",
                    "Tu plan " + planType.name() + " está activo hasta el " + subscription.getFechaFin() + ". ¡Disfruta los beneficios!",
                    Map.of(
                            "tipo",        "SUSCRIPCION_ACTIVADA",
                            "plan",        planType.name(),
                            "fechaFin",    subscription.getFechaFin().toString(),
                            "precio",      PLAN_PRICES.get(planType).toPlainString(),
                            "mpPaymentId", mpPaymentId
                    ),
                    null
            );

            log.info("[MP-WEBHOOK] ✅ Suscripción {} activada — usuario={}, mpPaymentId={}, vigente hasta={}",
                    planType, usuarioId, mpPaymentId, subscription.getFechaFin());

        } else if ("rejected".equals(mpStatus) || "cancelled".equals(mpStatus)) {
            // Registrar el intento fallido si hay una PENDIENTE_PAGO
            subscriptionRepository.findByUsuarioIdAndEstado(usuarioId, Estado.PENDIENTE_PAGO)
                    .ifPresent(s -> {
                        s.setEstado(Estado.FALLIDA);
                        s.setTransactionId(mpPaymentId);
                        subscriptionRepository.save(s);
                    });

            notificationService.enviarNotificacion(
                    usuarioId,
                    "Pago de suscripción rechazado",
                    "No pudimos procesar tu pago para el plan " + planType.name() + ". Intenta con otro método de pago.",
                    Map.of(
                            "tipo",        "SUSCRIPCION_FALLIDA",
                            "plan",        planType.name(),
                            "mpPaymentId", mpPaymentId
                    ),
                    null
            );

            log.warn("[MP-WEBHOOK] ❌ Pago suscripción rechazado/cancelado — usuario={}, plan={}, referencia={}",
                    usuarioId, planType, referencia);
        } else {
            log.info("Estado MP '{}' para suscripción no requiere acción inmediata — referencia={}", mpStatus, referencia);
        }
    }

    /**
     * Crea una preferencia de pago Checkout Pro de Mercado Pago para una suscripción.
     * Devuelve la URL init_point que el cliente abre en un WebView.
     *
     * @param usuarioId  ID del usuario autenticado
     * @param planFrontend ID del plan ("premium" | "pro")
     * @return CheckoutResponse con initPoint, preferenceId y externalReference
     */
    @Transactional
    public SubscriptionDTO.CheckoutResponse crearCheckoutSuscripcion(Long usuarioId, String planFrontend) {
        PlanType planType = FRONTEND_PLAN_MAP.get(planFrontend.toLowerCase());
        if (planType == null) {
            throw new IllegalArgumentException("Plan invalido para checkout: " + planFrontend + ". Solo se acepta 'premium'");
        }

        BigDecimal precio = PLAN_PRICES.get(planType);

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        // Idempotencia: devolver la misma preferencia si ya existe una suscripción activa
        // para este plan (evita crear múltiples preferencias en MP por doble-click)
        var suscripcionActiva = subscriptionRepository.findByUsuarioIdAndEstado(usuarioId, Estado.ACTIVA);
        if (suscripcionActiva.isPresent() && suscripcionActiva.get().getPlan() == planType) {
            log.info("Usuario {} ya tiene plan {} activo — devolviendo suscripción existente", usuarioId, planType);
            throw new IllegalStateException("Ya tienes el plan " + planType.name() + " activo");
        }

        log.info("Creando checkout MP para usuario {} — plan {} ({})", usuarioId, planFrontend, precio);

        return paymentService.crearPreferenciaSuscripcion(usuarioId, planType, precio, usuario.getEmail());
    }

    public List<SubscriptionDTO.PlanInfo> obtenerPlanes() {
        // Precio en COP + IVA 19% - Colombia
        // Base: $30.000 COP | IVA: $5.700 | Total: $35.700 COP/mes
        return List.of(
                new SubscriptionDTO.PlanInfo(
                        PlanType.PREMIUM,
                        PRECIO_CON_IVA_COP,
                        List.of(
                                "Descuento especial en todos los servicios",
                                "Prioridad alta al asignar profesionales",
                                "Pasa primero en la cola de asignacion",
                                "Acceso a profesionales verificados",
                                "Chat en tiempo real con profesionales",
                                "Soporte prioritario",
                                "Garantia de satisfaccion"
                        )
                )
        );
    }

    private SubscriptionDTO.Response mapToResponse(Subscription subscription) {
        return new SubscriptionDTO.Response(
                subscription.getId(),
                subscription.getPlan(),
                subscription.getPrecioMensual(),
                subscription.getFechaInicio(),
                subscription.getFechaFin(),
                subscription.getEstado(),
                subscription.getAutoRenovar()
        );
    }
}

