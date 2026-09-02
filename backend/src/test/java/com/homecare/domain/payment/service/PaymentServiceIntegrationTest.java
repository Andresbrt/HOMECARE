package com.homecare.domain.payment.service;

import com.homecare.common.exception.PaymentException;
import com.homecare.domain.payment.model.Pago;
import com.homecare.domain.payment.repository.PagoRepository;
import com.homecare.domain.service.model.ConformidadCliente;
import com.homecare.domain.service.model.Disputa;
import com.homecare.domain.service.repository.ConformidadClienteRepository;
import com.homecare.domain.service.repository.DisputaRepository;
import com.homecare.domain.service_order.repository.ServicioAceptadoRepository;
import com.homecare.domain.solicitud.model.Solicitud;
import com.homecare.domain.solicitud.model.Solicitud.TipoLimpieza;
import com.homecare.domain.solicitud.model.Solicitud.EstadoSolicitud;
import com.homecare.domain.solicitud.repository.SolicitudRepository;
import com.homecare.domain.user.model.Rol;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.RolRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.model.ServicioAceptado;
import com.homecare.domain.offer.model.Oferta;
import com.homecare.domain.offer.repository.OfertaRepository;
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
@DisplayName("PaymentService — integración")
class PaymentServiceIntegrationTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PagoRepository pagoRepository;

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
    private DisputaRepository disputaRepository;

    @Autowired
    private ConformidadClienteRepository conformidadRepository;

    private Usuario cliente;
    private Usuario proveedor;
    private Rol rolProveedor;
    private Rol rolCliente;

    @BeforeEach
    void setUp() {
        rolProveedor = getOrCreateRol("ROLE_SERVICE_PROVIDER", "Proveedor de servicios");
        rolCliente = getOrCreateRol("ROLE_CUSTOMER", "Cliente de la plataforma");
        cliente = usuarioRepository.save(Usuario.builder()
                .email("cliente@test.com")
                .password("pass")
                .nombre("Cliente")
                .apellido("Test")
                .activo(true)
                .verificado(true)
                .roles(new HashSet<>(Set.of(rolCliente)))
                .build());
        proveedor = usuarioRepository.save(Usuario.builder()
                .email("proveedor@test.com")
                .password("pass")
                .nombre("Proveedor")
                .apellido("Test")
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
    @DisplayName("Disputa activa bloquea la liberación de pago retenido")
    void disputaActivaBloqueaLiberacionPago() {
        Solicitud solicitud = createSolicitud(cliente);
        Oferta oferta = createOferta(solicitud, proveedor, new BigDecimal("120000"));
        ServicioAceptado servicio = createServicioAceptado(solicitud, oferta, cliente, proveedor, ServicioAceptado.EstadoServicio.COMPLETADO);
        Pago pago = createPago(servicio, cliente, proveedor);

        Disputa disputa = Disputa.builder()
                .servicio(servicio)
                .cliente(cliente)
                .proveedor(proveedor)
                .iniciadoPor(cliente)
                .motivo("Problema con el servicio")
                .estado(Disputa.EstadoDisputa.ABIERTA)
                .build();
        disputaRepository.save(disputa);

        assertThatThrownBy(() -> paymentService.intentarLiberarPago(pago))
                .isInstanceOf(PaymentException.class)
                .hasMessageContaining("disputa activa");

        Pago pagoReload = pagoRepository.findById(pago.getId()).orElseThrow();
        assertThat(pagoReload.getEstadoRetencion()).isEqualTo(Pago.EstadoRetencion.RETENIDO);
    }

    @Test
    @DisplayName("Pago retenido se libera cuando la disputa está resuelta y hay conformidad aceptada")
    void pagoSeLiberaCuandoDisputaResueltaYConformidadAceptada() {
        Solicitud solicitud = createSolicitud(cliente);
        Oferta oferta = createOferta(solicitud, proveedor, new BigDecimal("120000"));
        ServicioAceptado servicio = createServicioAceptado(solicitud, oferta, cliente, proveedor, ServicioAceptado.EstadoServicio.COMPLETADO);
        Pago pago = createPago(servicio, cliente, proveedor);

        Disputa disputa = Disputa.builder()
                .servicio(servicio)
                .cliente(cliente)
                .proveedor(proveedor)
                .iniciadoPor(cliente)
                .motivo("Problema resuelto")
                .estado(Disputa.EstadoDisputa.RESUELTA)
                .build();
        disputaRepository.save(disputa);

        ConformidadCliente conformidad = ConformidadCliente.builder()
                .servicio(servicio)
                .cliente(cliente)
                .aceptado(true)
                .comentario("Todo bien")
                .ipOrigen("127.0.0.1")
                .build();
        conformidadRepository.save(conformidad);

        paymentService.intentarLiberarPago(pago);

        Pago pagoReload = pagoRepository.findById(pago.getId()).orElseThrow();
        assertThat(pagoReload.getEstadoRetencion()).isEqualTo(Pago.EstadoRetencion.LIBERADO);
        assertThat(pagoReload.getFechaLiberacion()).isNotNull();
    }

    private Solicitud createSolicitud(Usuario cliente) {
        Solicitud solicitud = Solicitud.builder()
                .cliente(cliente)
                .titulo("Limpieza de prueba")
                .descripcion("Descripción de prueba")
                .tipoLimpieza(TipoLimpieza.BASICA)
                .direccion("Calle 123")
                .latitud(new BigDecimal("4.624335"))
                .longitud(new BigDecimal("-74.063644"))
                .fechaServicio(LocalDate.now().plusDays(1))
                .horaInicio(LocalTime.of(9, 0))
                .estado(EstadoSolicitud.ABIERTA)
                .build();
        return solicitudRepository.save(solicitud);
    }

    private Oferta createOferta(Solicitud solicitud, Usuario proveedor, BigDecimal precio) {
        Oferta oferta = Oferta.builder()
                .solicitud(solicitud)
                .proveedor(proveedor)
                .precioOfrecido(precio)
                .mensajeOferta("Oferta de prueba")
                .tiempoLlegadaMinutos(30)
                .estado(Oferta.EstadoOferta.PENDIENTE)
                .build();
        Oferta guardada = ofertaRepository.save(oferta);
        solicitud.setEstado(EstadoSolicitud.EN_NEGOCIACION);
        solicitudRepository.save(solicitud);
        return guardada;
    }

    private ServicioAceptado createServicioAceptado(Solicitud solicitud, Oferta oferta, Usuario cliente, Usuario proveedor, ServicioAceptado.EstadoServicio estado) {
        ServicioAceptado servicio = ServicioAceptado.builder()
                .solicitud(solicitud)
                .oferta(oferta)
                .cliente(cliente)
                .proveedor(proveedor)
                .precioAcordado(oferta.getPrecioOfrecido())
                .estado(estado)
                .build();
        return servicioRepository.save(servicio);
    }

    private Pago createPago(ServicioAceptado servicio, Usuario cliente, Usuario proveedor) {
        Pago pago = Pago.builder()
                .servicio(servicio)
                .cliente(cliente)
                .proveedor(proveedor)
                .montoTotal(new BigDecimal("120000"))
                .comisionPlataforma(new BigDecimal("12000"))
                .montoProveedor(new BigDecimal("108000"))
                .estado(Pago.EstadoPago.APROBADO)
                .estadoRetencion(Pago.EstadoRetencion.RETENIDO)
                .referencia("TEST-REF-001")
                .build();
        return pagoRepository.save(pago);
    }
}
