/**
 * UserMapScreen  Mapa Principal Modo Usuario Homecare 2026
 * Full-screen dark premium map estilo InDriver  Apple Design Award
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

let MapView, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
  const MapModule = require('react-native-maps');
  MapView = MapModule.default;
  Marker = MapModule.Marker;
  PROVIDER_GOOGLE = MapModule.PROVIDER_GOOGLE;
} else {
  // Mock para Web
  MapView = ({ children, style }) => <View style={[style, { backgroundColor: '#0a1628', justifyContent: 'center', alignItems: 'center' }]}><Text style={{color: '#49C0BC'}}>Mapa no disponible en Web (Usa Expo Go)</Text>{children}</View>;
  Marker = ({ children }) => <View>{children}</View>;
  PROVIDER_GOOGLE = 'google';
}

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInLeft,
  FadeOutLeft,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../../components/shared/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import useChatStore from '../../store/chatStore';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3d4' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a1628' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#0e2a45' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a4060' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1a3d5c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#001524' }] },
];

const CATEGORIES = [
  { id: 'limpieza', label: 'Limpieza', icon: 'sparkles-outline' },
  { id: 'electricidad', label: 'Electricidad', icon: 'flash-outline' },
  { id: 'plomeria', label: 'Plomer�a', icon: 'water-outline' },
  { id: 'reparacion', label: 'Reparaciones', icon: 'hammer-outline' },
  { id: 'jardineria', label: 'Jardiner�a', icon: 'leaf-outline' },
];

const TECHNICIANS = [
  { id: '1', latitude: 4.7142, longitude: -74.0700, nombre: 'Carlos M.', rating: 4.9, available: true },
  { id: '2', latitude: 4.7078, longitude: -74.0754, nombre: 'Ana R.', rating: 4.8, available: true },
];

function CategoryChip({ item, selected, onPress }) {
  const scale = useSharedValue(1);
  const chipStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    Haptics.selectionAsync?.();
    scale.value = withSpring(0.87, { damping: 10 }, () => { scale.value = withSpring(1, { damping: 12 }); });
    onPress(item.id);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={chipStyle}>
        <GlassCard variant={selected ? 'accent' : 'default'} animated={false} padding={0} style={styles.chipOuter} innerStyle={styles.chipInner}>
          <Ionicons name={item.icon} size={15} color={selected ? PROF.accent : PROF.textSecondary} />
          <Text style={[styles.chipText, selected && styles.chipTextActive]}>{item.label}</Text>
        </GlassCard>
      </Animated.View>
    </TouchableOpacity>
  );
}

function MenuOption({ icon, label, onPress, index }) {
  return (
    <Animated.View 
      entering={FadeInLeft.delay(index * 100).springify().damping(15)}
    >
      <TouchableOpacity style={styles.menuOption} onPress={onPress}>
        <Ionicons name={icon} size={22} color="#fff" style={styles.menuOptionIcon} />
        <Text style={styles.menuOptionLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function UserMapScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { location, startWatching, stopWatching } = useLocation();
  const mapRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ── Chat activo ───────────────────────────────────────────────────────────
  const activeService  = useChatStore((s) => s.activeService);
  const unreadTotal    = useChatStore((s) => s.unreadTotal ?? 0);
  const chatFabScale   = useSharedValue(0);
  const chatFabStyle   = useAnimatedStyle(() => ({
    transform: [{ scale: chatFabScale.value }],
    opacity: chatFabScale.value,
  }));
  const [chatTooltip, setChatTooltip] = useState(false);

  useEffect(() => {
    chatFabScale.value = withSpring(activeService ? 1 : 0, { damping: 14, stiffness: 180, mass: 0.8 });
  }, [activeService]);

  const handleOpenChat = () => {
    if (!activeService) return;
    setChatTooltip(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('UserChat', {
      solicitudId:    activeService.solicitudId,
      destinatarioId: activeService.destinatarioId,
      titulo:         activeService.titulo ?? 'Tu profesional',
    });
  };

  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, []);

  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 1000);
    }
  }, [location]);

  const initials = user?.nombre ? user.nombre.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('') : 'A';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#000F22" />

      <MapView ref={mapRef} style={StyleSheet.absoluteFillObject} provider={PROVIDER_GOOGLE} customMapStyle={DARK_MAP_STYLE}>
        {location && (
          <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }}>
            <View style={styles.userDotBody}>
              <View style={styles.userDotCore} />
            </View>
          </Marker>
        )}
        {TECHNICIANS.map(tech => (
          <Marker key={tech.id} coordinate={{ latitude: tech.latitude, longitude: tech.longitude }}>
            <View style={styles.techPin}><Ionicons name="home" size={14} color="#fff" /></View>
          </Marker>
        ))}
      </MapView>

      <Animated.View entering={FadeInDown.duration(480).delay(80)} style={[styles.minimalHeader, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.menuTrigger} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIsMenuOpen(true); }}>
          <Ionicons name="menu-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleText}>HomeCare AI</Text>
        </View>
        <View style={{ width: 44 }} />
      </Animated.View>

      <View style={[styles.topCategoriesWrapper, { top: insets.top + 65 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topCategoriesScroll}>
          {CATEGORIES.map(cat => (
            <CategoryChip key={cat.id} item={cat} selected={selectedCategory === cat.id} onPress={(id) => { setSelectedCategory(id); navigation.navigate('ServiceRequestFlow', { serviceType: id }); }} />
          ))}
        </ScrollView>
      </View>

      {/* FAB — Chatear (aparece cuando hay un servicio en curso) */}
      {activeService && (
        <Animated.View style={[styles.chatFab, chatFabStyle]}>
          {/* Tooltip on long-press */}
          {chatTooltip && (
            <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(160)} style={styles.chatTooltip}>
              <Text style={styles.chatTooltipText}>
                {activeService.titulo ? `Chatear con ${activeService.titulo}` : 'Ir al chat activo'}
              </Text>
            </Animated.View>
          )}
          <TouchableOpacity
            onPress={handleOpenChat}
            onLongPress={() => setChatTooltip(true)}
            onPressOut={() => setChatTooltip(false)}
            activeOpacity={0.82}
          >
            <LinearGradient colors={PROF.gradAccent} style={styles.chatFabGradient}>
              <Ionicons name="chatbubbles" size={24} color="#fff" />
              <Text style={styles.chatFabLabel}>Chatear</Text>
              {unreadTotal > 0 && (
                <View style={styles.chatFabBadge}>
                  <Text style={styles.chatFabBadgeText}>{unreadTotal > 99 ? '99+' : unreadTotal}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {isMenuOpen && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setIsMenuOpen(false)} />
          <Animated.View entering={FadeInLeft.duration(300)} exiting={FadeOutLeft.duration(200)} style={styles.sideMenu}>
            <SafeAreaView style={{ flex: 1 }}>
              <TouchableOpacity style={styles.sideMenuHeader} onPress={() => { setIsMenuOpen(false); navigation.navigate('UserProfile'); }}>
                <View style={styles.sideAvatarContainer}>
                  <LinearGradient colors={PROF.gradAccent} style={styles.sideAvatar}><Text style={styles.sideAvatarText}>{initials}</Text></LinearGradient>
                  <View style={styles.notifDot} />
                </View>
                <View style={styles.sideInfo}>
                  <Text style={styles.sideName}>{user?.nombre || 'Usuario'}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.ratingText}>4.96 (115)</Text>
                    <Ionicons name="chevron-forward" size={14} color="#666" style={{ marginLeft: 10 }} />
                  </View>
                </View>
              </TouchableOpacity>

              <ScrollView style={styles.menuOptions}>
                <MenuOption index={0} icon="time-outline" label="Historial de solicitudes" onPress={() => navigation.navigate('UserHistory')} />
                <MenuOption index={1} icon="notifications-outline" label="Notificaciones" onPress={() => navigation.navigate('UserNotifications')} />
                <MenuOption index={2} icon="shield-checkmark-outline" label="Seguridad" onPress={() => {}} />
                <MenuOption index={3} icon="settings-outline" label="Configuracion" onPress={() => {}} />
                <MenuOption index={4} icon="help-circle-outline" label="Ayuda" onPress={() => {}} />
                <MenuOption index={5} icon="chatbubble-outline" label="Soporte" onPress={() => {}} />
              </ScrollView>

              <View style={styles.menuFooter}>
                <TouchableOpacity style={styles.driverModeBtn}><Text style={styles.driverModeText}>Modo profesional</Text></TouchableOpacity>
                <View style={styles.socialRow}><Ionicons name="logo-facebook" size={24} color="#1877F2" /><Ionicons name="logo-instagram" size={24} color="#E4405F" /></View>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a1628' },
  minimalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, position: 'absolute', zIndex: 100, width: '100%' },
  menuTrigger: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(30, 41, 59, 0.7)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitleContainer: { backgroundColor: 'rgba(15, 23, 42, 0.5)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  headerTitleText: { color: '#fff', fontFamily: TYPOGRAPHY.fontBold, fontSize: 14, letterSpacing: 0.5 },
  userDotBody: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(73, 192, 188, 0.2)', justifyContent: 'center', alignItems: 'center' },
  userDotCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: PROF.accent, borderWidth: 2, borderColor: '#fff' },
  techPin: { width: 34, height: 34, borderRadius: 17, backgroundColor: PROF.accent, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  topCategoriesWrapper: { position: 'absolute', left: 0, right: 0, zIndex: 90 },
  topCategoriesScroll: { paddingHorizontal: 16, gap: 10 },
  chipOuter: { borderRadius: BORDER_RADIUS.full },
  chipInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chipText: { color: PROF.textSecondary, fontSize: 14 },
  chipTextActive: { color: PROF.accent, fontWeight: 'bold' },
  menuOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 999 },
  sideMenu: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '80%', backgroundColor: '#1E1E1E', zIndex: 1000 },
  sideMenuHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40 },
  sideAvatarContainer: { position: 'relative' },
  sideAvatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#49C0BC' },
  sideAvatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  notifDot: { position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#FF5A5F', borderWidth: 2, borderColor: '#1E1E1E' },
  sideInfo: { marginLeft: 15 },
  sideName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { color: '#888', fontSize: 14, marginLeft: 5 },
  menuOptions: { flex: 1, marginTop: 10 },
  menuOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20 },
  menuOptionIcon: { marginRight: 20, opacity: 0.8 },
  menuOptionLabel: { color: '#fff', fontSize: 16, fontWeight: '500' },
  menuFooter: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  driverModeBtn: { width: '100%', backgroundColor: '#C5FF2D', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  driverModeText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  socialRow: { flexDirection: 'row', gap: 20 },

  // ── FAB Chatear (centrado horizontalmente) ───────────────────────────────
  chatFab: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 200,
    shadowColor: PROF.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 14,
    elevation: 12,
  },
  chatFabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 50,
    gap: 8,
  },
  chatFabLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  chatFabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF4C4C',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#001B38',
    marginLeft: 2,
  },
  chatFabBadgeText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  chatTooltip: {
    position: 'absolute',
    bottom: '100%',
    alignSelf: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(0,15,34,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(73,192,188,0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    maxWidth: 240,
  },
  chatTooltipText: {
    fontSize: 12,
    color: '#E0F0FF',
    fontWeight: '600',
    textAlign: 'center',
  },
});
