package com.homecare.service;

import com.homecare.dto.SubscriptionDTO;
import com.homecare.exception.NotFoundException;
import com.homecare.model.Subscription;
import com.homecare.model.Subscription.Estado;
import com.homecare.model.Subscription.PlanType;
import com.homecare.model.Usuario;
import com.homecare.repository.SubscriptionRepository;
import com.homecare.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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

    private static final Map<PlanType, BigDecimal> PLAN_PRICES = Map.of(
            PlanType.BASICO, BigDecimal.ZERO,
            PlanType.PRO, new BigDecimal("19.99"),
            PlanType.ENTERPRISE, new BigDecimal("49.99")
    );

    @Transactional
    public SubscriptionDTO.Response crearSuscripcion(Long usuarioId, SubscriptionDTO.Crear request) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        subscriptionRepository.findByUsuarioIdAndEstado(usuarioId, Estado.ACTIVA)
                .ifPresent(s -> {
                    s.setEstado(Estado.CANCELADA);
                    subscriptionRepository.save(s);
                });

        Subscription subscription = new Subscription();
        subscription.setUsuario(usuario);
        subscription.setPlan(request.getPlan());
        subscription.setPrecioMensual(PLAN_PRICES.get(request.getPlan()));
        subscription.setFechaInicio(LocalDate.now());
        subscription.setFechaFin(LocalDate.now().plusMonths(1));
        subscription.setEstado(Estado.ACTIVA);
        subscription.setAutoRenovar(true);
        subscription.setMetodoPagoId(request.getMetodoPagoId());

        subscription = subscriptionRepository.save(subscription);

        if (!request.getPlan().equals(PlanType.BASICO)) {
            try {
                // Procesar pago inicial con PaymentService
                log.info("Procesando pago inicial para suscripción {}", subscription.getId());
                
                // Crear transacción de pago para suscripción
                String transactionId = paymentService.procesarPagoSuscripcion(
                    usuarioId,
                    subscription.getPrecioMensual(),
                    request.getMetodoPagoId(),
                    "Suscripción " + request.getPlan().name()
                );
                
                subscription.setTransactionId(transactionId);
                subscription = subscriptionRepository.save(subscription);
                
                log.info("Pago procesado exitosamente: {}", transactionId);
            } catch (Exception e) {
                log.error("Error procesando pago para suscripción: {}", e.getMessage());
                subscription.setEstado(Estado.FALLIDA);
                subscriptionRepository.save(subscription);
                throw new RuntimeException("Error procesando el pago: " + e.getMessage());
            }
        }

        notificationService.enviarNotificacion(
                usuarioId,
                "Suscripción Activada",
                "Tu plan " + request.getPlan() + " ha sido activado exitosamente",
                Map.of("tipo", "SUSCRIPCION_ACTIVADA"),
                null
        );

        log.info("Suscripción creada: {} para usuario {}", subscription.getId(), usuarioId);
        return mapToResponse(subscription);
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
                if (sub.getPlan().equals(PlanType.BASICO)) {
                    renovarAutomaticamente(sub);
                } else {
                    boolean pagoExitoso = procesarPagoRecurrente(sub);
                    if (pagoExitoso) {
                        renovarAutomaticamente(sub);
                    } else {
                        sub.setEstado(Estado.PENDIENTE_PAGO);
                        subscriptionRepository.save(sub);
                    }
                }
            } catch (Exception e) {
                log.error("Error renovando suscripción {}: {}", sub.getId(), e.getMessage());
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

    public SubscriptionDTO.Response obtenerSuscripcionActual(Long usuarioId) {
        Subscription subscription = subscriptionRepository.findByUsuarioIdAndEstado(usuarioId, Estado.ACTIVA)
                .orElseThrow(() -> new NotFoundException("No hay suscripción activa"));
        return mapToResponse(subscription);
    }

    public List<SubscriptionDTO.PlanInfo> obtenerPlanes() {
        return List.of(
                new SubscriptionDTO.PlanInfo(
                        PlanType.BASICO,
                        BigDecimal.ZERO,
                        List.of("Solicitudes básicas", "5 solicitudes/mes", "Soporte por email")
                ),
                new SubscriptionDTO.PlanInfo(
                        PlanType.PRO,
                        new BigDecimal("19.99"),
                        List.of("Solicitudes ilimitadas", "Prioridad en listado", "Sin comisiones extra", "Soporte prioritario")
                ),
                new SubscriptionDTO.PlanInfo(
                        PlanType.ENTERPRISE,
                        new BigDecimal("49.99"),
                        List.of("Todo PRO", "Analytics avanzado", "API access", "Soporte 24/7", "Cuenta manager dedicado")
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
