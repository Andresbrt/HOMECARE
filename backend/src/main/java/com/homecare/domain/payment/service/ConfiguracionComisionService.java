package com.homecare.domain.payment.service;

import com.homecare.dto.ConfiguracionComisionDTO;
import com.homecare.domain.payment.model.ConfiguracionComision;
import com.homecare.domain.payment.repository.ConfiguracionComisionRepository;
import com.homecare.common.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConfiguracionComisionService {

    private final ConfiguracionComisionRepository configuracionComisionRepository;

    public List<ConfiguracionComisionDTO.Response> listarConfiguraciones() {
        return configuracionComisionRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ConfiguracionComisionDTO.Response crearConfiguracion(ConfiguracionComisionDTO.Crear request) {
        ConfiguracionComision nueva = ConfiguracionComision.builder()
                .tipoServicio(request.getTipoServicio() != null && request.getTipoServicio().isBlank() ? null : request.getTipoServicio())
                .porcentajeComision(request.getPorcentajeComision())
                .vigenciaDesde(request.getVigenciaDesde())
                .vigenciaHasta(request.getVigenciaHasta())
                .build();

        ConfiguracionComision guardada = configuracionComisionRepository.save(nueva);
        return mapToResponse(guardada);
    }

    @Transactional
    public ConfiguracionComisionDTO.Response actualizarConfiguracion(Long id, ConfiguracionComisionDTO.Crear request) {
        ConfiguracionComision existente = configuracionComisionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Configuración de comisión no encontrada"));

        existente.setTipoServicio(request.getTipoServicio() != null && request.getTipoServicio().isBlank() ? null : request.getTipoServicio());
        existente.setPorcentajeComision(request.getPorcentajeComision());
        existente.setVigenciaDesde(request.getVigenciaDesde());
        existente.setVigenciaHasta(request.getVigenciaHasta());

        ConfiguracionComision actualizada = configuracionComisionRepository.save(existente);
        return mapToResponse(actualizada);
    }

    @Transactional
    public void eliminarConfiguracion(Long id) {
        ConfiguracionComision existente = configuracionComisionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Configuración de comisión no encontrada"));
        configuracionComisionRepository.delete(existente);
    }

    private ConfiguracionComisionDTO.Response mapToResponse(ConfiguracionComision configuracion) {
        return ConfiguracionComisionDTO.Response.builder()
                .id(configuracion.getId())
                .tipoServicio(configuracion.getTipoServicio())
                .porcentajeComision(configuracion.getPorcentajeComision())
                .vigenciaDesde(configuracion.getVigenciaDesde())
                .vigenciaHasta(configuracion.getVigenciaHasta())
                .createdAt(configuracion.getCreatedAt())
                .updatedAt(configuracion.getUpdatedAt())
                .build();
    }
}
