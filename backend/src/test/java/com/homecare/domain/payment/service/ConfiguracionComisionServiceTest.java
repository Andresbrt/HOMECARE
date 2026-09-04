package com.homecare.domain.payment.service;

import com.homecare.common.exception.NotFoundException;
import com.homecare.domain.payment.model.ConfiguracionComision;
import com.homecare.domain.payment.repository.ConfiguracionComisionRepository;
import com.homecare.dto.ConfiguracionComisionDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConfiguracionComisionServiceTest {

    @Mock
    private ConfiguracionComisionRepository configuracionComisionRepository;

    @InjectMocks
    private ConfiguracionComisionService configuracionComisionService;

    private ConfiguracionComision comisionBase;

    @BeforeEach
    void setUp() {
        comisionBase = ConfiguracionComision.builder()
                .id(1L)
                .tipoServicio("COLORIMETRIA")
                .porcentajeComision(new BigDecimal("10.00"))
                .vigenciaDesde(java.time.LocalDate.now())
                .vigenciaHasta(java.time.LocalDate.now().plusMonths(6))
                .build();
    }

    @Test
    @DisplayName("Debe listar todas las configuraciones de comisión")
    void listarConfiguraciones_retornaLista() {
        when(configuracionComisionRepository.findAll()).thenReturn(List.of(comisionBase));

        List<ConfiguracionComisionDTO.Response> lista = configuracionComisionService.listarConfiguraciones();

        assertNotNull(lista);
        assertEquals(1, lista.size());
        assertEquals("COLORIMETRIA", lista.get(0).getTipoServicio());
        assertEquals(new BigDecimal("10.00"), lista.get(0).getPorcentajeComision());
    }

    @Test
    @DisplayName("Debe crear una nueva configuración de comisión")
    void crearConfiguracion_guardaYRetornaDTO() {
        ConfiguracionComisionDTO.Crear dto = new ConfiguracionComisionDTO.Crear();
        dto.setTipoServicio("BALAYAGE");
        dto.setPorcentajeComision(new BigDecimal("12.50"));
        dto.setVigenciaDesde(java.time.LocalDate.now());
        dto.setVigenciaHasta(java.time.LocalDate.now().plusMonths(12));

        when(configuracionComisionRepository.save(any(ConfiguracionComision.class))).thenAnswer(i -> {
            ConfiguracionComision c = i.getArgument(0);
            c.setId(2L);
            return c;
        });

        ConfiguracionComisionDTO.Response res = configuracionComisionService.crearConfiguracion(dto);

        assertNotNull(res);
        assertEquals(2L, res.getId());
        assertEquals("BALAYAGE", res.getTipoServicio());
        assertEquals(new BigDecimal("12.50"), res.getPorcentajeComision());
        verify(configuracionComisionRepository, times(1)).save(any(ConfiguracionComision.class));
    }

    @Test
    @DisplayName("Debe actualizar una configuración existente")
    void actualizarConfiguracion_actualizaCorrectamente() {
        when(configuracionComisionRepository.findById(1L)).thenReturn(Optional.of(comisionBase));
        when(configuracionComisionRepository.save(any(ConfiguracionComision.class))).thenReturn(comisionBase);

        ConfiguracionComisionDTO.Crear dto = new ConfiguracionComisionDTO.Crear();
        dto.setTipoServicio("COLORIMETRIA_PREMIUM");
        dto.setPorcentajeComision(new BigDecimal("8.00"));

        ConfiguracionComisionDTO.Response res = configuracionComisionService.actualizarConfiguracion(1L, dto);

        assertNotNull(res);
        assertEquals("COLORIMETRIA_PREMIUM", comisionBase.getTipoServicio());
        assertEquals(new BigDecimal("8.00"), comisionBase.getPorcentajeComision());
    }

    @Test
    @DisplayName("Actualizar configuración inexistente debe lanzar NotFoundException")
    void actualizarConfiguracion_noExiste_lanzaNotFound() {
        when(configuracionComisionRepository.findById(99L)).thenReturn(Optional.empty());

        ConfiguracionComisionDTO.Crear dto = new ConfiguracionComisionDTO.Crear();
        assertThrows(NotFoundException.class, () -> configuracionComisionService.actualizarConfiguracion(99L, dto));
    }

    @Test
    @DisplayName("Debe eliminar una configuración existente")
    void eliminarConfiguracion_eliminaRegistro() {
        when(configuracionComisionRepository.findById(1L)).thenReturn(Optional.of(comisionBase));
        doNothing().when(configuracionComisionRepository).delete(comisionBase);

        assertDoesNotThrow(() -> configuracionComisionService.eliminarConfiguracion(1L));
        verify(configuracionComisionRepository, times(1)).delete(comisionBase);
    }
}
