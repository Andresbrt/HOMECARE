package com.homecare.config;

import com.homecare.security.JwtAuthenticationEntryPoint;
import com.homecare.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configuración de Spring Security
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint unauthorizedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Endpoints públicos
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/actuator/prometheus").permitAll()
                        .requestMatchers("/actuator/**").hasRole("ADMIN")
                        
                        // Endpoints de cliente
                        .requestMatchers(HttpMethod.POST, "/api/solicitudes").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/solicitudes/mis-solicitudes").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/ofertas/solicitud/**").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.POST, "/api/ofertas/aceptar").hasRole("CUSTOMER")
                        
                        // Endpoints de proveedor
                        .requestMatchers(HttpMethod.GET, "/api/solicitudes/cercanas").hasRole("SERVICE_PROVIDER")
                        .requestMatchers(HttpMethod.POST, "/api/ofertas").hasRole("SERVICE_PROVIDER")
                        .requestMatchers(HttpMethod.GET, "/api/ofertas/mis-ofertas").hasRole("SERVICE_PROVIDER")
                        .requestMatchers(HttpMethod.PUT, "/api/servicios/*/estado").hasRole("SERVICE_PROVIDER")
                        
                        // Endpoints de admin
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        
                        // Todo lo demás requiere autenticación
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // setAllowedOriginPatterns soporta wildcards y es compatible con allowCredentials(true)
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://192.168.*.*",   // celular físico en red local
                "http://10.0.*.*",      // emulador Android
                "exp://*"               // protocolo Expo Go
        ));

        configuration.setAllowedMethods(
                Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        );
        configuration.setAllowedHeaders(
                Arrays.asList("Authorization", "Content-Type", "X-Requested-With")
        );
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
