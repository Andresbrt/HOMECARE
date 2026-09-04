package com.homecare.domain.location;

import com.homecare.domain.location.service.LocationService;
import com.homecare.dto.LocationDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class LocationHaversineTest {

    @Test
    @DisplayName("Distancia entre el mismo punto debe ser 0.00 km")
    void mismaUbicacion_retornaCero() {
        BigDecimal lat = BigDecimal.valueOf(4.6768);
        BigDecimal lon = BigDecimal.valueOf(-74.0483);

        Double distancia = LocationService.calcularDistancia(lat, lon, lat, lon);

        assertEquals(0.0, distancia, 0.01);
    }

    @Test
    @DisplayName("Distancia Bogotá: Parque de la 93 a Centro Comercial Unicentro debe ser ~3.4 km")
    void distanciaParque93AUnicentro_calculaCorrectamente() {
        // Parque de la 93: 4.6768, -74.0483
        BigDecimal latParque93 = BigDecimal.valueOf(4.6768);
        BigDecimal lonParque93 = BigDecimal.valueOf(-74.0483);

        // CC Unicentro: 4.7018, -74.0416
        BigDecimal latUnicentro = BigDecimal.valueOf(4.7018);
        BigDecimal lonUnicentro = BigDecimal.valueOf(-74.0416);

        Double distancia = LocationService.calcularDistancia(latParque93, lonParque93, latUnicentro, lonUnicentro);

        assertNotNull(distancia);
        assertTrue(distancia > 2.5 && distancia < 4.0, "La distancia debe estar entre 2.5 y 4.0 km (obtenido: " + distancia + ")");
    }

    @Test
    @DisplayName("Cálculo de tiempo estimado debe incluir factor de tráfico (1.2x)")
    void calcularTiempoEstimado_incluyeTrafico() {
        Double distanciaKm = 10.0;
        Double velocidadKmh = 30.0; // 10 / 30 = 0.333 horas = 20 mins. Con 1.2x tráfico = 24 mins.

        Integer minutos = LocationService.calcularTiempoEstimado(distanciaKm, velocidadKmh);

        assertNotNull(minutos);
        assertEquals(24, minutos);
    }

    @Test
    @DisplayName("Cálculo de tiempo estimado con valores nulos o velocidad cero retorna null")
    void calcularTiempoEstimado_valoresInvalidos_retornaNull() {
        assertNull(LocationService.calcularTiempoEstimado(null, 30.0));
        assertNull(LocationService.calcularTiempoEstimado(10.0, null));
        assertNull(LocationService.calcularTiempoEstimado(10.0, 0.0));
    }

    @Test
    @DisplayName("Cálculo compuesto de distancia y tiempo")
    void calcularDistanciaYTiempo_retornaDTOValido() {
        LocationService service = new LocationService(null);

        BigDecimal lat1 = BigDecimal.valueOf(4.6097);
        BigDecimal lon1 = BigDecimal.valueOf(-74.0817);
        BigDecimal lat2 = BigDecimal.valueOf(4.6533);
        BigDecimal lon2 = BigDecimal.valueOf(-74.0836);

        LocationDTO.DistanceCalculation calc = service.calcularDistanciaYTiempo(lat1, lon1, lat2, lon2);

        assertNotNull(calc);
        assertTrue(calc.getDistanciaKm() > 0);
        assertTrue(calc.getTiempoEstimadoMinutos() > 0);
    }

    @Test
    @DisplayName("Verificación de radio (estaEnRadio)")
    void estaEnRadio_validaCorrectamente() {
        LocationService service = new LocationService(null);

        BigDecimal lat1 = BigDecimal.valueOf(4.6768);
        BigDecimal lon1 = BigDecimal.valueOf(-74.0483);
        BigDecimal lat2 = BigDecimal.valueOf(4.7018);
        BigDecimal lon2 = BigDecimal.valueOf(-74.0416); // ~2.8 km

        assertTrue(service.estaEnRadio(lat1, lon1, lat2, lon2, 5.0), "Debe estar dentro del radio de 5km");
        assertFalse(service.estaEnRadio(lat1, lon1, lat2, lon2, 1.0), "No debe estar dentro del radio de 1km");
    }
}
