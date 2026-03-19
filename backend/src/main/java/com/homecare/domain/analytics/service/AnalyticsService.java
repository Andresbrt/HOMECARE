package com.homecare.domain.analytics.service;

import com.homecare.dto.AnalyticsDTO;
import com.homecare.domain.solicitud.repository.SolicitudRepository;
import com.homecare.domain.offer.repository.OfertaRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.domain.payment.repository.PagoRepository;
import com.homecare.domain.service_order.repository.ServicioAceptadoRepository;
import com.homecare.domain.messaging.repository.MensajeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final SolicitudRepository solicitudRepository;
    private final OfertaRepository ofertaRepository;
    private final ServicioAceptadoRepository servicioRepository;
    private final UsuarioRepository usuarioRepository;
    @SuppressWarnings("unused")
    private final PagoRepository pagoRepository;
    @SuppressWarnings("unused")
    private final MensajeRepository mensajeRepository;

    public AnalyticsDTO.MetricasInDriver getMetricasInDriver(LocalDate fechaInicio, LocalDate fechaFin) {
        // Valores por defecto si los mÃ©todos no existen
        Long totalSolicitudes = 0L;
        Long totalOfertas = 0L;
        Double precioPromedio = 0.0;
        Double variacionPrecios = 0.0;
        Long solicitudesConChat = 0L;
        Double porcentajeNegociacion = 0.0;
        Integer tiempoPromedioEleccion = 0;

        try {
            totalSolicitudes = solicitudRepository.count();
            totalOfertas = ofertaRepository.count();
        } catch (Exception e) {
            log.warn("Error al obtener mÃ©tricas: {}", e.getMessage());
        }

        Double ofertasPromedioPorSolicitud = totalSolicitudes > 0 ? 
                (double) totalOfertas / totalSolicitudes : 0.0;

        return AnalyticsDTO.MetricasInDriver.builder()
                .totalSolicitudes(totalSolicitudes)
                .totalOfertas(totalOfertas)
                .ofertasPromedioPorSolicitud(ofertasPromedioPorSolicitud)
                .precioPromedio(precioPromedio)
                .variacionPrecios(variacionPrecios)
                .solicitudesConChat(solicitudesConChat)
                .porcentajeNegociacion(porcentajeNegociacion)
                .tiempoPromedioEleccion(tiempoPromedioEleccion)
                .build();
    }

    public AnalyticsDTO.ConversionFunnel getConversionFunnel(LocalDate fechaInicio, LocalDate fechaFin) {
        // Valores por defecto
        Long solicitudesCreadas = 0L;
        Long solicitudesConOfertas = 0L;
        Long solicitudesAceptadas = 0L;
        Long serviciosCompletados = 0L;

        try {
            solicitudesCreadas = solicitudRepository.count();
            solicitudesConOfertas = solicitudRepository.count();
            serviciosCompletados = servicioRepository.countServiciosCompletadosPorUsuario(null);
        } catch (Exception e) {
            log.warn("Error al obtener conversion funnel: {}", e.getMessage());
        }

        return AnalyticsDTO.ConversionFunnel.builder()
                .solicitudesCreadas(solicitudesCreadas)
                .solicitudesConOfertas(solicitudesConOfertas)
                .solicitudesAceptadas(solicitudesAceptadas)
                .serviciosCompletados(serviciosCompletados)
                .tasaConversionOfertas(calcularPorcentaje(solicitudesConOfertas, solicitudesCreadas).doubleValue())
                .tasaConversionAceptacion(calcularPorcentaje(solicitudesAceptadas, solicitudesConOfertas).doubleValue())
                .tasaCompletamiento(calcularPorcentaje(serviciosCompletados, solicitudesAceptadas).doubleValue())
                .build();
    }

    public List<AnalyticsDTO.TopProveedor> getTopProveedores(Integer limite) {
        // Retornar lista vacÃ­a por defecto
        return new ArrayList<>();
    }

    public AnalyticsDTO.RevenueSummary getRevenueSummary(LocalDate fechaInicio, LocalDate fechaFin) {
        // Valores por defecto
        Double totalPagos = 0.0;
        Double totalComisiones = 0.0;
        Long totalProveedores = 0L;
        Double crecimiento = 0.0;

        try {
            totalProveedores = usuarioRepository.count();
        } catch (Exception e) {
            log.warn("Error al obtener revenue summary: {}", e.getMessage());
        }

        return AnalyticsDTO.RevenueSummary.builder()
                .totalPagos(totalPagos)
                .totalComisiones(totalComisiones)
                .totalProveedores(totalProveedores)
                .crecimiento(crecimiento)
                .ingresosPorTipo(new HashMap<>())
                .ingresosPorRegion(new HashMap<>())
                .build();
    }

    private BigDecimal calcularPorcentaje(Long numerador, Long denominador) {
        if (denominador == null || denominador == 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf((numerador.doubleValue() / denominador) * 100)
                .setScale(2, RoundingMode.HALF_UP);
    }
}

