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
  SafeAreaView,
  Platform,
} from 'react-native';

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
import GlassCard from '../../components/shared/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

//  Estilo oscuro futurista Google Maps 
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3d4' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a1628' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#0e2a45' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a4060' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1a3d5c' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#49C0BC' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#001524' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0b1f33' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#3a7a8a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#0e2a45' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#06111f' }] },
];

//  Pin personalizado Homecare (casa + colorimetría turquesa) 
function HomecareMarker({ isMe = false }) {
  return (
    <View style={markerStyles.container}>
      <LinearGradient
        colors={isMe ? PROF.gradAccent : PROF.gradCard}
        style={[markerStyles.circle, isMe && markerStyles.circleMe]}
      >
        <Ionicons name="home" size={isMe ? 18 : 13} color="#fff" />
      </LinearGradient>
      {isMe && <View style={markerStyles.pulseRingStatic} />}
      <View style={[markerStyles.arrow, isMe && markerStyles.arrowAccent]} />
    </View>
  );
}

const markerStyles = StyleSheet.create({
  container: { alignItems: 'center' },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: PROF.accent,
  },
  circleMe: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    ...SHADOWS.glow,
    shadowColor: PROF.accent,
  },
  pulseRingStatic: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: PROF.accentGlow,
    backgroundColor: 'transparent',
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: PROF.secondary,
    marginTop: -1,
  },
  arrowAccent: { borderTopColor: PROF.accent },
});

//  Solicitudes cercanas mock 
const BOGOTA = { latitude: 4.7109886, longitude: -74.072092, latitudeDelta: 0.035, longitudeDelta: 0.035 };
const NEARBY = [
  { id: 1, lat: 4.716, lng: -74.076, title: 'Colorimetría Interior' },
  { id: 2, lat: 4.706, lng: -74.066, title: 'Análisis de Fachada' },
  { id: 3, lat: 4.719, lng: -74.062, title: 'Diagnóstico Cromático' },
];

// 
export default function MapScreen({ navigation }) {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [zone] = useState('Bogotá D.C.');

  // Animaciones  idéntico patrón al DashboardScreen
  const glowAnim   = useSharedValue(0.35);
  const toggleScale = useSharedValue(1);
  const pulseScale  = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.55);

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

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#000F22" />

      {/* MAPA FULL-SCREEN */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={BOGOTA}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      >
        <Marker coordinate={{ latitude: BOGOTA.latitude, longitude: BOGOTA.longitude }} anchor={{ x: 0.5, y: 1 }}>
          <HomecareMarker isMe />
        </Marker>
        {isAvailable && NEARBY.map((s) => (
          <Marker key={s.id} coordinate={{ latitude: s.lat, longitude: s.lng }} anchor={{ x: 0.5, y: 1 }} title={s.title}>
            <HomecareMarker />
          </Marker>
        ))}
      </MapView>

      {/* GRADIENTE SUPERIOR  difumina el header sobre el mapa */}
      <LinearGradient
        colors={['rgba(0,15,34,0.94)', 'rgba(0,15,34,0)']}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* HEADER */}
      <SafeAreaView style={styles.header}>
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
      </SafeAreaView>

      {/* TOGGLE DISPONIBILIDAD  idéntico al Dashboard */}
      <Animated.View style={[styles.toggleWrapper, glowStyle]}>
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
                    ? `${NEARBY.length} solicitudes cerca de ti`
                    : 'Actívate para recibir servicios'}
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#fff' : PROF.textMuted }]} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* FAB  "Disponible" con glow pulsante */}
      <View style={styles.fabWrapper}>
        <Animated.View style={[styles.pulseRing, pulseStyle]} />
        <Animated.View style={[styles.fabGlowWrap, glowStyle]}>
          <TouchableOpacity onPress={handleToggle} activeOpacity={0.85} style={styles.fabOuter}>
            <LinearGradient
              colors={isAvailable ? PROF.gradAccent : ['rgba(14,77,104,0.8)', 'rgba(0,27,56,0.95)']}
              style={styles.fabGradient}
            >
              <Ionicons
                name={isAvailable ? 'checkmark-circle' : 'close-circle-outline'}
                size={26}
                color="#fff"
              />
              <Text style={styles.fabLabel}>
                {isAvailable ? 'Disponible' : 'Activar'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* PANEL INFERIOR  estadísticas cuando disponible */}
      {isAvailable && (
        <View style={styles.bottomPanel}>
          <GlassCard variant="elevated" animated={false} padding={SPACING.md}>
            <View style={styles.bottomRow}>
              <View style={styles.bottomStat}>
                <Ionicons name="flash" size={17} color={PROF.accent} />
                <Text style={styles.bottomVal}>3</Text>
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

  // FAB
  fabWrapper: {
    position: 'absolute',
    bottom: 148,
    right: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: PROF.accentGlow,
    borderWidth: 2, borderColor: PROF.accent,
  },
  fabGlowWrap: {
    ...SHADOWS.glowStrong,
    shadowColor: PROF.accent,
    borderRadius: BORDER_RADIUS.full,
  },
  fabOuter: { borderRadius: BORDER_RADIUS.full, overflow: 'hidden' },
  fabGradient: {
    paddingHorizontal: SPACING.md + 4,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabLabel: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.bold, color: '#fff' },

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
});
