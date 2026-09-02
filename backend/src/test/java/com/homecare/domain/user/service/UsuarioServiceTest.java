package com.homecare.domain.user.service;

import com.homecare.common.exception.NotFoundException;
import com.homecare.common.exception.UnauthorizedException;
import com.homecare.domain.user.model.Rol;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.domain.service_order.repository.CalificacionRepository;
import com.homecare.domain.service_order.repository.ServicioAceptadoRepository;
import com.homecare.domain.common.service.EmailService;
import com.homecare.dto.UsuarioDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UsuarioService — Unit Tests & Ranking Intelligence")
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private ServicioAceptadoRepository servicioRepository;

    @Mock
    private CalificacionRepository calificacionRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UsuarioService usuarioService;

    private Rol rolCliente;
    private Rol rolProveedor;

    @BeforeEach
    void setUp() {
        rolCliente = new Rol("ROLE_CUSTOMER");
        rolProveedor = new Rol("ROLE_SERVICE_PROVIDER");
    }

    @Nested
    @DisplayName("Cálculo de Ranking y Nivel (Backend Truth)")
    class RankingTests {

        @Test
        @DisplayName("Cálculo de nivel de ranking Basic, Pro y Elite según servicios completados")
        void calcularNivelRanking_umbrales() {
            assertThat(UsuarioService.calcularNivelRanking(0)).isEqualTo("BASIC");
            assertThat(UsuarioService.calcularNivelRanking(15)).isEqualTo("BASIC");
            assertThat(UsuarioService.calcularNivelRanking(16)).isEqualTo("PRO");
            assertThat(UsuarioService.calcularNivelRanking(35)).isEqualTo("PRO");
            assertThat(UsuarioService.calcularNivelRanking(36)).isEqualTo("ELITE");
            assertThat(UsuarioService.calcularNivelRanking(100)).isEqualTo("ELITE");
        }

        @Test
        @DisplayName("Cálculo de bonificación de visibilidad por nivel")
        void calcularBonusVisibilidad_umbrales() {
            assertThat(UsuarioService.calcularBonusVisibilidad(0)).isEqualTo(0);
            assertThat(UsuarioService.calcularBonusVisibilidad(15)).isEqualTo(0);
            assertThat(UsuarioService.calcularBonusVisibilidad(16)).isEqualTo(5);
            assertThat(UsuarioService.calcularBonusVisibilidad(35)).isEqualTo(5);
            assertThat(UsuarioService.calcularBonusVisibilidad(36)).isEqualTo(10);
            assertThat(UsuarioService.calcularBonusVisibilidad(80)).isEqualTo(10);
        }

        @Test
        @DisplayName("mapToResponse mapea serviciosCompletados y nivelRanking de forma inmutable desde el backend")
        void obtenerPerfilPublico_mapeaRankingCorrectamente() {
            Usuario proveedorElite = Usuario.builder()
                    .id(42L)
                    .nombre("Carlos")
                    .email("carlos@elite.com")
                    .telefono("3001234567")
                    .activo(true)
                    .verificado(true)
                    .serviciosCompletados(40)
                    .calificacionPromedio(new BigDecimal("4.9"))
                    .roles(new HashSet<>(Set.of(rolProveedor)))
                    .build();

            when(usuarioRepository.findById(42L)).thenReturn(Optional.of(proveedorElite));

            UsuarioDTO.Response resp = usuarioService.obtenerPerfilPublico(42L);

            assertThat(resp.getServiciosCompletados()).isEqualTo(40);
            assertThat(resp.getNivelRanking()).isEqualTo("ELITE");
            assertThat(resp.getBonusVisibilidad()).isEqualTo(10);
            assertThat(resp.getRoles()).contains("SERVICE_PROVIDER");
        }
    }

    @Nested
    @DisplayName("Disponibilidad y Seguridad de Roles")
    class DisponibilidadTests {

        @Test
        @DisplayName("Solo proveedores pueden cambiar disponibilidad; cliente lanza UnauthorizedException")
        void cambiarDisponibilidad_rechazaCliente() {
            Usuario cliente = Usuario.builder()
                    .id(10L)
                    .email("cliente@test.com")
                    .activo(true)
                    .roles(new HashSet<>(Set.of(rolCliente)))
                    .build();

            when(usuarioRepository.findById(10L)).thenReturn(Optional.of(cliente));

            assertThatThrownBy(() -> usuarioService.cambiarDisponibilidad(10L, true))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("Solo los proveedores pueden cambiar su disponibilidad");
            verify(usuarioRepository, never()).save(any());
        }

        @Test
        @DisplayName("Proveedor puede cambiar disponibilidad exitosamente")
        void cambiarDisponibilidad_proveedorExitoso() {
            Usuario proveedor = Usuario.builder()
                    .id(20L)
                    .email("proveedor@test.com")
                    .activo(true)
                    .disponible(false)
                    .roles(new HashSet<>(Set.of(rolProveedor)))
                    .build();

            when(usuarioRepository.findById(20L)).thenReturn(Optional.of(proveedor));

            usuarioService.cambiarDisponibilidad(20L, true);

            assertThat(proveedor.getDisponible()).isTrue();
            verify(usuarioRepository).save(proveedor);
        }
    }

    @Nested
    @DisplayName("Actualización de Ubicación GPS")
    class UbicacionTests {

        @Test
        @DisplayName("Actualiza coordenadas GPS del usuario correctamente")
        void actualizarUbicacion_exitoso() {
            Usuario user = Usuario.builder()
                    .id(5L)
                    .email("geo@test.com")
                    .roles(new HashSet<>(Set.of(rolProveedor)))
                    .build();

            when(usuarioRepository.findById(5L)).thenReturn(Optional.of(user));

            usuarioService.actualizarUbicacion(5L, new BigDecimal("4.60971"), new BigDecimal("-74.08175"));

            assertThat(user.getLatitud()).isEqualByComparingTo(new BigDecimal("4.60971"));
            assertThat(user.getLongitud()).isEqualByComparingTo(new BigDecimal("-74.08175"));
            verify(usuarioRepository).save(user);
        }

        @Test
        @DisplayName("Lanza NotFoundException cuando el usuario no existe")
        void actualizarUbicacion_usuarioInexistente() {
            when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> usuarioService.actualizarUbicacion(99L, BigDecimal.ONE, BigDecimal.ZERO))
                    .isInstanceOf(NotFoundException.class);
        }
    }
}
