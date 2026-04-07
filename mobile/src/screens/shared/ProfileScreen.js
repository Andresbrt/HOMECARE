/**
 * ProfileScreen — Perfil completo Homecare 2026
 * Refactorizado: usa computeLevel() compartido, avatar real, componentes extraídos.
 */
import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient }    from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard    from '../../components/shared/GlassCard';
import ProfileHeader     from '../../components/profile/ProfileHeader';
import QuickActionButtons from '../../components/profile/QuickActionButtons';
import { useAuth }  from '../../context/AuthContext';
import useModeStore from '../../store/modeStore';
import { PROF, SPACING, BORDER_RADIUS } from '../../constants/theme';

// ─── Fila de menú ─────────────────────────────────────────────────────────────
function MenuRow({ icon, title, subtitle, onPress, delay, accent, danger, badge }) {
  const scale = useSharedValue(1);
  const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ic    = danger ? PROF.error : accent ? PROF.accent : PROF.textSecondary;
  const bg    = danger ? 'rgba(255,91,91,0.12)' : accent ? 'rgba(73,192,188,0.15)' : 'rgba(255,255,255,0.06)';
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)} style={anim}>
      <TouchableOpacity
        onPress={() => {
          scale.value = withSpring(0.97, { damping: 16 }, () => { scale.value = withSpring(1); });
          Haptics.selectionAsync();
          onPress?.();
        }}
        activeOpacity={1} style={styles.menuRow}
      >
        <View style={[styles.menuIcon, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={19} color={ic} />
        </View>
        <View style={styles.menuText}>
          <Text style={[styles.menuTitle, danger && { color: PROF.error }, accent && { color: PROF.accent }]}>{title}</Text>
          {subtitle ? <Text style={styles.menuSub}>{subtitle}</Text> : null}
        </View>
        {badge ? (
          <View style={styles.menuBadge}><Text style={styles.menuBadgeText}>{badge}</Text></View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={PROF.textMuted} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const insets        = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { mode }      = useModeStore();
  const isUsuario     = mode === 'usuario';

  const logoutScale = useSharedValue(1);
  const logoutAnim  = useAnimatedStyle(() => ({ transform: [{ scale: logoutScale.value }] }));

  const handleLogout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
    ]);
  }, [logout]);

  const navigate = useCallback((screen) => navigation.navigate(screen), [navigation]);

  // Navegación consciente del modo: cada rol tiene su propia ruta nombrada
  const navSecurity    = isUsuario ? 'UserSecurity'      : 'ProfSecurity';
  const navHelp        = isUsuario ? 'UserHelpSupport'   : 'ProfHelpSupport';
  const navHistory     = isUsuario ? 'UserHistory'       : 'ProfHistory';
  const navNotifs      = isUsuario ? 'UserNotifications' : 'ProfNotifications';

  // Navegar a EditProfile
  const handleEditProfile = useCallback(() => {
    navigation.navigate('EditProfile');
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={PROF.bgDeep} />
      <LinearGradient colors={[PROF.bgDeep,'#0a2235', PROF.bg]} style={StyleSheet.absoluteFill} locations={[0,0.3,1]} />

      {/* ── Top bar ── */}
      <Animated.View entering={FadeIn.duration(350)} style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={PROF.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Mi Perfil</Text>
        <View style={[styles.modeBadge, !isUsuario && styles.modeBadgePro]}>
          <Ionicons name={isUsuario ? 'person-outline' : 'briefcase-outline'} size={11} color={isUsuario ? PROF.accent : '#FFD700'} />
          <Text style={[styles.modeBadgeText, !isUsuario && { color:'#FFD700' }]}>{isUsuario ? 'Usuario' : 'Profesional'}</Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar + nombre ── */}
        <Animated.View entering={FadeInDown.delay(80).springify().damping(16)}>
          <ProfileHeader user={user} onEditPress={handleEditProfile} />
        </Animated.View>

        {/* ── Botón Editar Perfil (funcional) ── */}
        <Animated.View entering={FadeInDown.delay(260).springify().damping(16)}>
          <TouchableOpacity
            onPress={handleEditProfile}
            activeOpacity={0.85}
          >
            <GlassCard variant="accent" style={styles.editProfileCard}>
              <Ionicons name="create-outline" size={20} color={PROF.accent} />
              <Text style={styles.editProfileText}>Editar Perfil</Text>
              <Ionicons name="chevron-forward" size={18} color={PROF.accent} />
            </GlassCard>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Botones Acción Rápida (solo usuario) — usando componente extraído ── */}
        {isUsuario && (
          <Animated.View entering={FadeInDown.delay(280).springify().damping(16)}>
            <QuickActionButtons navigation={navigation} />
          </Animated.View>
        )}

        {/* ── Menú actividades ── */}
        <Text style={styles.sectionLabel}>Actividad</Text>
        <GlassCard variant="default" style={styles.menuCard}>
          {isUsuario ? (
            <>
              <MenuRow icon="flash-outline"        title="Solicitar servicio"    subtitle="Limpieza General, Premium o Por Horas" onPress={() => navigate('UserQuickActions')} delay={340} accent />
              <View style={styles.sep} />
            </>
          ) : null}
          <MenuRow icon="time-outline"           title="Historial"             subtitle="Ver mis servicios pasados"  onPress={() => navigate(navHistory)}       delay={360} />
          <View style={styles.sep} />
          <MenuRow icon="notifications-outline"  title="Notificaciones"        subtitle="Alertas y avisos"           onPress={() => navigate(navNotifs)}  delay={380} />
        </GlassCard>

        {/* ── Menú cuenta ── */}
        <Text style={styles.sectionLabel}>Cuenta y Seguridad</Text>
        <GlassCard variant="default" style={styles.menuCard}>
          <MenuRow icon="shield-checkmark-outline" title="Seguridad"        subtitle="Contraseña, 2FA y dispositivos" onPress={() => navigate(navSecurity)}    delay={400} />
          <View style={styles.sep} />
          <MenuRow icon="help-circle-outline"      title="Ayuda y Soporte"  subtitle="FAQ, IA y contacto"             onPress={() => navigate(navHelp)}  delay={420} />
        </GlassCard>

        {/* ── Logout ── */}
        <Animated.View entering={FadeInDown.delay(450).springify()} style={logoutAnim}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            onPressIn={() => { logoutScale.value = withSpring(0.96, { damping: 14 }); }}
            onPressOut={() => { logoutScale.value = withSpring(1,    { damping: 14 }); }}
            activeOpacity={1}
          >
            <Ionicons name="log-out-outline" size={20} color={PROF.error} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.version}>Homecare v1.0.0 · 2026</Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: PROF.bgDeep },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: 8 },

  // Top bar
  topBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: 12 },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  topBarTitle:   { flex: 1, fontSize: 18, fontWeight: '700', color: PROF.textPrimary },
  modeBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(73,192,188,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(73,192,188,0.3)' },
  modeBadgePro:  { backgroundColor: 'rgba(255,215,0,0.12)', borderColor: 'rgba(255,215,0,0.3)' },
  modeBadgeText: { fontSize: 11, fontWeight: '600', color: PROF.accent },

  // Edit profile button
  editProfileCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  editProfileText: { flex: 1, fontSize: 15, fontWeight: '700', color: PROF.accent },

  // Quick buttons
  sectionLabel: { fontSize: 12, fontWeight: '700', color: PROF.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 12 },

  // Menu
  menuCard: { marginBottom: 4 },
  menuRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 4, gap: SPACING.sm },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1 },
  menuTitle:{ fontSize: 14, fontWeight: '600', color: PROF.textPrimary },
  menuSub:  { fontSize: 12, color: PROF.textSecondary, marginTop: 1 },
  menuBadge:{ backgroundColor: PROF.accent, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  menuBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  sep:      { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 48 },

  // Logout
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, paddingVertical: 14, borderRadius: BORDER_RADIUS.lg, backgroundColor: 'rgba(255,91,91,0.1)', borderWidth: 1, borderColor: 'rgba(255,91,91,0.2)' },
  logoutText: { fontSize: 15, fontWeight: '700', color: PROF.error },
  version:    { textAlign: 'center', fontSize: 11, color: PROF.textMuted, marginTop: 20 },
});
