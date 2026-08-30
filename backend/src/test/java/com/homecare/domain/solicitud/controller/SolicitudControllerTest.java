package com.homecare.domain.solicitud.controller;

import com.homecare.dto.SolicitudDTO;
import com.homecare.domain.solicitud.service.SolicitudService;
import com.homecare.security.CustomUserDetails;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SolicitudControllerTest {

    @Mock
    private SolicitudService solicitudService;

    @Test
    @DisplayName("obtenerSolicitudesCercanas returns open solicitudes when no coordinates are provided")
    void obtenerSolicitudesCercanas_withoutCoordinates_returnsOpenSolicitudes() {
        SolicitudController controller = new SolicitudController(solicitudService);
        SolicitudDTO.Response sample = buildSampleSolicitudResponse();
        when(solicitudService.obtenerSolicitudesAbiertas(1L)).thenReturn(List.of(sample));

        CustomUserDetails userDetails = new CustomUserDetails(
                1L,
                "proveedor@test.com",
                "password",
                "Pro",
                "veedor",
                true,
                true,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_SERVICE_PROVIDER"))
        );

        PageRequest pageable = PageRequest.of(0, 10);
        ResponseEntity<Page<SolicitudDTO.Response>> response = controller.obtenerSolicitudesCercanas(
                null, null, null, null, 10, pageable, userDetails
        );

        assertThat(response.getStatusCodeValue()).isEqualTo(200);
        assertThat(response.getBody().getContent()).hasSize(1);
        assertThat(response.getBody().getContent().get(0).getId()).isEqualTo(42L);
        verify(solicitudService).obtenerSolicitudesAbiertas(1L);
        verify(solicitudService, never()).obtenerSolicitudesCercanas(anyLong(), any(), any(), anyInt(), any());
    }

    @Test
    @DisplayName("obtenerSolicitudesCercanas calls nearby query when coordinates are provided")
    void obtenerSolicitudesCercanas_withCoordinates_callsNearbyQuery() {
        SolicitudController controller = new SolicitudController(solicitudService);
        SolicitudDTO.Response sample = buildSampleSolicitudResponse();
        Page<SolicitudDTO.Response> page = new PageImpl<>(List.of(sample), PageRequest.of(0, 10), 1);

        when(solicitudService.obtenerSolicitudesCercanas(
                anyLong(), any(BigDecimal.class), any(BigDecimal.class), anyInt(), any(PageRequest.class)
        )).thenReturn(page);

        CustomUserDetails userDetails = new CustomUserDetails(
                1L,
                "proveedor@test.com",
                "password",
                "Pro",
                "veedor",
                true,
                true,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_SERVICE_PROVIDER"))
        );

        PageRequest pageable = PageRequest.of(0, 10);
        ResponseEntity<Page<SolicitudDTO.Response>> response = controller.obtenerSolicitudesCercanas(
                new BigDecimal("4.6"), new BigDecimal("-74.0"), null, null, 10, pageable, userDetails
        );

        assertThat(response.getStatusCodeValue()).isEqualTo(200);
        assertThat(response.getBody().getContent()).hasSize(1);
        assertThat(response.getBody().getContent().get(0).getId()).isEqualTo(42L);
        verify(solicitudService).obtenerSolicitudesCercanas(
                1L, new BigDecimal("4.6"), new BigDecimal("-74.0"), 10, pageable
        );
    }

    private SolicitudDTO.Response buildSampleSolicitudResponse() {
        SolicitudDTO.Response sample = new SolicitudDTO.Response();
        sample.setId(42L);
        sample.setClienteId(100L);
        sample.setClienteNombre("Cliente Test");
        sample.setClienteFoto(null);
        sample.setTitulo("Limpieza básica");
        sample.setDescripcion("Servicio urgente");
        sample.setTipoLimpieza("BASICA");
        sample.setDireccion("Calle 100 #10-10");
        sample.setLatitud(new BigDecimal("4.6"));
        sample.setLongitud(new BigDecimal("-74.0"));
        sample.setReferenciaDireccion("Portería");
        sample.setMetrosCuadrados(new BigDecimal("80"));
        sample.setCantidadHabitaciones(3);
        sample.setCantidadBanos(2);
        sample.setTieneMascotas(false);
        sample.setPrecioMaximo(new BigDecimal("180000"));
        sample.setFechaServicio(LocalDate.now().plusDays(1));
        sample.setHoraInicio(LocalTime.of(9, 0));
        sample.setDuracionEstimada(180);
        sample.setEstado("ABIERTA");
        sample.setCantidadOfertas(0);
        sample.setOfertaAceptadaId(null);
        sample.setCreatedAt(LocalDate.now().atTime(12, 0).toString());
        sample.setExpiraEn(null);
        sample.setDistanciaKm(2.5);
        return sample;
    }
}
