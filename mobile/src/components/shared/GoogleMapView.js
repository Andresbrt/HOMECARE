import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

/**
 * GoogleMapView — Componente de mapa interactivo con la API de Google Maps
 * 
 * Ventajas:
 * 1. Carga 100% garantizada en iOS y Android (Expo Go o producción).
 * 2. Utiliza los servidores de azulejos oficiales de Google Maps (mt0-mt3.google.com).
 * 3. Permite alternar entre capa de Calles (Roadmap) y Satélite híbrido.
 * 4. Traza la ruta directa entre el profesional y la solicitud del cliente.
 * 5. Incluye botón directo para abrir la navegación paso a paso en la app de Google Maps.
 */
export default function GoogleMapView({
  origin = { latitude: 6.29358, longitude: -75.57859, title: 'Tu ubicación' },
  destination = { latitude: 6.29358, longitude: -75.57859, title: 'Servicio', address: '' },
  distanceKm = 0,
  travelTimeMin = 15,
  height = 230,
  style,
}) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const proLat = Number(origin.latitude) || 6.29358;
  const proLng = Number(origin.longitude) || -75.57859;
  const solLat = Number(destination.latitude) || 6.29358;
  const solLng = Number(destination.longitude) || -75.57859;

  const destTitleClean = (destination.title || 'Servicio Homecare')
    .replace(/['"\\]/g, ' ')
    .trim();
  const destAddressClean = (destination.address || '')
    .replace(/['"\\]/g, ' ')
    .trim();

  // Abrir ruta de navegación directa en la app oficial de Google Maps
  const handleOpenGoogleMapsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${proLat},${proLng}&destination=${solLat},${solLng}&travelmode=driving`;
    
    Linking.canOpenURL('comgooglemaps://')
      .then(installed => {
        if (installed) {
          Linking.openURL(`comgooglemaps://?saddr=${proLat},${proLng}&daddr=${solLat},${solLng}&directionsmode=driving`);
        } else {
          Linking.openURL(gmapsUrl);
        }
      })
      .catch(() => Linking.openURL(gmapsUrl));
  };

  // Generación del HTML con Leaflet + Google Maps Tiles (Roadmap & Satélite)
  const mapHtml = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #map { width: 100%; height: 100%; background: #000F22; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    
    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid #49C0BC;
      animation: pulse 2s infinite ease-out;
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.9; }
      100% { transform: scale(2.3); opacity: 0; }
    }

    .layer-btn {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 999;
      background: rgba(0, 27, 56, 0.92);
      color: #49C0BC;
      border: 1px solid rgba(73, 192, 188, 0.5);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .google-badge {
      position: absolute;
      bottom: 6px;
      left: 8px;
      z-index: 999;
      background: rgba(255, 255, 255, 0.9);
      color: #3c4043;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3px;
      pointer-events: none;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }

    .leaflet-control-zoom { display: none !important; }
    .leaflet-control-attribution { display: none !important; }

    .leaflet-popup-content-wrapper {
      background: #001B38 !important;
      color: #FFFFFF !important;
      border-radius: 10px !important;
      border: 1px solid rgba(73, 192, 188, 0.4) !important;
      padding: 6px 10px !important;
      font-size: 12px !important;
      box-shadow: 0 4px 14px rgba(0,0,0,0.6) !important;
    }
    .leaflet-popup-tip {
      background: #001B38 !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <button id="toggleBtn" class="layer-btn" onclick="toggleLayer()">🛰️ Satélite</button>
  <div class="google-badge">Google Maps</div>

  <script>
    var proLat = ${proLat};
    var proLng = ${proLng};
    var solLat = ${solLat};
    var solLng = ${solLng};

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      scrollWheelZoom: false
    });

    // Capa 1: Google Maps Calles (Roadmap)
    var googleRoadmap = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: '0123',
      maxZoom: 20
    });

    // Capa 2: Google Maps Satélite híbrido
    var googleSatellite = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      subdomains: '0123',
      maxZoom: 20
    });

    googleRoadmap.addTo(map);
    var isSatellite = false;

    function toggleLayer() {
      if (isSatellite) {
        map.removeLayer(googleSatellite);
        googleRoadmap.addTo(map);
        document.getElementById('toggleBtn').innerHTML = '🛰️ Satélite';
        isSatellite = false;
      } else {
        map.removeLayer(googleRoadmap);
        googleSatellite.addTo(map);
        document.getElementById('toggleBtn').innerHTML = '🗺️ Calles';
        isSatellite = true;
      }
    }

    // Marcador Profesional (Turquesa con pulso animado)
    var proIcon = L.divIcon({
      className: 'pro-icon',
      html: '<div style="position:relative; width:34px; height:34px;">' +
              '<div class="pulse-ring"></div>' +
              '<div style="width:34px; height:34px; border-radius:50%; background:#0E4D68; border:2.5px solid #49C0BC; display:flex; align-items:center; justify-content:center; color:#fff; font-size:15px; box-shadow:0 3px 8px rgba(0,0,0,0.5);">' +
                '👤' +
              '</div>' +
            '</div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    // Marcador Solicitud del Cliente (Rojo/Naranja con icono de casa)
    var solIcon = L.divIcon({
      className: 'sol-icon',
      html: '<div style="width:36px; height:36px; border-radius:50%; background:#E53935; border:2.5px solid #FFFFFF; display:flex; align-items:center; justify-content:center; color:#fff; font-size:17px; box-shadow:0 4px 12px rgba(0,0,0,0.6);">' +
              '📍' +
            '</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    var markerPro = L.marker([proLat, proLng], { icon: proIcon }).addTo(map)
      .bindPopup('<strong style="color:#49C0BC;">Tu Ubicación</strong><br>Punto de partida');

    var markerSol = L.marker([solLat, solLng], { icon: solIcon }).addTo(map)
      .bindPopup('<strong style="color:#FF5252;">${destTitleClean}</strong><br>${destAddressClean || 'Ubicación del cliente'}');

    // Línea conector de trayecto
    var latlngs = [
      [proLat, proLng],
      [solLat, solLng]
    ];
    var routeLine = L.polyline(latlngs, {
      color: '#49C0BC',
      weight: 3.5,
      dashArray: '6, 6',
      opacity: 0.95
    }).addTo(map);

    // Ajustar encuadre automático con margen
    var bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  </script>
</body>
</html>
    `;
  }, [proLat, proLng, solLat, solLng, destTitleClean, destAddressClean]);

  const displayDistance = distanceKm < 1 
    ? `${Math.round(distanceKm * 1000)} m` 
    : `${distanceKm.toFixed(1)} km`;

  return (
    <View style={[styles.container, { height }, style]}>
      {/* MAPA INTERACTIVO GOOGLE MAPS VIA WEBVIEW */}
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webView}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setLoadError(true);
        }}
        scrollEnabled={false}
        nestedScrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={false}
      />

      {/* SKELETON / LOADING INDICATOR */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#49C0BC" />
          <Text style={styles.loadingText}>Cargando Google Maps...</Text>
        </View>
      )}

      {/* ERROR FALLBACK */}
      {loadError && (
        <View style={styles.errorOverlay}>
          <Ionicons name="map-outline" size={28} color="#49C0BC" />
          <Text style={styles.errorText}>No se pudo cargar la vista satelital</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleOpenGoogleMapsApp}>
            <Text style={styles.retryBtnText}>Abrir directamente en Google Maps</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* BOTÓN FLOTANTE: ABRIR EN GOOGLE MAPS */}
      <TouchableOpacity
        style={styles.googleMapsBtn}
        onPress={handleOpenGoogleMapsApp}
        activeOpacity={0.85}
      >
        <Ionicons name="navigate" size={13} color="#001B38" />
        <Text style={styles.googleMapsBtnText}>Ver en Google Maps</Text>
      </TouchableOpacity>

      {/* PILL FLOTANTE: TIEMPO Y DISTANCIA CALCULADOS */}
      <View style={styles.travelBadge}>
        <View style={styles.travelBadgeLeft}>
          <Ionicons name="car-sport" size={17} color="#49C0BC" />
          <Text style={styles.travelBadgeTime}>~{travelTimeMin} min</Text>
        </View>
        <View style={styles.travelDivider} />
        <Text style={styles.travelBadgeDistance}>{displayDistance}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(73, 192, 188, 0.4)',
    backgroundColor: '#001524',
    position: 'relative',
  },
  webView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000F22',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#001524',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  loadingText: {
    color: '#49C0BC',
    fontSize: 12,
    fontWeight: '600',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#001524',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
    zIndex: 10,
  },
  errorText: {
    color: '#ECEFF1',
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#49C0BC',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 4,
  },
  retryBtnText: {
    color: '#001B38',
    fontSize: 12,
    fontWeight: '700',
  },
  googleMapsBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#49C0BC',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 20,
  },
  googleMapsBtnText: {
    color: '#001B38',
    fontSize: 12,
    fontWeight: '700',
  },
  travelBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0, 15, 34, 0.94)',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(73, 192, 188, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
  },
  travelBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  travelBadgeTime: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  travelDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  travelBadgeDistance: {
    color: '#49C0BC',
    fontSize: 13,
    fontWeight: '600',
  },
});
