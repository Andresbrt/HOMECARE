package com.homecare.domain.solicitud.controller;

import com.homecare.domain.solicitud.model.Solicitud;
import com.homecare.domain.solicitud.model.Solicitud.EstadoSolicitud;
import com.homecare.domain.solicitud.model.Solicitud.TipoLimpieza;
import com.homecare.domain.solicitud.repository.SolicitudRepository;
import com.homecare.domain.user.model.Rol;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.RolRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("SolicitudController — integración")
class SolicitudControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SolicitudRepository solicitudRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    private Usuario cliente;
    private Usuario proveedor;

    @BeforeEach
    void setUp() {
        Rol rolProveedor = getOrCreateRol("ROLE_SERVICE_PROVIDER", "Proveedor de servicios");
        Rol rolCliente = getOrCreateRol("ROLE_CUSTOMER", "Cliente de la plataforma");

        cliente = usuarioRepository.save(Usuario.builder()
                .email("cliente-solicitudes@test.com")
                .password("pass")
                .nombre("Cliente")
                .apellido("Prueba")
                .activo(true)
                .verificado(true)
                .roles(new HashSet<>(Set.of(rolCliente)))
                .build());

        proveedor = usuarioRepository.save(Usuario.builder()
                .email("proveedor-solicitudes@test.com")
                .password("pass")
                .nombre("Proveedor")
                .apellido("Prueba")
                .activo(true)
                .verificado(true)
                .roles(new HashSet<>(Set.of(rolProveedor)))
                .build());
    }

    @Test
    @DisplayName("GET /api/solicitudes/cercanas sin coordenadas devuelve solo solicitudes abiertas")
    void obtenerSolicitudesCercanas_withoutCoordinates_returnsOpenSolicitudes() throws Exception {
        crearSolicitud(EstadoSolicitud.ABIERTA, new BigDecimal("4.600000"), new BigDecimal("-74.070000"), "Cercana ABIERTA");
        crearSolicitud(EstadoSolicitud.CANCELADA, new BigDecimal("4.600000"), new BigDecimal("-74.070000"), "Cercana CANCELADA");

        mockMvc.perform(get("/api/solicitudes/cercanas")
                        .param("page", "0")
                        .param("size", "10")
                        .with(user(buildUserDetails()))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].estado").value("ABIERTA"))
                .andExpect(jsonPath("$.content[0].titulo").value("Cercana ABIERTA"));
    }

    @Test
    @DisplayName("GET /api/solicitudes/cercanas con coordenadas devuelve solo las solicitudes cercanas")
    void obtenerSolicitudesCercanas_withCoordinates_returnsNearbySolicitudes() throws Exception {
        crearSolicitud(EstadoSolicitud.ABIERTA, new BigDecimal("4.600000"), new BigDecimal("-74.070000"), "Cercana");
        crearSolicitud(EstadoSolicitud.ABIERTA, new BigDecimal("5.600000"), new BigDecimal("-75.070000"), "Lejana");

        mockMvc.perform(get("/api/solicitudes/cercanas")
                        .param("latitud", "4.600000")
                        .param("longitud", "-74.070000")
                        .param("radioKm", "5")
                        .param("page", "0")
                        .param("size", "10")
                        .with(user(buildUserDetails()))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].titulo").value("Cercana"));
    }

    @Test
    @DisplayName("GET /api/solicitudes/cercanas cuando el proveedor está desconectado retorna vacío")
    void obtenerSolicitudesCercanas_unavailableProvider_returnsEmpty() throws Exception {
        proveedor.setDisponible(false);
        usuarioRepository.save(proveedor);
        crearSolicitud(EstadoSolicitud.ABIERTA, new BigDecimal("4.600000"), new BigDecimal("-74.070000"), "Cercana");

        mockMvc.perform(get("/api/solicitudes/cercanas")
                        .param("latitud", "4.600000")
                        .param("longitud", "-74.070000")
                        .param("radioKm", "5")
                        .param("page", "0")
                        .param("size", "10")
                        .with(user(buildUserDetails()))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    private Rol getOrCreateRol(String nombre, String descripcion) {
        return rolRepository.findByNombre(nombre)
                .orElseGet(() -> rolRepository.save(Rol.builder()
                        .nombre(nombre)
                        .descripcion(descripcion)
                        .build()));
    }

    private CustomUserDetails buildUserDetails() {
        return new CustomUserDetails(
                proveedor.getId(),
                proveedor.getEmail(),
                proveedor.getPassword(),
                proveedor.getNombre(),
                proveedor.getApellido(),
                proveedor.getActivo(),
                proveedor.getVerificado(),
                proveedor.getSupabaseUid(),
                proveedor.getRoles().stream()
                        .map(rol -> new org.springframework.security.core.authority.SimpleGrantedAuthority(rol.getNombre()))
                        .toList()
        );
    }

    private Solicitud crearSolicitud(EstadoSolicitud estado, BigDecimal latitud, BigDecimal longitud, String titulo) {
        Solicitud solicitud = Solicitud.builder()
                .cliente(cliente)
                .titulo(titulo)
                .descripcion("Solicitud de prueba")
                .tipoLimpieza(TipoLimpieza.BASICA)
                .direccion("Calle 123")
                .latitud(latitud)
                .longitud(longitud)
                .fechaServicio(LocalDate.now().plusDays(1))
                .horaInicio(LocalTime.of(9, 0))
                .estado(estado)
                .cantidadOfertas(0)
                .build();
        return solicitudRepository.save(solicitud);
    }
}
