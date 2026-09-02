package com.homecare.performance;

import com.homecare.domain.user.model.Rol;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.RolRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.domain.user.service.AuthService;
import com.homecare.dto.AuthDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
public class StressLoadPerformanceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final int CONCURRENT_THREADS = 100;
    private static final int TOTAL_REQUESTS = 1000;

    @BeforeEach
    void setUp() {
        if (rolRepository.findByNombre("ROLE_CUSTOMER").isEmpty()) {
            Rol r = new Rol();
            r.setNombre("ROLE_CUSTOMER");
            rolRepository.save(r);
        }
        if (usuarioRepository.findByEmail("stress_benchmark@homecare.works").isEmpty()) {
            Usuario u = new Usuario();
            u.setEmail("stress_benchmark@homecare.works");
            u.setPassword(passwordEncoder.encode("Password123!"));
            u.setNombre("Benchmark");
            u.setApellido("Stress");
            u.setTelefono("3000000000");
            u.setActivo(true);
            u.setVerificado(true);
            u.setRoles(Set.of(rolRepository.findByNombre("ROLE_CUSTOMER").get()));
            usuarioRepository.save(u);
        }
    }

    @Test
    @DisplayName("Prueba de Estrés Concurrente: 500 peticiones de autenticación en 50 hilos paralelos")
    void testAuthStressUnderHighConcurrency() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_THREADS);
        CountDownLatch readyLatch = new CountDownLatch(CONCURRENT_THREADS);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(TOTAL_REQUESTS);

        AtomicInteger successfulRequests = new AtomicInteger(0);
        AtomicInteger failedRequests = new AtomicInteger(0);
        List<Long> latencies = new CopyOnWriteArrayList<>();

        long globalStart = System.currentTimeMillis();

        for (int i = 0; i < TOTAL_REQUESTS; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await(); // Todos los hilos se disparan al mismo instante
                    long reqStart = System.currentTimeMillis();

                    AuthDTO.LoginResponse res = authService.login("stress_benchmark@homecare.works", "Password123!");
                    long duration = System.currentTimeMillis() - reqStart;
                    latencies.add(duration);

                    if (res != null && res.getToken() != null) {
                        successfulRequests.incrementAndGet();
                    } else {
                        failedRequests.incrementAndGet();
                    }
                } catch (Exception e) {
                    failedRequests.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // DISPARO DE RÁFAGA CONCURRENTE
        boolean completed = doneLatch.await(30, TimeUnit.SECONDS);

        long globalEnd = System.currentTimeMillis();
        executor.shutdown();

        long totalTime = globalEnd - globalStart;
        double throughput = (successfulRequests.get() * 1000.0) / totalTime;

        Collections.sort(latencies);
        long p50 = latencies.isEmpty() ? 0 : latencies.get((int) (latencies.size() * 0.50));
        long p95 = latencies.isEmpty() ? 0 : latencies.get((int) (latencies.size() * 0.95));
        long p99 = latencies.isEmpty() ? 0 : latencies.get((int) (latencies.size() * 0.99));
        double avg = latencies.stream().mapToLong(Long::longValue).average().orElse(0.0);

        System.out.println("=========================================================");
        System.out.println("🚀 RESULTADOS DE LA PRUEBA DE ESTRÉS (ALTA CONCURRENCIA)");
        System.out.println("=========================================================");
        System.out.println(String.format("• Hilos concurrentes:        %d", CONCURRENT_THREADS));
        System.out.println(String.format("• Peticiones totales:        %d", TOTAL_REQUESTS));
        System.out.println(String.format("• Peticiones exitosas:       %d (%.2f%%)", successfulRequests.get(), (successfulRequests.get() * 100.0) / TOTAL_REQUESTS));
        System.out.println(String.format("• Peticiones fallidas:       %d", failedRequests.get()));
        System.out.println(String.format("• Tiempo total de ejecución: %d ms", totalTime));
        System.out.println(String.format("• Throughput (RPS):          %.2f req/seg", throughput));
        System.out.println(String.format("• Latencia promedio:         %.2f ms", avg));
        System.out.println(String.format("• Latencia P50 (Mediana):    %d ms", p50));
        System.out.println(String.format("• Latencia P95:              %d ms", p95));
        System.out.println(String.format("• Latencia P99:              %d ms", p99));
        System.out.println("=========================================================");

        assertTrue(completed, "La prueba debe completarse en menos de 30 segundos");
        assertTrue(successfulRequests.get() > (TOTAL_REQUESTS * 0.95), "La tasa de éxito debe ser superior al 95%");
    }
}
