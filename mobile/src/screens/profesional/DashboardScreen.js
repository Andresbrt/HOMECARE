/**
 * Professional DashboardScreen — Nivel Platino Homecare
 * Diseño dark premium futurista 2026
 */
import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../../components/shared/GlassCard';
import { useAuth } from '../../context/AuthContext';
import useChatStore from '../../store/chatStore';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import ScreenLayout from '../../components/shared/ScreenLayout';

// ─── Constantes ──────────────────────────────────────────────────────────────
const WEEKLY_TARGET = 15;

export default function ProfDashboardScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const unreadTotal    = useChatStore((s) => s.unreadTotal ?? 0);
  const activeService   = useChatStore((s) => s.activeService);
  const [isAvailable, setIsAvailable] = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(null); // 'chats' | 'chatear' | null

  // Animaciones
  const glowAnim     = useSharedValue(0.35);
  const fabScale     = useSharedValue(0);
  const fabChatScale = useSharedValue(0);
  const toggleScale  = useSharedValue(1);
  const progressAnim = useSharedValue(0);

  const weeklyServices = 12;
  const progressPct = weeklyServices / WEEKLY_TARGET;

  // Progress animación
  useEffect(() => {
    progressAnim.value = withTiming(progressPct, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  // Glow pulsante cuando está disponible
  useEffect(() => {
    if (isAvailable) {
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 1200 }),
          withTiming(0.35, { duration: 1200 }),
        ),
        -1,
        true,
      );
    } else {
      glowAnim.value = withTiming(0.2, { duration: 400 });
    }
  }, [isAvailable]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowAnim.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressAnim.value, [0, 1], [0, 100])}%`,
  }));

  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
    opacity: fabScale.value,
  }));

  const fabChatAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabChatScale.value }],
    opacity: fabChatScale.value,
  }));

  // FAB “Mis chats” aparece al montar con resorte suave
  useEffect(() => {
    fabScale.value = withSpring(1, { damping: 14, stiffness: 160, mass: 0.8 });
  }, []);

  // FAB “Chatear” aparece/desaparece con spring + overshoot
  useEffect(() => {
    fabChatScale.value = withSpring(activeService ? 1 : 0, {
      damping: 14, stiffness: 200, mass: 0.7,
    });
  }, [activeService]);

  // Navegar: si hay activeService → Chat directo; si no → ChatList
  const handleOpenChats = () => {
    setTooltipVisible(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeService) {
      navigation.navigate('Chat', {
        solicitudId:    activeService.solicitudId,
        destinatarioId: activeService.destinatarioId,
        titulo:         activeService.titulo ?? 'Chat',
      });
    } else {
      navigation.navigate('ChatList');
    }
  };

  const handleOpenActiveChat = () => {
    if (!activeService) return;
    setTooltipVisible(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('Chat', {
      solicitudId:    activeService.solicitudId,
      destinatarioId: activeService.destinatarioId,
      titulo:         activeService.titulo ?? 'Servicio activo',
    });
  };

  const toggleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: toggleScale.value }],
  }));

  const handleToggleAvailable = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    toggleScale.value = withSpring(0.92, { damping: 10 }, () => {
      toggleScale.value = withSpring(1, { damping: 12 });
    });
    setIsAvailable((prev) => !prev);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1400);
  }, []);

  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const mockActivity = [
    { type: 'Limpieza Básica', address: 'Cra 15 #82-45, Bogotá', amount: 'COL$ 45.000', status: 'COMPLETADO' },
    { type: 'Limpieza Profunda', address: 'Cll 100 #19-25, Bogotá', amount: 'COL$ 85.000', status: 'COMPLETADO' },
    { type: 'Limpieza Oficina', address: 'Av El Dorado #90-35', amount: 'COL$ 120.000', status: 'COMPLETADO' },
    // { type: 'Colorimetría Interior', address: 'Cra 15 #82-45, Bogotá', amount: 'COL$ 85.000', status: 'COMPLETADO' },
    // { type: 'Análisis de Fachada', address: 'Cll 100 #19-25, Bogotá', amount: 'COL$ 60.000', status: 'COMPLETADO' },
    // { type: 'Diagnóstico Cromático', address: 'Av El Dorado #90-35', amount: 'COL$ 40.000', status: 'COMPLETADO' },
  ];

  return (
    <ScreenLayout backgroundColor={PROF.background} top={true}>
      <LinearGradient colors={PROF.gradMain} style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor="#000F22" />

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.getParent()?.openDrawer?.()} style={styles.menuBtn}>
            <Ionicons name="menu" size={28} color={PROF.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.brandTitle}>HOMECARE</Text>

          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={26} color={PROF.textPrimary} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PROF.accent} />
          }
        >
          {/* SALUDO */}
          <View style={styles.greeting}>
            <Text style={styles.greetingHola}>Hola, {user?.nombre || 'Profesional'} 👋</Text>
            <Text style={styles.greetingDate}>{today}</Text>
          </View>

          {/* TOGGLE DISPONIBILIDAD */}
          <Animated.View style={[styles.toggleWrapper, glowStyle]}>
            {/* toggleStyle aplicado aquí para que la animación de escala funcione */}
            <Animated.View style={[toggleStyle, { borderRadius: BORDER_RADIUS.xl }]}>
              <TouchableOpacity onPress={handleToggleAvailable} activeOpacity={0.9} style={styles.toggleOuter}>
                <LinearGradient
                  colors={isAvailable ? PROF.gradAccent : ['rgba(14,77,104,0.4)', 'rgba(0,27,56,0.9)']}
                  style={styles.toggleGradient}
                >
                  <View style={[styles.toggleDot, isAvailable && styles.toggleDotActive, { width: Math.min(48, width * 0.12), height: Math.min(48, width * 0.12), borderRadius: Math.min(24, width * 0.06) }]}>
                    <Ionicons
                      name={isAvailable ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.toggleText}>
                    <Text style={styles.toggleTitle}>
                      {isAvailable ? 'Disponible para servicios' : 'Desconectado'}
                    </Text>
                    <Text style={styles.toggleSub}>
                      {isAvailable ? 'Recibirás solicitudes cercanas' : 'Toca para activarte'}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* INGRESOS DE HOY */}
          <GlassCard variant="elevated" glow style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <View>
                <Text style={styles.earningsLabel}>Ingresos de Hoy</Text>
                <Text style={[styles.earningsAmount, { fontSize: Math.min(42, width * 0.1) }]}>COL$ 185.000</Text>
                <View style={styles.earningsDelta}>
                  <Ionicons name="trending-up" size={14} color={PROF.success} />
                  <Text style={styles.earningsDeltaText}>+12% vs ayer · 4 servicios</Text>
                </View>
              </View>
              <LinearGradient colors={PROF.gradAccent} style={[styles.earningsIcon, { width: Math.min(60, width * 0.15), height: Math.min(60, width * 0.15), borderRadius: Math.min(30, width * 0.075) }]}>
                <Ionicons name="cash-outline" size={28} color="#fff" />
              </LinearGradient>
            </View>
          </GlassCard>

          {/* NIVEL PLATINO */}
          <GlassCard variant="elevated" glow style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <Ionicons name="star" size={16} color={PROF.accent} />
                <Text style={styles.levelBadgeText}>Nivel Platino Homecare</Text>
              </View>
              <Text style={styles.levelPct}>{Math.round(progressPct * 100)}%</Text>
            </View>

            <View style={styles.progressBg}>
              <Animated.View style={[styles.progressBar, progressStyle]} />
            </View>

            <Text style={styles.levelSub}>
              {weeklyServices} de {WEEKLY_TARGET} servicios esta semana
            </Text>
          </GlassCard>

          {/* STATS RÁPIDAS */}
          <View style={styles.statsRow}>
            <GlassCard variant="accent" style={styles.statCardSmall}>
              <Ionicons name="star" size={22} color={PROF.accent} />
              <Text style={styles.statValue}>4.9</Text>
              <Text style={styles.statLabel}>Calificación</Text>
            </GlassCard>

            <GlassCard variant="accent" style={styles.statCardSmall}>
              <Ionicons name="checkmark-circle" size={22} color={PROF.accent} />
              <Text style={styles.statValue}>127</Text>
              <Text style={styles.statLabel}>Completados</Text>
            </GlassCard>

            <GlassCard variant="accent" style={styles.statCardSmall}>
              <Ionicons name="trending-up" size={22} color={PROF.accent} />
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>Tasa éxito</Text>
            </GlassCard>
          </View>

          {/* ACTIVIDAD RECIENTE */}
          <GlassCard variant="elevated" style={styles.activityCard}>
            <Text style={styles.sectionTitle}>Actividad Reciente</Text>
            {mockActivity.map((item, i) => (
              <View key={i} style={styles.activityItem}>
                <Text style={styles.activityType}>{item.type}</Text>
                <Text style={styles.activityAddress}>{item.address}</Text>
                <Text style={styles.activityAmount}>{item.amount}</Text>
              </View>
            ))}
          </GlassCard>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FAB — Chatear (solo cuando hay servicio activo en curso) */}
        <Animated.View
          style={[styles.fabChat, fabChatAnimStyle]}
          pointerEvents={activeService ? 'auto' : 'none'}
        >
          {/* Tooltip */}
          {tooltipVisible === 'chatear' && (
            <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                {activeService?.titulo ? `Chatear con ${activeService.titulo}` : 'Ir al chat activo'}
              </Text>
            </Animated.View>
          )}
          <TouchableOpacity
            onPress={handleOpenActiveChat}
            onLongPress={() => setTooltipVisible('chatear')}
            onPressOut={() => setTooltipVisible(null)}
            activeOpacity={0.82}
            style={styles.fabInner}
          >
            <LinearGradient colors={['#1A7741', '#27AE60']} style={styles.fabGradient}>
              <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
              <Text style={styles.fabLabel}>Chatear</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* FAB — Mis Chats */}
        <Animated.View style={[styles.fab, fabAnimStyle]}>
          {/* Tooltip */}
          {tooltipVisible === 'chats' && (
            <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                {activeService ? 'Chat activo — toca para ir' : 'Ver todas las conversaciones'}
              </Text>
            </Animated.View>
          )}
          <TouchableOpacity
            onPress={handleOpenChats}
            onLongPress={() => setTooltipVisible('chats')}
            onPressOut={() => setTooltipVisible(null)}
            activeOpacity={0.82}
            style={styles.fabInner}
          >
            <LinearGradient colors={PROF.gradAccent} style={styles.fabGradient}>
              <Ionicons name="chatbubbles" size={24} color="#fff" />
              <Text style={styles.fabLabel}>{activeService ? 'Chat activo' : 'Mis chats'}</Text>
            </LinearGradient>
            {unreadTotal > 0 && (
              <View style={styles.fabBadge}>
                <Text style={styles.fabBadgeText}>{unreadTotal > 99 ? '99+' : unreadTotal}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </ScreenLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: PROF.border,
  },
  brandTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold,
    color: PROF.textPrimary,
    letterSpacing: 4,
  },
  menuBtn: { padding: SPACING.sm },
  bellBtn: { position: 'relative', padding: SPACING.sm },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: PROF.accent,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  scroll: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },

  greeting: { marginBottom: SPACING.xl },
  greetingHola: { fontSize: TYPOGRAPHY.xxxl, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary },
  greetingDate: { fontSize: TYPOGRAPHY.sm, color: PROF.textSecondary, textTransform: 'capitalize' },

  toggleWrapper: {
    ...SHADOWS.glowStrong,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: PROF.accent,
  },
  toggleOuter: { borderRadius: BORDER_RADIUS.xl, overflow: 'hidden' },
  toggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  toggleDot: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  toggleDotActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  toggleText: { flex: 1 },
  toggleTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold, color: '#fff' },
  toggleSub: { fontSize: TYPOGRAPHY.xs, color: 'rgba(255,255,255,0.75)', marginTop: 3 },

  earningsCard: { marginBottom: SPACING.md },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  earningsLabel: { fontSize: TYPOGRAPHY.sm, color: PROF.textSecondary, marginBottom: 4 },
  earningsAmount: { fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary, letterSpacing: -1 },
  earningsDelta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  earningsDeltaText: { fontSize: TYPOGRAPHY.xs, color: PROF.success, marginLeft: 6 },
  earningsIcon: { alignItems: 'center', justifyContent: 'center' },

  levelCard: { marginBottom: SPACING.md },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PROF.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  levelBadgeText: { marginLeft: 6, color: PROF.accent, fontWeight: TYPOGRAPHY.semibold, fontSize: TYPOGRAPHY.xs },
  levelPct: { fontSize: TYPOGRAPHY.lg, color: PROF.accent, fontWeight: TYPOGRAPHY.bold },
  progressBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    marginHorizontal: SPACING.md,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', backgroundColor: PROF.accent },
  levelSub: {
    fontSize: TYPOGRAPHY.xs,
    color: PROF.textSecondary,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    fontWeight: TYPOGRAPHY.medium,
  },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCardSmall: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary, marginTop: SPACING.xs },
  statLabel: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, marginTop: 2, textAlign: 'center' },

  activityCard: { marginBottom: SPACING.md },
  sectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: PROF.textPrimary,
    marginBottom: SPACING.sm,
  },
  activityItem: { paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: PROF.border },
  activityType: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.semibold, color: PROF.textPrimary },
  activityAddress: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, marginTop: 2 },
  activityAmount: { fontSize: TYPOGRAPHY.md, color: PROF.accent, fontWeight: TYPOGRAPHY.bold, marginTop: 4 },

  // ── FAB Mis Chats ─────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
    zIndex: 99,
    ...SHADOWS.glowStrong,
    shadowColor: PROF.accent,
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 14,
  },
  fabInner: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'visible',
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.sm,
  },
  fabLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    color: '#fff',
    letterSpacing: 0.5,
  },
  fabBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B5C',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: PROF.background,
  },
  fabBadgeText: { fontSize: 10, color: '#fff', fontWeight: '800' },

  // ── Tooltip ────────────────────────────────────────────────────────────
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: 8,
    backgroundColor: 'rgba(0,15,34,0.92)',
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    maxWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipText: {
    fontSize: TYPOGRAPHY.xs,
    color: PROF.textPrimary,
    fontWeight: TYPOGRAPHY.medium,
    textAlign: 'right',
  },

  // ── FAB Chatear (verde, posicionado encima de Mis Chats) ─────────────────
  fabChat: {
    position: 'absolute',
    bottom: SPACING.xl + 68,
    right: SPACING.lg,
    zIndex: 99,
    ...SHADOWS.glowStrong,
    shadowColor: '#27AE60',
    shadowOpacity: 0.65,
    shadowRadius: 16,
    elevation: 12,
  },
});

