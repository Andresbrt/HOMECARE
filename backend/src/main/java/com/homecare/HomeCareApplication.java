package com.homecare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * HOMECARE - Plataforma de Servicios de Limpieza
 * Modelo inDriver: Ofertas competitivas, elección manual del cliente
 *
 * @author HOMECARE Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableAsync
@EnableAspectJAutoProxy   // Activa los aspectos AOP (RolValidacionAspect, etc.)
public class HomeCareApplication {

    public static void main(String[] args) {
        SpringApplication.run(HomeCareApplication.class, args);
        System.out.println("\n" +
            "╔═══════════════════════════════════════════════════════════╗\n" +
            "║                                                           ║\n" +
            "║              🏠 HOMECARE API INICIADA                     ║\n" +
            "║                                                           ║\n" +
            "║  Modelo: inDriver (Ofertas Competitivas)                 ║\n" +
            "║  Swagger: http://localhost:8090/swagger-ui/index.html   ║\n" +
            "║  Health:  http://localhost:8090/api/test/health         ║\n" +
            "║  H2 DB:   http://localhost:8090/h2-console              ║\n" +
            "║                                                           ║\n" +
            "╚═══════════════════════════════════════════════════════════╝\n"
        );
    }
}
