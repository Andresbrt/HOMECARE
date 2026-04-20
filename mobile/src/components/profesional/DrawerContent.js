/**
 * DrawerContent — Menú lateral profesional Homecare 2026
 * Simplificado a 6 secciones principales, claras e intuitivas.
 * Un profesional en campo necesita encontrar todo rápido.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import useModeStore from '../../store/modeStore';
import { PROF, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { computeLevel } from '../../utils/levelUtils';

// ─── Menú principal: exactamente 6 opciones ──────────────────────────────────
const MENU = [
  { label: 'Dashboard',              icon: 'home-outline',             activeIcon: 'home',                 screen: 'ProfDashboard',            section: 'INICIO' },
  { label: 'Solicitudes',            icon: 'list-outline',             activeIcon: 'list',                 screen: 'ProfRequests',             section: 'TRABAJO' },
  { label: 'Finanzas y Rendimiento', icon: 'wallet-outline',           activeIcon: 'wallet',               screen: 'ProfFinancePerformance',   section: 'FINANZAS' },
  { label: 'Conversaciones',         icon: 'chatbubbles-outline',      activeIcon: 'chatbubbles',          screen: 'ChatList',                 section: 'CHAT' },
  { label: 'Mi Perfil',              icon: 'person-circle-outline',    activeIcon: 'person-circle',        screen: 'ProfProfile',              section: 'PERFIL' },
  { label: 'Configuración',          icon: 'settings-outline',         activeIcon: 'settings',             screen: null,                       section: null },
];

// ─── Item animado ─────────────────────────────────────────────────────────────
function MenuItem({ item, isActive, onPress, isLast }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.94, { damping: 12 }, () => { scale.value = withSpring(1, { damping: 14 }); });
    onPress();
  };

  return (
    <Animated.View style={anim}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={[styles.menuItem, isActive && styles.menuItemActive]}>
        {isActive && (
          <LinearGradient colors={[`${PROF.accent}22`, `${PROF.accent}04`]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill} />
        )}
        <View style={[styles.menuIconWrap, isActive && styles.menuIconActive]}>
          <Ionicons name={isActive && item.activeIcon ? item.activeIcon : item.icon} size={19} color={isActive ? PROF.accent : PROF.textMuted} />
        </View>
        <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]} numberOfLines={1}>{item.label}</Text>
        {item.badge ? (
          <View style={styles.badge}><Text style={styles.badgeText}>{item.badge}</Text></View>
        ) : isActive ? (
          <View style={styles.activeBar} />
        ) : (
          <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.15)" />
        )}
      </TouchableOpacity>
      {!isLast && <View style={styles.itemSep} />}
    </Animated.View>
  );
}

// ─── Sub-item de Configuración ────────────────────────────────────────────────
function SubMenuItem({ icon, label, onPress, delay = 0 }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(250)} style={anim}>
      <TouchableOpacity
        onPress={() => {
          scale.value = withSpring(0.96, { damping: 14 }, () => { scale.value = withSpring(1); });
          onPress();
        }}
        activeOpacity={0.85}
        style={styles.subItem}
      >
        <Ionicons name={icon} size={16} color={PROF.textMuted} />
        <Text style={styles.subLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DrawerContent(props) {
  const { navigation, state } = props;
  const { user, logout } = useAuth();
  const { setMode } = useModeStore();

  const activeScreen = state?.routeNames?.[state?.index] ?? '';

  const switchScale = useSharedValue(1);
  const switchStyle = useAnimatedStyle(() => ({ transform: [{ scale: switchScale.value }] }));

  const handleSwitchToUser = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    switchScale.value = withSpring(0.94, { damping: 10 }, () => { switchScale.value = withSpring(1); });
    navigation.closeDrawer();
    setMode('usuario');
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    navigation.closeDrawer();
    logout?.();
  };

  const handleNav = (screen) => {
    Haptics.selectionAsync();
    navigation.navigate(screen);
    navigation.closeDrawer();
  };

  const initials = user?.nombre
    ? user.nombre.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('')
    : 'HC';

  const level = computeLevel(user?.serviciosCompletados ?? 0);

  return (
    <LinearGradient colors={['#000F22', '#0a2235', PROF.bg]} style={styles.container} locations={[0, 0.4, 1]}>
      <DrawerContentScrollView {...props} scrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Perfil compacto ── */}
        <View style={styles.profileSection}>
          <LinearGradient colors={[PROF.accent, '#0a6b6b']} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{user?.nombre || 'Profesional'}</Text>
            {(user?.calificacionPromedio != null || user?.serviciosCompletados != null) && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {user?.calificacionPromedio != null
                    ? parseFloat(user.calificacionPromedio).toFixed(1)
                    : '—'}
                  {user?.serviciosCompletados != null
                    ? ` · ${user.serviciosCompletados} servicio${user.serviciosCompletados !== 1 ? 's' : ''}`
                    : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Badge Nivel ── */}
        <View style={styles.nivelRow}>
          <LinearGradient colors={[`${level.color}22`, `${level.color}06`]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.nivelBadge}>
            <Ionicons name={level.icon} size={13} color={level.color} />
            <Text style={[styles.nivelText, { color: level.color }]}>Nivel {level.label} · Homecare</Text>
            <View style={[styles.nivelDot, { backgroundColor: level.color }]} />
          </LinearGradient>
        </View>

        <View style={styles.divider} />

        {/* ── Menu principal ── */}
        {MENU.map((item, i) => {
          const showSectionHeader = item.section && (i === 0 || MENU[i - 1].section !== item.section);
          const isLastInSection = i === MENU.length - 1 || MENU[i + 1]?.section !== item.section;

          // Configuración es especial: no es MenuItem, muestra sub-items
          if (item.section === null) {
            return (
              <View key={item.label}>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>CONFIGURACIÓN</Text>
                <SubMenuItem icon="notifications-outline" label="Notificaciones" onPress={() => handleNav('ProfNotifications')} delay={0} />
                <View style={styles.subSep} />
                <SubMenuItem icon="shield-checkmark-outline" label="Seguridad" onPress={() => handleNav('ProfSecurity')} delay={40} />
                <View style={styles.subSep} />
                <SubMenuItem icon="help-circle-outline" label="Ayuda y Soporte" onPress={() => handleNav('ProfHelpSupport')} delay={80} />
              </View>
            );
          }

          return (
            <View key={item.label}>
              {showSectionHeader && (
                <>
                  {i > 0 && <View style={styles.divider} />}
                  <Text style={styles.sectionTitle}>{item.section}</Text>
                </>
              )}
              <MenuItem
                item={item}
                isActive={activeScreen === item.screen}
                onPress={() => handleNav(item.screen)}
                isLast={isLastInSection}
              />
            </View>
          );
        })}

        <View style={styles.divider} />

        {/* ── Acciones inferiores ── */}
        <View style={styles.actionsSection}>
          <Animated.View style={[switchStyle, styles.switchGlowWrap]}>
            <TouchableOpacity onPress={handleSwitchToUser} activeOpacity={0.85} style={styles.switchBtn}>
              <LinearGradient colors={[PROF.accent, '#0a8080']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.switchGradient}>
                <Ionicons name="swap-horizontal" size={19} color="#fff" />
                <View style={styles.switchTextWrap}>
                  <Text style={styles.switchTitle}>Modo Usuario</Text>
                  <Text style={styles.switchSub}>Ver servicios disponibles</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.6)" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.75}>
            <Ionicons name="log-out-outline" size={17} color={PROF.error} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Homecare v1.0.0 · Profesional</Text>
      </DrawerContentScrollView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xl },

  // Profile
  profileSection: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'android' ? 40 : SPACING.lg, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.md },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: `${PROF.accent}60` },
  avatarText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: '700', color: PROF.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  ratingText: { fontSize: 11, color: PROF.textSecondary },

  // Nivel
  nivelRow: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  nivelBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, gap: 7, borderWidth: 1, borderColor: `${PROF.accent}30` },
  nivelText: { flex: 1, fontSize: 11, color: PROF.accent, fontWeight: '600' },
  nivelDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: PROF.accent },

  // Layout
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: SPACING.lg, marginVertical: SPACING.xs },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: PROF.textMuted, letterSpacing: 1, paddingHorizontal: SPACING.lg + SPACING.sm, paddingTop: SPACING.sm, paddingBottom: 2 },

  // Menu item
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 13, borderRadius: BORDER_RADIUS.md, marginHorizontal: SPACING.sm, overflow: 'hidden', position: 'relative' },
  menuItemActive: { borderWidth: 1, borderColor: `${PROF.accent}28` },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  menuIconActive: { backgroundColor: `${PROF.accent}20`, borderWidth: 1, borderColor: `${PROF.accent}40` },
  menuLabel: { flex: 1, fontSize: 14, color: PROF.textSecondary, fontWeight: '500' },
  menuLabelActive: { color: PROF.textPrimary, fontWeight: '700' },
  badge: { backgroundColor: PROF.accent, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  activeBar: { position: 'absolute', right: 0, top: '20%', bottom: '20%', width: 3, backgroundColor: PROF.accent, borderRadius: 2 },
  itemSep: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: SPACING.lg + 4 },

  // Sub-items (Configuración)
  subItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: SPACING.lg + SPACING.sm, gap: SPACING.md },
  subLabel: { fontSize: 13, color: PROF.textSecondary, fontWeight: '500' },
  subSep: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: SPACING.lg + 4 },

  // Actions
  actionsSection: { paddingHorizontal: SPACING.md, gap: SPACING.sm, paddingTop: SPACING.sm },
  switchGlowWrap: { borderRadius: BORDER_RADIUS.lg, shadowColor: PROF.accent, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  switchBtn: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  switchGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 13, gap: SPACING.sm },
  switchTextWrap: { flex: 1 },
  switchTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  switchSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: 12, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: 'rgba(255,91,91,0.3)', backgroundColor: 'rgba(255,91,91,0.05)' },
  logoutText: { fontSize: 13, color: PROF.error, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 10, color: PROF.textMuted, marginTop: SPACING.lg, paddingHorizontal: SPACING.lg },
});
