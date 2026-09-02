package com.homecare.domain.service_order.service;

import com.homecare.common.exception.BadRequestException;
import com.homecare.common.exception.UnauthorizedException;
import com.homecare.domain.common.service.NotificationService;
import com.homecare.domain.service_order.repository.CalificacionRepository;
import com.homecare.domain.service_order.repository.ServicioAceptadoRepository;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.dto.CalificacionDTO;
import com.homecare.model.Calificacion;
import com.homecare.model.ServicioAceptado;
import com.homecare.model.ServicioAceptado.EstadoServicio;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CalificacionServiceTest {

    @Mock
    private CalificacionRepository calificacionRepository;

    @Mock
    private ServicioAceptadoRepository servicioRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private CalificacionService calificacionService;

    private Usuario cliente;
    private Usuario proveedor;
    private ServicioAceptado servicio;

    @BeforeEach
    void setUp() {
        cliente = new Usuario();
        cliente.setId(10L);
        cliente.setNombre("Cliente Test");

        proveedor = new Usuario();
        proveedor.setId(20L);
        proveedor.setNombre("Proveedor Test");

        servicio = new ServicioAceptado();
        servicio.setId(100L);
        servicio.setCliente(cliente);
        servicio.setProveedor(proveedor);
        servicio.setEstado(EstadoServicio.COMPLETADO);
    }

    @Nested
    @DisplayName("Tests de Calificación de Servicio")
    class CalificarTests {

        @Test
        @DisplayName("calificar — exitoso de cliente a proveedor")
        void calificar_exitoso() {
            CalificacionDTO.Crear request = new CalificacionDTO.Crear();
            request.setServicioId(100L);
            request.setPuntuacion(5);
            request.setComentario("Excelente servicio y puntualidad");

            Calificacion calificacionGuardada = new Calificacion();
            calificacionGuardada.setId(1L);
            calificacionGuardada.setServicio(servicio);
            calificacionGuardada.setCalificador(cliente);
            calificacionGuardada.setCalificado(proveedor);
            calificacionGuardada.setPuntuacion(5);
            calificacionGuardada.setComentario("Excelente servicio y puntualidad");
            calificacionGuardada.setTipo(Calificacion.TipoCalificacion.CLIENTE_A_PROVEEDOR);
            calificacionGuardada.setCreatedAt(LocalDateTime.now());

            when(servicioRepository.findById(100L)).thenReturn(Optional.of(servicio));
            when(calificacionRepository.existsByServicioIdAndCalificadorId(100L, 10L)).thenReturn(false);
            when(usuarioRepository.findById(10L)).thenReturn(Optional.of(cliente));
            when(calificacionRepository.save(any(Calificacion.class))).thenReturn(calificacionGuardada);
            when(calificacionRepository.findByCalificadoIdOrderByCreatedAtDesc(20L)).thenReturn(List.of(calificacionGuardada));

            CalificacionDTO.Response response = calificacionService.calificar(10L, request);

            assertThat(response).isNotNull();
            assertThat(response.getPuntuacion()).isEqualTo(5);
            assertThat(response.getComentario()).isEqualTo("Excelente servicio y puntualidad");
            verify(usuarioRepository).updateCalificacionPromedio(eq(20L), any(BigDecimal.class));
            verify(notificationService).enviarNotificacion(eq(20L), anyString(), anyString(), anyMap(), isNull());
        }

        @Test
        @DisplayName("calificar — rechaza si el servicio no está completado")
        void calificar_rechazaServicioNoCompletado() {
            servicio.setEstado(EstadoServicio.EN_PROGRESO);
            when(servicioRepository.findById(100L)).thenReturn(Optional.of(servicio));

            CalificacionDTO.Crear request = new CalificacionDTO.Crear();
            request.setServicioId(100L);
            request.setPuntuacion(5);

            assertThatThrownBy(() -> calificacionService.calificar(10L, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Solo se pueden calificar servicios completados");
        }

        @Test
        @DisplayName("calificar — rechaza si usuario no pertenece al servicio (IDOR)")
        void calificar_rechazaTerceroNoAutorizado() {
            when(servicioRepository.findById(100L)).thenReturn(Optional.of(servicio));

            CalificacionDTO.Crear request = new CalificacionDTO.Crear();
            request.setServicioId(100L);
            request.setPuntuacion(5);

            Long intrusoId = 999L;
            assertThatThrownBy(() -> calificacionService.calificar(intrusoId, request))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("No autorizado para calificar este servicio");
        }

        @Test
        @DisplayName("calificar — rechaza si ya calificó previamente")
        void calificar_rechazaDuplicado() {
            when(servicioRepository.findById(100L)).thenReturn(Optional.of(servicio));
            when(calificacionRepository.existsByServicioIdAndCalificadorId(100L, 10L)).thenReturn(true);

            CalificacionDTO.Crear request = new CalificacionDTO.Crear();
            request.setServicioId(100L);
            request.setPuntuacion(4);

            assertThatThrownBy(() -> calificacionService.calificar(10L, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Ya has calificado este servicio");
        }
    }
}
