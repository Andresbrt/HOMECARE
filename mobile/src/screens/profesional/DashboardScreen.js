/**
 * Professional DashboardScreen — Nivel Platino Homecare
 * Diseño dark premium futurista 2026
 */
import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../../components/shared/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import ScreenLayout from '../../components/shared/ScreenLayout';

// ─── Constantes ──────────────────────────────────────────────────────────────
const WEEKLY_TARGET = 15;

export default function ProfDashboardScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animaciones
  const glowAnim = useSharedValue(0.35);
  const toggleScale = useSharedValue(1);
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

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
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
});

