package com.homecare.domain.offer.service;

import com.homecare.domain.offer.model.Oferta;
import com.homecare.domain.offer.repository.OfertaRepository;
import com.homecare.dto.OfertaDTO;
import com.homecare.domain.solicitud.model.Solicitud;
import com.homecare.domain.solicitud.model.Solicitud.EstadoSolicitud;
import com.homecare.domain.solicitud.model.Solicitud.TipoLimpieza;
import com.homecare.domain.solicitud.repository.SolicitudRepository;
import com.homecare.domain.user.model.Rol;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.RolRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.common.exception.ForbiddenBusinessException;
import com.homecare.security.RolValidacionAspect;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("OfertaService — integración")
class OfertaServiceIntegrationTest {

    @Autowired
    private OfertaService ofertaService;

    @Autowired
    private OfertaRepository ofertaRepository;

    @Autowired
    private SolicitudRepository solicitudRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    private Usuario cliente;
    private Usuario proveedor;
    private Rol rolProveedor;
    private Rol rolCliente;

    @BeforeEach
    void setUp() {
        rolProveedor = getOrCreateRol("ROLE_SERVICE_PROVIDER", "Proveedor de servicios");
        rolCliente = getOrCreateRol("ROLE_CUSTOMER", "Cliente de la plataforma");

        cliente = usuarioRepository.save(Usuario.builder()
                .email("cliente-oferta@test.com")
                .password("pass")
                .nombre("Cliente")
                .apellido("Oferta")
                .activo(true)
                .verificado(true)
                .roles(new HashSet<>(Set.of(rolCliente)))
                .build());

        proveedor = usuarioRepository.save(Usuario.builder()
                .email("proveedor-oferta@test.com")
                .password("pass")
                .nombre("Proveedor")
                .apellido("Oferta")
                .activo(true)
                .verificado(false)
                .roles(new HashSet<>(Set.of(rolProveedor)))
                .build());
    }

    private Rol getOrCreateRol(String nombre, String descripcion) {
        return rolRepository.findByNombre(nombre)
                .orElseGet(() -> rolRepository.save(Rol.builder()
                        .nombre(nombre)
                        .descripcion(descripcion)
                        .build()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Proveedor no verificado no puede enviar oferta")
    void unverifiedProviderCannotSubmitOffer() {
        Solicitud solicitud = createSolicitud();

        setSecurityContextAsProvider();

        OfertaDTO.Crear request = new OfertaDTO.Crear();
        request.setSolicitudId(solicitud.getId());
        request.setPrecioOfrecido(new BigDecimal("75000"));
        request.setMensajeOferta("Oferta no verificado");
        request.setTiempoEstimadoHoras(2);

        assertThatThrownBy(() -> ofertaService.enviarOferta(proveedor.getId(), request))
                .isInstanceOf(ForbiddenBusinessException.class)
                .hasMessageContaining("no ha sido verificada");
    }

    @Test
    @DisplayName("Proveedor verificado puede enviar oferta exitosamente")
    void verifiedProviderCanSubmitOffer() {
        proveedor.setVerificado(true);
        proveedor = usuarioRepository.save(proveedor);

        Solicitud solicitud = createSolicitud();

        setSecurityContextAsProvider();

        OfertaDTO.Crear request = new OfertaDTO.Crear();
        request.setSolicitudId(solicitud.getId());
        request.setPrecioOfrecido(new BigDecimal("75000"));
        request.setMensajeOferta("Oferta verificado");
        request.setTiempoEstimadoHoras(2);

        OfertaDTO.Response response = ofertaService.enviarOferta(proveedor.getId(), request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isNotNull();
        assertThat(response.getEstado()).isEqualTo(Oferta.EstadoOferta.PENDIENTE.name());
        assertThat(ofertaRepository.findById(response.getId())).isPresent();
    }

    private Solicitud createSolicitud() {
        Solicitud solicitud = Solicitud.builder()
                .cliente(cliente)
                .titulo("Solicitud oferta")
                .descripcion("Solicitud para prueba de oferta")
                .tipoLimpieza(TipoLimpieza.BASICA)
                .direccion("Carrera 1")
                .latitud(new BigDecimal("4.624335"))
                .longitud(new BigDecimal("-74.063644"))
                .fechaServicio(LocalDate.now().plusDays(2))
                .horaInicio(LocalTime.of(8, 30))
                .estado(EstadoSolicitud.ABIERTA)
                .build();
        return solicitudRepository.save(solicitud);
    }

    private void setSecurityContextAsProvider() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        proveedor.getEmail(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_SERVICE_PROVIDER"))
                )
        );
    }
}
