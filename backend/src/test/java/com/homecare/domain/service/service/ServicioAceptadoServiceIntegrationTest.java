package com.homecare.domain.service.service;

import com.homecare.domain.offer.model.Oferta;
import com.homecare.domain.offer.repository.OfertaRepository;
import com.homecare.domain.service.model.EvidenciaServicio;
import com.homecare.domain.service.model.EvidenciaServicio.TipoEvidencia;
import com.homecare.domain.service_order.repository.ServicioAceptadoRepository;
import com.homecare.domain.solicitud.model.Solicitud;
import com.homecare.domain.solicitud.model.Solicitud.EstadoSolicitud;
import com.homecare.domain.solicitud.model.Solicitud.TipoLimpieza;
import com.homecare.domain.solicitud.repository.SolicitudRepository;
import com.homecare.domain.user.model.Rol;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.RolRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.model.ServicioAceptado;
import com.homecare.common.exception.ConflictBusinessException;
import com.homecare.domain.service.repository.EvidenciaServicioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("ServicioAceptadoService — integración")
class ServicioAceptadoServiceIntegrationTest {

    @Autowired
    private ServicioAceptadoService servicioAceptadoService;

    @Autowired
    private ServicioAceptadoRepository servicioRepository;

    @Autowired
    private SolicitudRepository solicitudRepository;

    @Autowired
    private OfertaRepository ofertaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private EvidenciaServicioRepository evidenciaRepository;

    private Usuario cliente;
    private Usuario proveedor;
    private Rol rolProveedor;
    private Rol rolCliente;

    @BeforeEach
    void setUp() {
        rolProveedor = getOrCreateRol("ROLE_SERVICE_PROVIDER", "Proveedor de servicios");
        rolCliente = getOrCreateRol("ROLE_CUSTOMER", "Cliente de la plataforma");

        cliente = usuarioRepository.save(Usuario.builder()
                .email("cliente-servicio@test.com")
                .password("pass")
                .nombre("Cliente")
                .apellido("Servicio")
                .activo(true)
                .verificado(true)
                .roles(new HashSet<>(Set.of(rolCliente)))
                .build());

        proveedor = usuarioRepository.save(Usuario.builder()
                .email("proveedor-servicio@test.com")
                .password("pass")
                .nombre("Proveedor")
                .apellido("Servicio")
                .activo(true)
                .verificado(true)
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

    @Test
    @DisplayName("No se puede completar servicio sin evidencia DESPUES")
    void cannotCompleteServiceWithoutAfterEvidence() {
        ServicioAceptado servicio = createServicioEnProgreso();

        assertThatThrownBy(() -> servicioAceptadoService.actualizarEstado(
                servicio.getId(), proveedor.getId(), ServicioAceptado.EstadoServicio.COMPLETADO))
                .isInstanceOf(ConflictBusinessException.class)
                .hasMessageContaining("sin al menos una evidencia de tipo DESPUES");

        ServicioAceptado reloaded = servicioRepository.findById(servicio.getId()).orElseThrow();
        assertThat(reloaded.getEstado()).isEqualTo(ServicioAceptado.EstadoServicio.EN_PROGRESO);
    }

    @Test
    @DisplayName("Completar servicio con evidencia DESPUES persiste el estado COMPLETADO")
    void completeServiceWithAfterEvidence() {
        ServicioAceptado servicio = createServicioEnProgreso();
        servicioAceptadoService.agregarEvidencia(
                servicio.getId(),
                proveedor.getId(),
                TipoEvidencia.DESPUES,
                "https://example.com/evidencia-despues.jpg",
                "Foto de finalización"
        );

        servicioAceptadoService.actualizarEstado(
                servicio.getId(), proveedor.getId(), ServicioAceptado.EstadoServicio.COMPLETADO);

        ServicioAceptado reloaded = servicioRepository.findById(servicio.getId()).orElseThrow();
        assertThat(reloaded.getEstado()).isEqualTo(ServicioAceptado.EstadoServicio.COMPLETADO);
        assertThat(evidenciaRepository.existsByServicioIdAndTipo(servicio.getId(), TipoEvidencia.DESPUES)).isTrue();
    }

    private ServicioAceptado createServicioEnProgreso() {
        Solicitud solicitud = Solicitud.builder()
                .cliente(cliente)
                .titulo("Servicio en progreso")
                .descripcion("Solicitud de prueba")
                .tipoLimpieza(TipoLimpieza.BASICA)
                .direccion("Calle 1")
                .latitud(new BigDecimal("4.624335"))
                .longitud(new BigDecimal("-74.063644"))
                .fechaServicio(LocalDate.now().plusDays(1))
                .horaInicio(LocalTime.of(10, 0))
                .estado(EstadoSolicitud.ABIERTA)
                .build();
        solicitud = solicitudRepository.save(solicitud);

        Oferta oferta = Oferta.builder()
                .solicitud(solicitud)
                .proveedor(proveedor)
                .precioOfrecido(new BigDecimal("80000"))
                .mensajeOferta("Oferta para servicio")
                .tiempoLlegadaMinutos(20)
                .estado(Oferta.EstadoOferta.ACEPTADA)
                .aceptadaAt(LocalDateTime.now())
                .build();
        oferta = ofertaRepository.save(oferta);

        solicitud.setEstado(EstadoSolicitud.ACEPTADA);
        solicitudRepository.save(solicitud);

        ServicioAceptado servicio = ServicioAceptado.builder()
                .solicitud(solicitud)
                .oferta(oferta)
                .cliente(cliente)
                .proveedor(proveedor)
                .precioAcordado(oferta.getPrecioOfrecido())
                .estado(ServicioAceptado.EstadoServicio.EN_PROGRESO)
                .build();
        return servicioRepository.save(servicio);
    }
}
