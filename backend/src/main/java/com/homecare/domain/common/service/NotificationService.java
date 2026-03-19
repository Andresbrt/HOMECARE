package com.homecare.domain.common.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.*;
import com.homecare.dto.NotificationDTO;
import com.homecare.common.exception.NotificationException;
import com.homecare.model.DispositivoFCM;
import com.homecare.model.Notificacion;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.common.repository.DispositivoFCMRepository;
import com.homecare.domain.common.repository.NotificacionRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class NotificationService {

    private final DispositivoFCMRepository dispositivoRepository;
    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;

    @Value("${firebase.credentials-path}")
    private String firebaseCredentialsPath;

    private volatile boolean firebaseDisponible = false;

    public NotificationService(DispositivoFCMRepository dispositivoRepository,
                               NotificacionRepository notificacionRepository,
                               UsuarioRepository usuarioRepository) {
        this.dispositivoRepository = dispositivoRepository;
        this.notificacionRepository = notificacionRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @PostConstruct
    public void initialize() {
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                firebaseDisponible = true;
                return;
            }

            try (InputStream serviceAccount = obtenerCredencialesFirebase()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                FirebaseApp.initializeApp(options);
                firebaseDisponible = true;
                log.info("Firebase inicializado correctamente");
            }
        } catch (Exception e) {
            firebaseDisponible = false;
            log.warn("Firebase deshabilitado para este entorno: {}", e.getMessage());
        }
    }

    private InputStream obtenerCredencialesFirebase() throws IOException {
        // Priority 1: JSON content directly from environment variable
        String jsonContent = System.getenv("FIREBASE_CREDENTIALS_JSON");
        if (jsonContent != null && !jsonContent.isBlank()) {
            log.info("Firebase credentials loaded from FIREBASE_CREDENTIALS_JSON env var");
            return new ByteArrayInputStream(jsonContent.getBytes(StandardCharsets.UTF_8));
        }

        // Priority 2: File path from config (filesystem or classpath)
        if (firebaseCredentialsPath == null || firebaseCredentialsPath.isBlank()) {
            throw new IOException("No Firebase credentials: set FIREBASE_CREDENTIALS_JSON or firebase.credentials-path");
        }

        if (firebaseCredentialsPath.startsWith("classpath:")) {
            String recurso = firebaseCredentialsPath.substring("classpath:".length());
            InputStream in = NotificationService.class.getClassLoader().getResourceAsStream(recurso);
            if (in == null) {
                throw new IOException("No se encontro recurso en classpath: " + recurso);
            }
            return in;
        }

        return new FileInputStream(firebaseCredentialsPath);
    }

    @Transactional
    public void registrarDispositivo(Long usuarioId, NotificationDTO.RegisterDevice request) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotificationException("Usuario no encontrado"));

        Optional<DispositivoFCM> existente = dispositivoRepository.findByTokenFcm(request.getTokenFcm());

        if (existente.isPresent()) {
            DispositivoFCM dispositivo = existente.get();
            dispositivo.setUsuario(usuario);
            dispositivo.setPlataforma(request.getPlataforma());
            dispositivo.setModeloDispositivo(request.getModeloDispositivo());
            dispositivo.setVersionApp(request.getVersionApp());
            dispositivo.setActivo(true);
            dispositivo.setUltimoUso(LocalDateTime.now());
            dispositivoRepository.save(dispositivo);
            log.info("Token FCM actualizado para usuario {}", usuarioId);
        } else {
            DispositivoFCM nuevoDispositivo = new DispositivoFCM();
            nuevoDispositivo.setUsuario(usuario);
            nuevoDispositivo.setTokenFcm(request.getTokenFcm());
            nuevoDispositivo.setPlataforma(request.getPlataforma());
            nuevoDispositivo.setModeloDispositivo(request.getModeloDispositivo());
            nuevoDispositivo.setVersionApp(request.getVersionApp());
            nuevoDispositivo.setActivo(true);
            dispositivoRepository.save(nuevoDispositivo);
            log.info("Nuevo token FCM registrado para usuario {}", usuarioId);
        }
    }

    @Transactional
    public void desregistrarDispositivo(String tokenFcm) {
        dispositivoRepository.desactivarPorToken(tokenFcm);
        log.info("Token FCM desactivado: {}", tokenFcm);
    }

    @Async
    @Transactional
    public void enviarNotificacion(Long usuarioId, String titulo, String cuerpo,
                                    Map<String, String> data, String imageUrl) {
        try {
            if (!firebaseDisponible) {
                log.warn("Firebase no disponible; se omite envio push para usuario {}", usuarioId);
                guardarNotificacionBD(usuarioId, titulo, cuerpo, data);
                return;
            }
            List<DispositivoFCM> dispositivos = dispositivoRepository.findByUsuarioIdAndActivoTrue(usuarioId);

            if (dispositivos.isEmpty()) {
                log.warn("Usuario {} no tiene dispositivos registrados", usuarioId);
                return;
            }

            guardarNotificacionBD(usuarioId, titulo, cuerpo, data);

            List<String> tokens = dispositivos.stream()
                    .map(DispositivoFCM::getTokenFcm)
                    .collect(Collectors.toList());

            MulticastMessage message = buildMulticastMessage(titulo, cuerpo, data, imageUrl, tokens);

            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);

            procesarRespuestaFCM(response, dispositivos);

            log.info("NotificaciÃ³n enviada a usuario {}: {}/{} exitosas",
                    usuarioId, response.getSuccessCount(), tokens.size());

        } catch (Exception e) {
            log.error("Error al enviar notificaciÃ³n a usuario {}: {}", usuarioId, e.getMessage(), e);
        }
    }

    @Async
    @Transactional
    public NotificationDTO.Response enviarNotificacionBroadcast(String titulo, String cuerpo,
                                                                 Map<String, String> data,
                                                                 String imageUrl, String rol) {
        try {
            if (!firebaseDisponible) {
                log.warn("Firebase no disponible; se omite envio broadcast push");
                return new NotificationDTO.Response(false, "Firebase no disponible", 0, 0);
            }
            List<DispositivoFCM> dispositivos;

            if ("ALL".equals(rol)) {
                dispositivos = dispositivoRepository.findAll().stream()
                        .filter(DispositivoFCM::getActivo)
                        .collect(Collectors.toList());
            } else {
                dispositivos = dispositivoRepository.findByRol("ROLE_" + rol);
            }

            if (dispositivos.isEmpty()) {
                return new NotificationDTO.Response(false, "No hay dispositivos para enviar", 0, 0);
            }

            dispositivos.forEach(d -> guardarNotificacionBD(
                    d.getUsuario().getId(), titulo, cuerpo, data));

            List<String> tokens = dispositivos.stream()
                    .map(DispositivoFCM::getTokenFcm)
                    .collect(Collectors.toList());

            int totalEnviadas = 0;
            int totalFallidas = 0;

            for (int i = 0; i < tokens.size(); i += 500) {
                List<String> batch = tokens.subList(i, Math.min(i + 500, tokens.size()));
                MulticastMessage message = buildMulticastMessage(titulo, cuerpo, data, imageUrl, batch);

                BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
                totalEnviadas += response.getSuccessCount();
                totalFallidas += response.getFailureCount();

                procesarRespuestaFCM(response, dispositivos.subList(i, Math.min(i + 500, dispositivos.size())));
            }

            log.info("NotificaciÃ³n broadcast enviada: {}/{} exitosas", totalEnviadas, tokens.size());

            return new NotificationDTO.Response(
                    true,
                    "NotificaciÃ³n enviada",
                    totalEnviadas,
                    totalFallidas
            );

        } catch (Exception e) {
            log.error("Error al enviar notificaciÃ³n broadcast: {}", e.getMessage(), e);
            return new NotificationDTO.Response(false, "Error: " + e.getMessage(), 0, 0);
        }
    }

    public void notificarNuevaSolicitud(Long solicitudId, Long clienteId, String descripcion) {
        Map<String, String> data = new HashMap<>();
        data.put("tipo", "NUEVA_SOLICITUD");
        data.put("solicitudId", solicitudId.toString());
        data.put("action", "VER_SOLICITUD");

        enviarNotificacionBroadcast(
                "Nueva solicitud disponible",
                descripcion,
                data,
                null,
                "SERVICE_PROVIDER"
        );
    }

    public void notificarNuevaOferta(Long solicitudId, Long clienteId, String proveedorNombre, Double precio) {
        Map<String, String> data = new HashMap<>();
        data.put("tipo", "NUEVA_OFERTA");
        data.put("solicitudId", solicitudId.toString());
        data.put("action", "VER_OFERTAS");

        enviarNotificacion(
                clienteId,
                "Nueva oferta recibida",
                proveedorNombre + " ha enviado una oferta de $" + precio,
                data,
                null
        );
    }

    public void sendPasswordResetEmail(String email, String token) {
        log.info("Simulando envÃ­o de email de recuperaciÃ³n para {}: {}", email, token);
        // ImplementaciÃ³n real de SMTP/SendGrid aquÃ­
    }

    public void notificarOfertaAceptada(Long ofertaId, Long proveedorId, String clienteNombre) {
        Map<String, String> data = new HashMap<>();
        data.put("tipo", "OFERTA_ACEPTADA");
        data.put("ofertaId", ofertaId.toString());
        data.put("action", "VER_SERVICIO");

        enviarNotificacion(
                proveedorId,
                "Â¡Tu oferta fue aceptada!",
                clienteNombre + " aceptÃ³ tu oferta. PrepÃ¡rate para el servicio.",
                data,
                null
        );
    }

    public void notificarCambioEstadoServicio(Long servicioId, Long usuarioId, String estado) {
        Map<String, String> data = new HashMap<>();
        data.put("tipo", "CAMBIO_ESTADO");
        data.put("servicioId", servicioId.toString());
        data.put("estado", estado);
        data.put("action", "VER_SERVICIO");

        String mensaje = switch (estado) {
            case "EN_CAMINO" -> "El proveedor estÃ¡ en camino";
            case "LLEGUE" -> "El proveedor ha llegado";
            case "EN_PROGRESO" -> "El servicio ha comenzado";
            case "COMPLETADO" -> "El servicio ha finalizado";
            default -> "Estado del servicio actualizado";
        };

        enviarNotificacion(usuarioId, "ActualizaciÃ³n del servicio", mensaje, data, null);
    }

    public void notificarNuevoMensaje(Long solicitudId, Long destinatarioId, String remitenteNombre, String mensaje) {
        Map<String, String> data = new HashMap<>();
        data.put("tipo", "NUEVO_MENSAJE");
        data.put("solicitudId", solicitudId.toString());
        data.put("action", "ABRIR_CHAT");

        enviarNotificacion(
                destinatarioId,
                "Nuevo mensaje de " + remitenteNombre,
                mensaje.length() > 50 ? mensaje.substring(0, 50) + "..." : mensaje,
                data,
                null
        );
    }

    public void notificarPagoExitoso(Long pagoId, Long usuarioId, Double monto) {
        Map<String, String> data = new HashMap<>();
        data.put("tipo", "PAGO_EXITOSO");
        data.put("pagoId", pagoId.toString());
        data.put("action", "VER_PAGO");

        enviarNotificacion(
                usuarioId,
                "Pago procesado",
                "Tu pago de $" + monto + " ha sido procesado exitosamente",
                data,
                null
        );
    }

    @Scheduled(cron = "0 0 3 * * ?") // 3 AM diariamente
    @Transactional
    public void limpiarDispositivosInactivos() {
        LocalDateTime fechaLimite = LocalDateTime.now().minusDays(90);
        List<DispositivoFCM> inactivos = dispositivoRepository.findDispositivosInactivos(fechaLimite);

        inactivos.forEach(d -> d.setActivo(false));
        dispositivoRepository.saveAll(inactivos);

        log.info("Dispositivos inactivos limpiados: {}", inactivos.size());
    }

    private MulticastMessage buildMulticastMessage(String titulo, String cuerpo,
                                                    Map<String, String> data,
                                                    String imageUrl,
                                                    List<String> tokens) {
        Notification.Builder notificationBuilder = Notification.builder()
                .setTitle(titulo)
                .setBody(cuerpo);

        if (imageUrl != null) {
            notificationBuilder.setImage(imageUrl);
        }

        MulticastMessage.Builder messageBuilder = MulticastMessage.builder()
                .setNotification(notificationBuilder.build())
                .addAllTokens(tokens);

        if (data != null && !data.isEmpty()) {
            messageBuilder.putAllData(data);
        }

        messageBuilder.setAndroidConfig(AndroidConfig.builder()
                .setPriority(AndroidConfig.Priority.HIGH)
                .setNotification(AndroidNotification.builder()
                        .setSound("default")
                        .setChannelId("homecare_default")
                        .build())
                .build());

        messageBuilder.setApnsConfig(ApnsConfig.builder()
                .setAps(Aps.builder()
                        .setSound("default")
                        .setBadge(1)
                        .build())
                .build());

        return messageBuilder.build();
    }

    private void procesarRespuestaFCM(BatchResponse response, List<DispositivoFCM> dispositivos) {
        if (response.getFailureCount() > 0) {
            List<SendResponse> responses = response.getResponses();
            for (int i = 0; i < responses.size(); i++) {
                SendResponse sr = responses.get(i);
                if (!sr.isSuccessful()) {
                    String errorCode = sr.getException() != null ?
                            sr.getException().getMessagingErrorCode().toString() : "UNKNOWN";

                    if ("INVALID_ARGUMENT".equals(errorCode) ||
                        "UNREGISTERED".equals(errorCode) ||
                        "NOT_FOUND".equals(errorCode)) {
                        DispositivoFCM dispositivo = dispositivos.get(i);
                        dispositivo.setActivo(false);
                        dispositivoRepository.save(dispositivo);
                        log.info("Token FCM invÃ¡lido desactivado: {}", dispositivo.getTokenFcm());
                    }
                }
            }
        }
    }

    private void guardarNotificacionBD(Long usuarioId, String titulo, String mensaje,
                                        Map<String, String> data) {
        try {
            Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
            if (usuario == null) return;

            Notificacion notificacion = new Notificacion();
            notificacion.setUsuario(usuario);
            notificacion.setTitulo(titulo);
            notificacion.setMensaje(mensaje);
            notificacion.setTipo(data != null ? data.get("tipo") : "GENERAL");
            notificacion.setLeida(false);

            notificacionRepository.save(notificacion);
        } catch (Exception e) {
            log.error("Error al guardar notificaciÃ³n en BD: {}", e.getMessage());
        }
    }
}

