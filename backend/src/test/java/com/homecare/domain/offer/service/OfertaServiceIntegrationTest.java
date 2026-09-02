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
import com.homecare.common.exception.ConflictBusinessException;
import com.homecare.common.exception.ForbiddenBusinessException;
import com.homecare.common.exception.UnauthorizedException;
import com.homecare.model.ServicioAceptado;
import com.homecare.domain.service_order.repository.ServicioAceptadoRepository;
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
    private ServicioAceptadoRepository servicioAceptadoRepository;

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

    @Test
    @DisplayName("Aceptar oferta: oferta pasa a ACEPTADA, solicitud pasa a ACEPTADA, otras ofertas a RECHAZADA y servicio creado")
    void aceptarOferta_exitoso_y_demasOfertasRechazadas() {
        proveedor.setVerificado(true);
        proveedor = usuarioRepository.save(proveedor);

        Usuario proveedor2 = usuarioRepository.save(Usuario.builder()
                .email("proveedor2-oferta@test.com")
                .password("pass")
                .nombre("Segundo")
                .apellido("Proveedor")
                .activo(true)
                .verificado(true)
                .roles(new HashSet<>(Set.of(rolProveedor)))
                .build());

        Solicitud solicitud = createSolicitud();

        setSecurityContextAsProvider();
        OfertaDTO.Crear req1 = new OfertaDTO.Crear();
        req1.setSolicitudId(solicitud.getId());
        req1.setPrecioOfrecido(new BigDecimal("70000"));
        req1.setTiempoEstimadoHoras(2);
        OfertaDTO.Response of1 = ofertaService.enviarOferta(proveedor.getId(), req1);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(proveedor2.getEmail(), null,
                        List.of(new SimpleGrantedAuthority("ROLE_SERVICE_PROVIDER")))
        );
        OfertaDTO.Crear req2 = new OfertaDTO.Crear();
        req2.setSolicitudId(solicitud.getId());
        req2.setPrecioOfrecido(new BigDecimal("80000"));
        req2.setTiempoEstimadoHoras(3);
        OfertaDTO.Response of2 = ofertaService.enviarOferta(proveedor2.getId(), req2);

        // Cliente acepta oferta 1
        OfertaDTO.AceptarResponse aceptarResp = ofertaService.aceptarOferta(of1.getId(), cliente.getId());
        assertThat(aceptarResp).isNotNull();
        assertThat(aceptarResp.getPrecioFinal()).isEqualByComparingTo(new BigDecimal("70000"));

        // Verificar estados en BD
        Oferta of1DB = ofertaRepository.findById(of1.getId()).orElseThrow();
        assertThat(of1DB.getEstado()).isEqualTo(Oferta.EstadoOferta.ACEPTADA);

        Oferta of2DB = ofertaRepository.findById(of2.getId()).orElseThrow();
        assertThat(of2DB.getEstado()).isEqualTo(Oferta.EstadoOferta.RECHAZADA);

        Solicitud solDB = solicitudRepository.findById(solicitud.getId()).orElseThrow();
        assertThat(solDB.getEstado()).isEqualTo(EstadoSolicitud.ACEPTADA);
        assertThat(solDB.getOfertaAceptadaId()).isEqualTo(of1.getId());

        List<ServicioAceptado> servicios = servicioAceptadoRepository.findByClienteIdOrderByCreatedAtDesc(cliente.getId());
        assertThat(servicios).isNotEmpty();
        assertThat(servicios.get(0).getPrecioAcordado()).isEqualByComparingTo(new BigDecimal("70000"));
        assertThat(servicios.get(0).getEstado()).isEqualTo(ServicioAceptado.EstadoServicio.CONFIRMADO);
    }

    @Test
    @DisplayName("Seguridad concurrencia: rechaza aceptar una segunda oferta cuando la solicitud ya fue aceptada")
    void aceptarOferta_rechazaSegundaAceptacion() {
        proveedor.setVerificado(true);
        proveedor = usuarioRepository.save(proveedor);

        Usuario proveedor2 = usuarioRepository.save(Usuario.builder()
                .email("proveedor2-oferta@test.com")
                .password("pass")
                .nombre("Segundo")
                .apellido("Proveedor")
                .activo(true)
                .verificado(true)
                .roles(new HashSet<>(Set.of(rolProveedor)))
                .build());

        Solicitud solicitud = createSolicitud();

        setSecurityContextAsProvider();
        OfertaDTO.Crear req1 = new OfertaDTO.Crear();
        req1.setSolicitudId(solicitud.getId());
        req1.setPrecioOfrecido(new BigDecimal("70000"));
        OfertaDTO.Response of1 = ofertaService.enviarOferta(proveedor.getId(), req1);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(proveedor2.getEmail(), null,
                        List.of(new SimpleGrantedAuthority("ROLE_SERVICE_PROVIDER")))
        );
        OfertaDTO.Crear req2 = new OfertaDTO.Crear();
        req2.setSolicitudId(solicitud.getId());
        req2.setPrecioOfrecido(new BigDecimal("80000"));
        OfertaDTO.Response of2 = ofertaService.enviarOferta(proveedor2.getId(), req2);

        // Cliente acepta oferta 1
        ofertaService.aceptarOferta(of1.getId(), cliente.getId());

        // Intentar aceptar oferta 2 inmediatamente después debe ser rechazado
        assertThatThrownBy(() -> ofertaService.aceptarOferta(of2.getId(), cliente.getId()))
                .isInstanceOf(ConflictBusinessException.class);
    }

    @Test
    @DisplayName("Proveedor retira oferta: no puede ser aceptada posteriormente")
    void retirarOferta_exitoso_y_noAceptable() {
        proveedor.setVerificado(true);
        proveedor = usuarioRepository.save(proveedor);

        Solicitud solicitud = createSolicitud();

        setSecurityContextAsProvider();
        OfertaDTO.Crear req = new OfertaDTO.Crear();
        req.setSolicitudId(solicitud.getId());
        req.setPrecioOfrecido(new BigDecimal("95000"));
        OfertaDTO.Response of = ofertaService.enviarOferta(proveedor.getId(), req);

        // Proveedor retira oferta
        ofertaService.retirarOferta(of.getId(), proveedor.getId());

        Oferta ofDB = ofertaRepository.findById(of.getId()).orElseThrow();
        assertThat(ofDB.getEstado()).isEqualTo(Oferta.EstadoOferta.RETIRADA);

        // Cliente intenta aceptar oferta retirada -> falla
        assertThatThrownBy(() -> ofertaService.aceptarOferta(of.getId(), cliente.getId()))
                .isInstanceOf(ConflictBusinessException.class)
                .hasMessageContaining("no está disponible");
    }

    @Test
    @DisplayName("Protección IDOR: cliente ajeno no puede aceptar ofertas de otra solicitud")
    void aceptarOferta_idorProtection() {
        proveedor.setVerificado(true);
        proveedor = usuarioRepository.save(proveedor);

        Usuario otroCliente = usuarioRepository.save(Usuario.builder()
                .email("otro-cliente@test.com")
                .password("pass")
                .nombre("Otro")
                .apellido("Cliente")
                .activo(true)
                .verificado(true)
                .roles(new HashSet<>(Set.of(rolCliente)))
                .build());

        Solicitud solicitud = createSolicitud();

        setSecurityContextAsProvider();
        OfertaDTO.Crear req = new OfertaDTO.Crear();
        req.setSolicitudId(solicitud.getId());
        req.setPrecioOfrecido(new BigDecimal("85000"));
        OfertaDTO.Response of = ofertaService.enviarOferta(proveedor.getId(), req);

        // Intentar aceptar con el ID de otro cliente -> 401/403 Unauthorized
        assertThatThrownBy(() -> ofertaService.aceptarOferta(of.getId(), otroCliente.getId()))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("No autorizado para aceptar esta oferta");
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
