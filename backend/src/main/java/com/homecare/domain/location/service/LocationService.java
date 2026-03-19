package com.homecare.domain.location.service;

import com.homecare.dto.LocationDTO;
import com.homecare.common.exception.NotFoundException;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Caching;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationService {

    private final UsuarioRepository usuarioRepository;
    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double AVG_SPEED_KMH = 30.0; // Velocidad promedio en ciudad

    @Transactional
        @Caching(evict = {
            @CacheEvict(cacheNames = "userLocation", key = "#usuarioId"),
            @CacheEvict(cacheNames = "nearbyProviders", allEntries = true)
        })
    public void actualizarUbicacionUsuario(Long usuarioId, LocationDTO.UpdateLocation request) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        usuario.setLatitud(request.getLatitud());
        usuario.setLongitud(request.getLongitud());
        usuario.setUltimaUbicacion(LocalDateTime.now());

        usuarioRepository.save(usuario);
        
        log.info("UbicaciÃ³n actualizada para usuario {}: {}, {}",
                usuarioId, request.getLatitud(), request.getLongitud());
    }

        @Cacheable(cacheNames = "userLocation", key = "#usuarioId")
    public LocationDTO.LocationResponse obtenerUbicacionUsuario(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        if (usuario.getLatitud() == null || usuario.getLongitud() == null) {
            throw new NotFoundException("Usuario no tiene ubicaciÃ³n registrada");
        }

        return new LocationDTO.LocationResponse(
                usuario.getId(),
                usuario.getLatitud(),
                usuario.getLongitud(),
                null,
                usuario.getUltimaUbicacion(),
                null,
                null
        );
    }

        @Cacheable(cacheNames = "nearbyProviders", key = "#latitud + ':' + #longitud + ':' + #radioKm")
    public LocationDTO.NearbyProviders obtenerProveedoresCercanos(
            BigDecimal latitud, BigDecimal longitud, Double radioKm) {

        List<Usuario> proveedores = usuarioRepository.findProveedoresCercanos(
                latitud, longitud, radioKm.intValue()
        );

        List<LocationDTO.ProviderLocation> proveedoresLocation = proveedores.stream()
                .map(p -> {
                    Double distancia = calcularDistancia(
                            latitud, longitud,
                            p.getLatitud(), p.getLongitud()
                    );

                    return new LocationDTO.ProviderLocation(
                            p.getId(),
                            p.getNombre(),
                            p.getFotoPerfil(),
                            p.getLatitud(),
                            p.getLongitud(),
                            distancia,
                            p.getCalificacionPromedio() != null ?
                                    p.getCalificacionPromedio().doubleValue() : 0.0,
                            p.getDisponible(),
                            p.getUltimaUbicacion()
                    );
                })
                .collect(Collectors.toList());

        return new LocationDTO.NearbyProviders(
                proveedoresLocation,
                proveedoresLocation.size(),
                radioKm
        );
    }

    public LocationDTO.DistanceCalculation calcularDistanciaYTiempo(
            BigDecimal origenLat, BigDecimal origenLng,
            BigDecimal destinoLat, BigDecimal destinoLng) {

        Double distanciaKm = calcularDistancia(origenLat, origenLng, destinoLat, destinoLng);
        Integer tiempoMinutos = calcularTiempoEstimado(distanciaKm, AVG_SPEED_KMH);

        return new LocationDTO.DistanceCalculation(
                origenLat, origenLng,
                destinoLat, destinoLng,
                distanciaKm,
                tiempoMinutos
        );
    }

    public static Double calcularDistancia(BigDecimal lat1, BigDecimal lon1,
                                           BigDecimal lat2, BigDecimal lon2) {
        double latDiff = Math.toRadians(lat2.subtract(lat1).doubleValue());
        double lonDiff = Math.toRadians(lon2.subtract(lon1).doubleValue());

        double lat1Rad = Math.toRadians(lat1.doubleValue());
        double lat2Rad = Math.toRadians(lat2.doubleValue());

        double a = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
                   Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                   Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        double distancia = EARTH_RADIUS_KM * c;

        return BigDecimal.valueOf(distancia)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    public static Integer calcularTiempoEstimado(Double distanciaKm, Double velocidadKmh) {
        if (distanciaKm == null || velocidadKmh == null || velocidadKmh == 0) {
            return null;
        }

        double tiempoHoras = distanciaKm / velocidadKmh;
        double tiempoMinutos = tiempoHoras * 60;

        // Agregar factor de trÃ¡fico (10-30%)
        tiempoMinutos *= 1.2;

        return (int) Math.ceil(tiempoMinutos);
    }

    public boolean estaEnRadio(BigDecimal lat1, BigDecimal lon1,
                               BigDecimal lat2, BigDecimal lon2,
                               Double radioKm) {
        Double distancia = calcularDistancia(lat1, lon1, lat2, lon2);
        return distancia <= radioKm;
    }
}

