package com.homecare.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de Swagger/OpenAPI
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "HOMECARE API",
                version = "1.0.0",
                description = "API REST para plataforma de servicios de limpieza doméstica. " +
                        "Modelo inDriver: Sistema de ofertas competitivas donde proveedores proponen su precio " +
                        "y el cliente elige manualmente la mejor oferta.",
                contact = @Contact(
                        name = "HOMECARE Team",
                        email = "contacto@homecare.com",
                        url = "https://homecare.com"
                ),
                license = @License(
                        name = "Proprietary",
                        url = "https://homecare.com/license"
                )
        ),
        servers = {
                @Server(url = "http://localhost:8090", description = "Servidor Local (Puerto 8090)"),
                @Server(url = "http://localhost:8083", description = "Servidor Local (Puerto 8083)"),
                @Server(url = "https://api.homecare.com", description = "Servidor de Producción")
        }
)
@SecurityScheme(
        name = "bearerAuth",
        description = "JWT Authentication",
        scheme = "bearer",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
}
