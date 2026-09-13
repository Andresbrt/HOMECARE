package com.homecare.config;

import com.homecare.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

/**
 * Configuración de WebSocket para chat en tiempo real
 * Permite comunicación bidireccional entre cliente y proveedor
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Prefijo para mensajes desde el servidor hacia clientes suscritos
        config.enableSimpleBroker("/topic", "/queue");
        
        // Prefijo para mensajes desde el cliente hacia el servidor
        config.setApplicationDestinationPrefixes("/app");
        
        // Prefijo para mensajes de usuario específico (punto a punto)
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(64 * 1024); // 64 KB máximo por mensaje
        registration.setSendBufferSizeLimit(512 * 1024); // 512 KB buffer
        registration.setSendTimeLimit(20 * 1000); // 20 segundos
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint de conexión WebSocket con SockJS fallback
        registry.addEndpoint("/ws")
                .setAllowedOrigins(
                        "http://localhost:3000",
                        "http://localhost:19006",
                        "http://localhost:19000",
                        "http://localhost:8081"
                )
                .withSockJS();
        
        // Endpoint sin SockJS para clientes nativos (React Native)
        registry.addEndpoint("/ws")
                .setAllowedOrigins(
                        "http://localhost:3000",
                        "http://localhost:19006",
                        "http://localhost:19000",
                        "http://localhost:8081"
                );
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) return message;
                
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authToken = accessor.getFirstNativeHeader("Authorization");
                    
                    if (authToken != null && authToken.startsWith("Bearer ")) {
                        String token = authToken.substring(7);
                        try {
                            if (jwtTokenProvider.validateToken(token)) {
                                String username = jwtTokenProvider.getEmailFromToken(token);
                                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                                
                                UsernamePasswordAuthenticationToken authentication = 
                                    new UsernamePasswordAuthenticationToken(
                                        userDetails.getUsername(), 
                                        null, 
                                        userDetails.getAuthorities()
                                    );
                                
                                SecurityContextHolder.getContext().setAuthentication(authentication);
                                accessor.setUser(authentication);
                                log.debug("WebSocket STOMP conectado exitosamente para: {}", username);
                            } else {
                                log.warn("SECURITY ALERT | Intento de conexión STOMP con token inválido");
                                throw new AccessDeniedException("Token JWT inválido o expirado para WebSocket");
                            }
                        } catch (Exception e) {
                            log.warn("SECURITY ALERT | Error autenticando conexión STOMP: {}", e.getMessage());
                            throw new AccessDeniedException("Autenticación WebSocket rechazada");
                        }
                    } else {
                        log.warn("SECURITY ALERT | Conexión STOMP rechazada sin cabecera Authorization Bearer");
                        throw new AccessDeniedException("Cabecera Authorization Bearer requerida");
                    }
                } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    if (accessor.getUser() == null) {
                        log.warn("SECURITY ALERT | Suscripción STOMP rechazada para usuario anónimo en {}", accessor.getDestination());
                        throw new AccessDeniedException("Se requiere autenticación para suscribirse");
                    }
                }
                
                return message;
            }
        });
    }
}
