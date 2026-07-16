package com.homecare.domain.user.service;

import com.homecare.domain.user.model.Rol;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.RolRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.common.exception.ConflictBusinessException;
import com.homecare.domain.user.repository.VerificacionProveedorRepository;
import com.homecare.domain.user.model.VerificacionProveedor;
import com.homecare.dto.VerificacionProveedorDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("VerificacionProveedorService — integración")
class VerificacionProveedorServiceIntegrationTest {

    @Autowired
    private VerificacionProveedorService verificacionProveedorService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private VerificacionProveedorRepository verificacionProveedorRepository;

    private Usuario proveedor;
    private Rol rolProveedor;

    @BeforeEach
    void setUp() {
        rolProveedor = getOrCreateRol("ROLE_SERVICE_PROVIDER", "Proveedor de servicios");
        proveedor = usuarioRepository.save(Usuario.builder()
                .email("proveedor-verificacion@test.com")
                .password("pass")
                .nombre("Proveedor")
                .apellido("Verificacion")
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

    @Test
    @DisplayName("No se puede duplicar una solicitud de verificación pendiente")
    void cannotDuplicatePendingVerificationRequest() {
        VerificacionProveedorDTO.Crear request = new VerificacionProveedorDTO.Crear();
        request.setTipoDocumento("CC");
        request.setNumeroDocumento("123456789");
        request.setUrlDocumentoFrontal("https://example.com/frontal.jpg");
        request.setUrlDocumentoTrasero("https://example.com/trasero.jpg");
        request.setUrlSelfieVerificacion("https://example.com/selfie.jpg");

        verificacionProveedorService.solicitarVerificacion(proveedor.getId(), request);

        assertThatThrownBy(() -> verificacionProveedorService.solicitarVerificacion(proveedor.getId(), request))
                .isInstanceOf(ConflictBusinessException.class)
                .hasMessageContaining("solicitud de verificación pendiente");
    }

    @Test
    @DisplayName("Permite nueva solicitud después de un rechazo")
    void allowsNewRequestAfterRejection() {
        VerificacionProveedor first = verificacionProveedorRepository.save(VerificacionProveedor.builder()
                .proveedor(proveedor)
                .tipoDocumento("CC")
                .numeroDocumento("987654321")
                .urlDocumentoFrontal("https://example.com/frontal.jpg")
                .urlDocumentoTrasero("https://example.com/trasero.jpg")
                .urlSelfieVerificacion("https://example.com/selfie.jpg")
                .estado(VerificacionProveedor.EstadoVerificacion.RECHAZADO)
                .build());

        VerificacionProveedorDTO.Crear request = new VerificacionProveedorDTO.Crear();
        request.setTipoDocumento("CC");
        request.setNumeroDocumento("987654321");
        request.setUrlDocumentoFrontal("https://example.com/frontal2.jpg");
        request.setUrlDocumentoTrasero("https://example.com/trasero2.jpg");
        request.setUrlSelfieVerificacion("https://example.com/selfie2.jpg");

        VerificacionProveedorDTO.Response response = verificacionProveedorService.solicitarVerificacion(proveedor.getId(), request);

        assertThat(response).isNotNull();
        assertThat(response.getEstado()).isEqualTo(VerificacionProveedor.EstadoVerificacion.PENDIENTE);
        assertThat(verificacionProveedorRepository.count()).isGreaterThanOrEqualTo(2);
    }
}
