package com.homecare.domain.location.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

/**
 * Servicio para integraciÃ³n con Google Maps APIs
 * - Directions API: Calcular rutas y ETAs precisos
 * - Distance Matrix API: Calcular distancias y tiempos
 * - Geocoding API: Convertir direcciones a coordenadas
 */
@Service
@Slf4j
public class GoogleMapsService {

    @Value("${google.maps.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String DIRECTIONS_API_URL = "https://maps.googleapis.com/maps/api/directions/json";
    private static final String DISTANCE_MATRIX_API_URL = "https://maps.googleapis.com/maps/api/distancematrix/json";
    private static final String GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";

    public GoogleMapsService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Calcula la ruta desde la ubicaciÃ³n del proveedor hasta el cliente
     * Devuelve ETA preciso considerando trÃ¡fico y tipo de transporte
     */
    public RutaInfo calcularRuta(double latOrigen, double lonOrigen, 
                                  double latDestino, double lonDestino,
                                  String modoTransporte) {
        try {
            String modo = convertirModoTransporte(modoTransporte);
            
            URI uri = UriComponentsBuilder.fromUriString(DIRECTIONS_API_URL)
                    .queryParam("origin", latOrigen + "," + lonOrigen)
                    .queryParam("destination", latDestino + "," + lonDestino)
                    .queryParam("mode", modo)
                    .queryParam("departure_time", "now") // Considera trÃ¡fico actual
                    .queryParam("traffic_model", "best_guess")
                    .queryParam("key", apiKey)
                    .queryParam("language", "es")
                    .build()
                    .toUri();

            log.debug("Llamando a Google Directions API: {}", uri);
            
            String response = restTemplate.getForObject(uri, String.class);
            return parseDirectionsResponse(response);

        } catch (Exception e) {
            log.error("Error al calcular ruta con Google Maps: {}", e.getMessage(), e);
            // Fallback: calcular con Haversine
            return calcularRutaFallback(latOrigen, lonOrigen, latDestino, lonDestino);
        }
    }

    /**
     * Calcula distancia y tiempo usando Distance Matrix API
     * Ãštil para mÃºltiples destinos
     */
    public DistanciaInfo calcularDistanciaYTiempo(double latOrigen, double lonOrigen,
                                                    double latDestino, double lonDestino,
                                                    String modoTransporte) {
        try {
            String modo = convertirModoTransporte(modoTransporte);
            
            URI uri = UriComponentsBuilder.fromUriString(DISTANCE_MATRIX_API_URL)
                    .queryParam("origins", latOrigen + "," + lonOrigen)
                    .queryParam("destinations", latDestino + "," + lonDestino)
                    .queryParam("mode", modo)
                    .queryParam("departure_time", "now")
                    .queryParam("traffic_model", "best_guess")
                    .queryParam("key", apiKey)
                    .queryParam("language", "es")
                    .build()
                    .toUri();

            log.debug("Llamando a Google Distance Matrix API: {}", uri);
            
            String response = restTemplate.getForObject(uri, String.class);
            return parseDistanceMatrixResponse(response);

        } catch (Exception e) {
            log.error("Error al calcular distancia con Google Maps: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Convierte direcciÃ³n a coordenadas (Geocoding)
     */
    public Coordenadas geocodificarDireccion(String direccion) {
        try {
            URI uri = UriComponentsBuilder.fromUriString(GEOCODING_API_URL)
                    .queryParam("address", direccion)
                    .queryParam("key", apiKey)
                    .queryParam("language", "es")
                    .build()
                    .encode()
                    .toUri();

            log.debug("Geocodificando direcciÃ³n: {}", direccion);
            
            String response = restTemplate.getForObject(uri, String.class);
            return parseGeocodingResponse(response);

        } catch (Exception e) {
            log.error("Error al geocodificar direcciÃ³n: {}", e.getMessage(), e);
            return null;
        }
    }

    // ==================== MÃ‰TODOS PRIVADOS ====================

    private RutaInfo parseDirectionsResponse(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        
        String status = root.get("status").asText();
        if (!"OK".equals(status)) {
            log.warn("Google Directions API status: {}", status);
            return null;
        }

        JsonNode route = root.get("routes").get(0);
        JsonNode leg = route.get("legs").get(0);

        // Extraer informaciÃ³n de la ruta
        int distanciaMetros = leg.get("distance").get("value").asInt();
        int duracionSegundos = leg.get("duration").get("value").asInt();
        
        // Si hay trÃ¡fico, usar duration_in_traffic
        int duracionConTraficoSegundos = duracionSegundos;
        if (leg.has("duration_in_traffic")) {
            duracionConTraficoSegundos = leg.get("duration_in_traffic").get("value").asInt();
        }

        String resumenRuta = leg.get("start_address").asText() + " â†’ " + 
                            leg.get("end_address").asText();

        // Extraer puntos de la ruta (polyline)
        String polyline = route.get("overview_polyline").get("points").asText();

        // Extraer pasos de navegaciÃ³n
        List<PasoNavegacion> pasos = new ArrayList<>();
        JsonNode steps = leg.get("steps");
        for (JsonNode step : steps) {
            PasoNavegacion paso = new PasoNavegacion(
                step.get("html_instructions").asText()
                    .replaceAll("<[^>]*>", ""), // Eliminar HTML tags
                step.get("distance").get("value").asInt(),
                step.get("duration").get("value").asInt(),
                step.get("start_location").get("lat").asDouble(),
                step.get("start_location").get("lng").asDouble()
            );
            pasos.add(paso);
        }

        return new RutaInfo(
            distanciaMetros,
            duracionSegundos / 60, // Convertir a minutos
            duracionConTraficoSegundos / 60, // ETA con trÃ¡fico
            resumenRuta,
            polyline,
            pasos
        );
    }

    private DistanciaInfo parseDistanceMatrixResponse(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        
        String status = root.get("status").asText();
        if (!"OK".equals(status)) {
            log.warn("Google Distance Matrix API status: {}", status);
            return null;
        }

        JsonNode element = root.get("rows").get(0).get("elements").get(0);
        String elementStatus = element.get("status").asText();
        
        if (!"OK".equals(elementStatus)) {
            log.warn("Distance Matrix element status: {}", elementStatus);
            return null;
        }

        int distanciaMetros = element.get("distance").get("value").asInt();
        String distanciaTexto = element.get("distance").get("text").asText();
        
        int duracionSegundos = element.get("duration").get("value").asInt();
        String duracionTexto = element.get("duration").get("text").asText();

        // DuraciÃ³n con trÃ¡fico si estÃ¡ disponible
        int duracionConTraficoSegundos = duracionSegundos;
        String duracionConTraficoTexto = duracionTexto;
        
        if (element.has("duration_in_traffic")) {
            duracionConTraficoSegundos = element.get("duration_in_traffic").get("value").asInt();
            duracionConTraficoTexto = element.get("duration_in_traffic").get("text").asText();
        }

        return new DistanciaInfo(
            distanciaMetros,
            distanciaTexto,
            duracionSegundos / 60,
            duracionTexto,
            duracionConTraficoSegundos / 60,
            duracionConTraficoTexto
        );
    }

    private Coordenadas parseGeocodingResponse(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        
        String status = root.get("status").asText();
        if (!"OK".equals(status)) {
            log.warn("Google Geocoding API status: {}", status);
            return null;
        }

        JsonNode result = root.get("results").get(0);
        JsonNode location = result.get("geometry").get("location");
        
        String direccionFormateada = result.get("formatted_address").asText();

        return new Coordenadas(
            location.get("lat").asDouble(),
            location.get("lng").asDouble(),
            direccionFormateada
        );
    }

    private String convertirModoTransporte(String tipo) {
        if (tipo == null) return "driving";
        
        return switch (tipo.toLowerCase()) {
            case "auto", "carro", "vehiculo" -> "driving";
            case "moto", "motocicleta" -> "driving"; // Google Maps no tiene modo moto especÃ­fico
            case "bicicleta", "bike" -> "bicycling";
            case "a_pie", "caminando", "walking" -> "walking";
            default -> "driving";
        };
    }

    /**
     * CÃ¡lculo fallback usando fÃ³rmula de Haversine cuando Google Maps falla
     */
    private RutaInfo calcularRutaFallback(double lat1, double lon1, double lat2, double lon2) {
        final double RADIO_TIERRA_KM = 6371.0;
        
        double latDistancia = Math.toRadians(lat2 - lat1);
        double lonDistancia = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistancia / 2) * Math.sin(latDistancia / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistancia / 2) * Math.sin(lonDistancia / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distanciaKm = RADIO_TIERRA_KM * c;
        int distanciaMetros = (int) (distanciaKm * 1000);

        // Velocidad promedio urbana: 30 km/h
        double velocidadPromedioKmh = 30.0;
        int etaMinutos = (int) Math.ceil((distanciaKm / velocidadPromedioKmh) * 60);

        return new RutaInfo(
            distanciaMetros,
            etaMinutos,
            etaMinutos,
            "Ruta directa (cÃ¡lculo aproximado)",
            null,
            new ArrayList<>()
        );
    }

    // ==================== DTOs INTERNOS ====================

    public record RutaInfo(
        int distanciaMetros,
        int duracionMinutos,
        int duracionConTraficoMinutos, // ETA con trÃ¡fico actual
        String resumenRuta,
        String polyline, // Encoded polyline para dibujar en mapa
        List<PasoNavegacion> pasos
    ) {}

    public record DistanciaInfo(
        int distanciaMetros,
        String distanciaTexto,
        int duracionMinutos,
        String duracionTexto,
        int duracionConTraficoMinutos,
        String duracionConTraficoTexto
    ) {}

    public record Coordenadas(
        double latitud,
        double longitud,
        String direccionFormateada
    ) {}

    public record PasoNavegacion(
        String instruccion,
        int distanciaMetros,
        int duracionSegundos,
        double latitud,
        double longitud
    ) {}
}

