/**
 * Professional MapScreen  Mapa Futurista Homecare 2026
 * Mapa Google oscuro + toggle disponibilidad (identical al Dashboard)
 * FAB pulsante con glow turquesa + overlay glassmorphism + pines premium
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

let MapView, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
  const MapModule = require('react-native-maps');
  MapView = MapModule.default;
  Marker = MapModule.Marker;
  PROVIDER_GOOGLE = MapModule.PROVIDER_GOOGLE;
} else {
  // Mock para Web
  MapView = ({ children, style }) => <View style={[style, { backgroundColor: '#0a1628', justifyContent: 'center', alignItems: 'center' }]}><Text style={{color: '#49C0BC'}}>Mapa Profesional (Solo Móvil)</Text>{children}</View>;
  Marker = ({ children }) => <View>{children}</View>;
  PROVIDER_GOOGLE = 'google';
}

import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { apiFetch } from '../../config/api';
import GlassCard from '../../components/shared/GlassCard';
import { useAuth } from '../../context/AuthContext';
import useActiveServiceStore from '../../store/activeServiceStore';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

//  Estilo oscuro futurista Google Maps 
// Estilo oscuro elegante y legible (slate dark)
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0B132B' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B132B' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1C2541' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0B132B' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2B3A67' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#E2E8F0' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000F22' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#131F3A' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748B' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1C2541' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#080E20' }] },
];

// Pin limpio y profesional
function HomecareMarker({ isMe = false }) {
  return (
    <View style={markerStyles.container}>
      <View style={[markerStyles.circle, isMe && markerStyles.circleMe]}>
        <Ionicons name={isMe ? 'person' : 'home'} size={isMe ? 18 : 14} color="#fff" />
      </View>
      <View style={[markerStyles.arrow, isMe && markerStyles.arrowMe]} />
    </View>
  );
}

const markerStyles = StyleSheet.create({
  container: { alignItems: 'center' },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0E4D68',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  circleMe: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#49C0BC',
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0E4D68',
    marginTop: -1,
  },
  arrowMe: {
    borderTopColor: '#49C0BC',
  },
});

const MEDELLIN = { latitude: 6.2442, longitude: -75.5812, latitudeDelta: 0.04, longitudeDelta: 0.04 };

// 
export default function MapScreen({ navigation }) {
  const { user } = useAuth();
  const { activeService } = useActiveServiceStore();
  const mapRef = useRef(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [zone] = useState('Medellín, Antioquia');
  const [nearby, setNearby] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  // Animaciones  idéntico patrón al DashboardScreen
  const glowAnim   = useSharedValue(0.35);
  const toggleScale = useSharedValue(1);
  const pulseScale  = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.55);

  useEffect(() => {
    (async () => {
      try {
        let latitude = 6.2442;
        let longitude = -75.5812;
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const rawLat = loc.coords.latitude;
            const rawLng = loc.coords.longitude;
            const isCalifornia = rawLat >= 36.0 && rawLat <= 39.0 && rawLng >= -124.0 && rawLng <= -120.0;
            const isOutsideColombia = rawLat < -4.5 || rawLat > 14.0 || rawLng < -82.0 || rawLng > -66.0;
            if (!isCalifornia && !isOutsideColombia) {
              latitude = rawLat;
              longitude = rawLng;
            }
          }
        } catch (_) {}

        setUserLocation({ latitude, longitude });
        const res = await apiFetch(`/solicitudes/cercanas?latitud=${latitude}&longitud=${longitude}&radioKm=10`);
        const list = (res && res.ok && Array.isArray(res.data)) ? res.data : (res?.data?.content ?? []);
        setNearby(list.map((s) => ({
          id: s.id,
          lat: s.latitud ?? s.lat,
          lng: s.longitud ?? s.lng,
          title: s.tipoLimpieza ?? s.tipoServicio ?? s.titulo ?? s.descripcion ?? 'Solicitud',
        })));
      } catch (_) {
        // Si falla, el mapa sigue sin pines pero no bloquea
      }
    })();
  }, []);

  useEffect(() => {
    if (isAvailable) {
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1200 }),
          withTiming(0.35, { duration: 1200 }),
        ),
        -1,
        true,
      );
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.22, { duration: 900, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 900, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        true,
      );
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0, { duration: 900 }), withTiming(0.55, { duration: 900 })),
        -1,
        true,
      );
    } else {
      glowAnim.value   = withTiming(0.15, { duration: 400 });
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isAvailable]);

  const glowStyle   = useAnimatedStyle(() => ({ shadowOpacity: glowAnim.value }));
  const toggleStyle = useAnimatedStyle(() => ({ transform: [{ scale: toggleScale.value }] }));
  const pulseStyle  = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    toggleScale.value = withSpring(0.92, { damping: 10 }, () => {
      toggleScale.value = withSpring(1, { damping: 12 });
    });
    setIsAvailable((prev) => !prev);
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* MAPA FULL-SCREEN */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={MEDELLIN}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      >
        <Marker coordinate={{ latitude: MEDELLIN.latitude, longitude: MEDELLIN.longitude }} anchor={{ x: 0.5, y: 1 }}>
          <HomecareMarker isMe />
        </Marker>
        {isAvailable && nearby.map((s) => (
          <Marker key={s.id} coordinate={{ latitude: s.lat, longitude: s.lng }} anchor={{ x: 0.5, y: 1 }} title={s.title}>
            <HomecareMarker />
          </Marker>
        ))}
      </MapView>

      {/* GRADIENTE SUPERIOR  difumina el header sobre el mapa */}
      <LinearGradient
        colors={['rgba(0,15,34,0.96)', 'rgba(0,15,34,0.7)', 'rgba(0,15,34,0)']}
        style={[styles.topGradient, { height: insets.top + 90 }]}
        pointerEvents="none"
      />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={() => navigation.getParent()?.openDrawer?.()} style={styles.menuBtn}>
          <Ionicons name="menu" size={28} color={PROF.textPrimary} />
        </TouchableOpacity>

        <GlassCard style={styles.searchCard} animated={false} padding={0}>
          <View style={styles.searchRow}>
            <Ionicons name="location" size={15} color={PROF.accent} />
            <Text style={styles.searchZone}>{zone}</Text>
            <Ionicons name="chevron-down" size={13} color={PROF.textMuted} />
          </View>
        </GlassCard>

        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={26} color={PROF.textPrimary} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* TOGGLE DISPONIBILIDAD  idéntico al Dashboard */}
      <Animated.View style={[styles.toggleWrapper, { top: insets.top + 58 }, glowStyle]}>
        <Animated.View style={[toggleStyle, { borderRadius: BORDER_RADIUS.xl }]}>
          <TouchableOpacity onPress={handleToggle} activeOpacity={0.9} style={styles.toggleOuter}>
            <LinearGradient
              colors={isAvailable ? PROF.gradAccent : ['rgba(14,77,104,0.5)', 'rgba(0,27,56,0.95)']}
              style={styles.toggleGradient}
            >
              <View style={[styles.toggleDot, isAvailable && styles.toggleDotActive]}>
                <Ionicons
                  name={isAvailable ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color="#fff"
                />
              </View>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>
                  {isAvailable ? 'Disponible' : 'Fuera de línea'}
                </Text>
                <Text style={styles.toggleSub}>
                  {isAvailable
                    ? `${nearby.length} solicitudes cerca de ti`
                    : 'Actívate para recibir servicios'}
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#fff' : PROF.textMuted }]} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Botón recentrar mapa */}
      <TouchableOpacity
        style={[styles.recenterBtn, { bottom: (isAvailable || activeService) ? 96 : 24 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03,
            }, 600);
          }
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* BANNER FLOTANTE DE SERVICIO ACTIVO (si existe) */}
      {activeService && (
        <View style={[styles.activeServiceBanner, { bottom: 16 }]}>
          <TouchableOpacity
            style={styles.activeServiceBtn}
            onPress={() => navigation.navigate('ActiveServiceTracking', { service: activeService })}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#0E4D68', '#001B38']}
              style={styles.activeServiceGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.activeServiceDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeServiceTitle}>⚡ SERVICIO EN CURSO</Text>
                <Text style={styles.activeServiceSub} numberOfLines={1}>
                  {activeService.clienteNombre || 'Cliente'} · {activeService.direccion || 'Medellín'}
                </Text>
              </View>
              <Ionicons name="navigate-circle" size={28} color={PROF.accent} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* PANEL INFERIOR  estadísticas cuando disponible */}
      {isAvailable && !activeService && (
        <View style={[styles.bottomPanel, { bottom: 16 }]}>
          <GlassCard variant="elevated" animated={false} padding={SPACING.md}>
            <View style={styles.bottomRow}>
              <View style={styles.bottomStat}>
                <Ionicons name="flash" size={17} color={PROF.accent} />
                <Text style={styles.bottomVal}>{nearby.length > 0 ? nearby.length : '3'}</Text>
                <Text style={styles.bottomLabel}>Cercanas</Text>
              </View>
              <View style={styles.bottomDivider} />
              <View style={styles.bottomStat}>
                <Ionicons name="navigate" size={17} color={PROF.accent} />
                <Text style={styles.bottomVal}>1.2 km</Text>
                <Text style={styles.bottomLabel}>Más próxima</Text>
              </View>
              <View style={styles.bottomDivider} />
              <View style={styles.bottomStat}>
                <Ionicons name="time" size={17} color={PROF.accent} />
                <Text style={styles.bottomVal}>~8 min</Text>
                <Text style={styles.bottomLabel}>Llegada est.</Text>
              </View>
            </View>
          </GlassCard>
        </View>
      )}
    </View>
  );
}

// 
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000F22' },

  topGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 160,
    zIndex: 1,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'android' ? SPACING.lg + 8 : SPACING.sm,
    paddingBottom: SPACING.sm,
    zIndex: 10,
  },
  menuBtn: { padding: SPACING.sm },
  bellBtn: { position: 'relative', padding: SPACING.sm },
  badge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: PROF.accent,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  searchCard: { flex: 1, marginHorizontal: SPACING.sm },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: 6,
  },
  searchZone: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: PROF.textPrimary,
  },

  // Toggle
  toggleWrapper: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 98 : 86,
    left: SPACING.md, right: SPACING.md,
    zIndex: 10,
    ...SHADOWS.glowStrong,
    shadowColor: PROF.accent,
    borderRadius: BORDER_RADIUS.xl,
  },
  toggleOuter: { borderRadius: BORDER_RADIUS.xl, overflow: 'hidden' },
  toggleGradient: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  toggleDot: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  toggleDotActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  toggleText: { flex: 1 },
  toggleTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold, color: '#fff' },
  toggleSub: { fontSize: TYPOGRAPHY.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },

  // Recenter button
  recenterBtn: {
    position: 'absolute',
    bottom: 120,
    right: SPACING.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0E4D68',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 10,
  },

  // Bottom panel
  bottomPanel: {
    position: 'absolute',
    bottom: SPACING.xl + 8,
    left: SPACING.md, right: SPACING.md,
    zIndex: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  bottomStat: { alignItems: 'center', gap: 3, flex: 1 },
  bottomVal: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary },
  bottomLabel: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted },
  bottomDivider: { width: 1, height: 38, backgroundColor: PROF.border },

  // Active service floating banner
  activeServiceBanner: {
    position: 'absolute',
    bottom: 120,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 20,
    ...SHADOWS.lg,
  },
  activeServiceBtn: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: PROF.accent,
  },
  activeServiceGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  activeServiceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00D09E',
  },
  activeServiceTitle: {
    color: '#49C0BC',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeServiceSub: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
});
