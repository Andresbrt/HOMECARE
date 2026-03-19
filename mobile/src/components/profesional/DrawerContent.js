/**
 * DrawerContent — Menú lateral profesional Homecare 2026
 * Avatar + Andrés Felipe ★ 4.9 + Nivel Platino turquesa
 * Menú completo: Ciudad, Cartera, Ciudad a Ciudad, Préstamos,
 * Notificaciones (badge), Seguridad, Configuración, Ayuda
 * Botón “Cambiar a Modo Usuario” (turquesa glow) + Cerrar sesión
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import useModeStore from '../../store/modeStore';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

//  Menú principal 
const MENU_MAIN = [
  { label: 'Inicio',          icon: 'home-outline',          activeIcon: 'home',          screen: 'ProfDashboard' },
  { label: 'Mapa',            icon: 'map-outline',           activeIcon: 'map',           screen: 'ProfMap' },
  { label: 'Desempeño',       icon: 'bar-chart-outline',     activeIcon: 'bar-chart',     screen: 'ProfPerformance' },
  { label: 'Cartera',         icon: 'wallet-outline',        activeIcon: 'wallet',        screen: 'ProfWallet' },
  { label: 'Ciudad a Ciudad', icon: 'airplane-outline',      activeIcon: 'airplane',      screen: 'CityToCity' },
  { label: 'Préstamos',       icon: 'cash-outline',          activeIcon: 'cash',          screen: 'Loans' },
];

//  Menú secundario 
const MENU_SECONDARY = [
  { label: 'Notificaciones', icon: 'notifications-outline',       screen: 'Notifications', badge: 3 },
  { label: 'Seguridad',      icon: 'shield-checkmark-outline',    screen: 'Security' },
  { label: 'Configuración',  icon: 'settings-outline',           screen: 'Settings' },
  { label: 'Ayuda',          icon: 'help-circle-outline',        screen: 'Help' },
];

//  Componente ítem con animación de press 
function MenuItem({ item, isActive, onPress }) {
  const scale = useSharedValue(1);
  const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.93, { damping: 12 }, () => {
      scale.value = withSpring(1, { damping: 14 });
    });
    onPress();
  };

  return (
    <Animated.View style={anim}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.82}
        style={[styles.menuItem, isActive && styles.menuItemActive]}
      >
        {isActive && (
          <LinearGradient
            colors={[`${PROF.accent}28`, `${PROF.accent}06`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        <View style={[styles.menuIconWrap, isActive && styles.menuIconActive]}>
          <Ionicons
            name={isActive && item.activeIcon ? item.activeIcon : item.icon}
            size={20}
            color={isActive ? PROF.accent : PROF.textMuted}
          />
        </View>

        <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
          {item.label}
        </Text>

        {item.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        ) : null}

        {isActive && <View style={styles.activeBar} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

// 
export default function DrawerContent(props) {
  const { navigation, state } = props;
  const { user, logout }    = useAuth();
  const { setMode }         = useModeStore();

  const activeScreen = state?.routeNames?.[state?.index] ?? '';

  // Animación del botón Switch
  const switchScale = useSharedValue(1);
  const switchStyle = useAnimatedStyle(() => ({ transform: [{ scale: switchScale.value }] }));

  const handleSwitchToUser = () => {
    // 1. Haptic pesado → sensación premium de cambio de modo
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // 2. Animación de press en el botón
    switchScale.value = withSpring(0.94, { damping: 10 }, () => {
      switchScale.value = withSpring(1, { damping: 14 });
    });
    // 3. Cerrar el drawer primero para que la transición se vea limpia
    navigation.closeDrawer();
    // 4. Cambiar modo: AppNavigator re-monta el stack usuario con UserMap como raíz
    setMode('usuario');
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    navigation.closeDrawer();
    logout?.();
  };

  const handleNav = (screen) => {
    Haptics.selectionAsync?.();
    navigation.navigate(screen);
    navigation.closeDrawer();
  };

  // Iniciales del avatar (2 letras)
  const initials = user?.nombre
    ? user.nombre.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase()).join('')
    : 'AP';

  return (
    <LinearGradient colors={['#000F22', PROF.bg]} style={styles.container}>
      <DrawerContentScrollView
        {...props}
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/*  PERFIL  */}
        <View style={styles.profileSection}>
          <LinearGradient colors={PROF.gradAccent} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user?.nombre || 'Andrés Felipe'}
            </Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#FFD700" />
              <Text style={styles.ratingText}>4.9  127 servicios</Text>
            </View>
          </View>
        </View>

        {/*  NIVEL PLATINO BADGE  */}
        <View style={styles.nivelRow}>
          <LinearGradient
            colors={[PROF.accentDim, 'rgba(73,192,188,0.06)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nivelBadge}
          >
            <Ionicons name="star" size={14} color={PROF.accent} />
            <Text style={styles.nivelText}>Nivel Platino Homecare</Text>
            <View style={styles.nivelDot} />
          </LinearGradient>
        </View>

        <View style={styles.divider} />

        {/*  MENÚ PRINCIPAL  */}
        <View style={styles.menuSection}>
          {MENU_MAIN.map((item) => (
            <MenuItem
              key={item.label}
              item={item}
              isActive={activeScreen === item.screen}
              onPress={() => handleNav(item.screen)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        {/*  MENÚ SECUNDARIO  */}
        <View style={styles.menuSection}>
          {MENU_SECONDARY.map((item) => (
            <MenuItem
              key={item.label}
              item={item}
              isActive={activeScreen === item.screen}
              onPress={() => handleNav(item.screen)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        {/*  SWITCH MODO USUARIO + LOGOUT  */}
        <View style={styles.switchSection}>

          {/* Botón grande turquesa "Cambiar a Modo Usuario" */}
          <Animated.View style={[switchStyle, styles.switchGlowWrap]}>
            <TouchableOpacity onPress={handleSwitchToUser} activeOpacity={0.85} style={styles.switchBtn}>
              <LinearGradient
                colors={PROF.gradAccent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.switchGradient}
              >
                <Ionicons name="swap-horizontal" size={20} color="#fff" />
                <View style={styles.switchTextWrap}>
                  <Text style={styles.switchTitle}>Cambiar a Modo Usuario</Text>
                  <Text style={styles.switchSub}>Ver servicios disponibles</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.65)" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Cerrar sesión */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.75}>
            <Ionicons name="log-out-outline" size={18} color={PROF.error} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        {/* VERSION */}
        <Text style={styles.version}>Homecare Colorimetría v2.6.0  Platino</Text>
      </DrawerContentScrollView>
    </LinearGradient>
  );
}

// 
const styles = StyleSheet.create({
  container:     { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xl },

  // Perfil
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? SPACING.xl + 16 : SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.glow, shadowColor: PROF.accent,
  },
  avatarText: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold, color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  ratingText: { fontSize: TYPOGRAPHY.xs, color: PROF.textSecondary },

  // Nivel Platino
  nivelRow: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  nivelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: 8,
    borderWidth: 1, borderColor: PROF.accentGlow,
  },
  nivelText: { flex: 1, fontSize: TYPOGRAPHY.xs, color: PROF.accent, fontWeight: TYPOGRAPHY.semibold },
  nivelDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: PROF.accent,
    ...SHADOWS.glow, shadowColor: PROF.accent,
  },

  divider: {
    height: 1,
    backgroundColor: PROF.border,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
  },

  // Menú
  menuSection: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md - 2,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 2,
    overflow: 'hidden',
  },
  menuItemActive: {
    borderWidth: 1,
    borderColor: `${PROF.accent}30`,
  },
  menuIconWrap: {
    width: 36, height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuIconActive: {
    backgroundColor: PROF.accentDim,
    borderWidth: 1, borderColor: PROF.accentGlow,
  },
  menuLabel:       { flex: 1, fontSize: TYPOGRAPHY.sm, color: PROF.textSecondary, fontWeight: TYPOGRAPHY.medium },
  menuLabelActive: { color: PROF.textPrimary, fontWeight: TYPOGRAPHY.semibold },

  badge: {
    backgroundColor: PROF.accent,
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  activeBar: {
    position: 'absolute', right: 0,
    top: '15%', bottom: '15%',
    width: 3,
    backgroundColor: PROF.accent,
    borderRadius: 2,
  },

  // Switch modo
  switchSection: { paddingHorizontal: SPACING.md, gap: SPACING.sm, paddingTop: SPACING.xs },
  switchGlowWrap: {
    ...SHADOWS.glow, shadowColor: PROF.accent,
    borderRadius: BORDER_RADIUS.lg,
  },
  switchBtn: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  switchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md + 2,
    gap: SPACING.sm,
  },
  switchTextWrap: { flex: 1 },
  switchTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold, color: '#fff' },
  switchSub:   { fontSize: TYPOGRAPHY.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: `${PROF.error}35`,
  },
  logoutText: { fontSize: TYPOGRAPHY.sm, color: PROF.error, fontWeight: TYPOGRAPHY.medium },

  version: {
    textAlign: 'center',
    fontSize: 10,
    color: PROF.textMuted,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
});
