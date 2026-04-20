/**
 * Professional PerformanceScreen — Desempeño y Estadísticas
 * Métricas premium: calificaciones, horas activas, gráfico semanal
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { computeLevel, getQuarterLabel, MOTIVATIONAL_TEXT } from '../../utils/levelUtils';

// Datos del gráfico semanal (porcentaje de actividad)
const WEEKLY_DATA = [
  { day: 'L', value: 0.6, services: 4 },
  { day: 'M', value: 0.85, services: 6 },
  { day: 'X', value: 0.45, services: 3 },
  { day: 'J', value: 1.0, services: 7 },
  { day: 'V', value: 0.75, services: 5 },
  { day: 'S', value: 0.9, services: 6 },
  { day: 'D', value: 0.55, services: 4 }, // Hoy
];

// Altura máxima de las barras
const BAR_MAX_HEIGHT = 90;

function BarChart() {
  return (
    <View style={chart.container}>
      {WEEKLY_DATA.map((d, i) => (
        <BarItem key={d.day} data={d} index={i} isToday={i === 6} />
      ))}
    </View>
  );
}

function BarItem({ data, index, isToday }) {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 80;
    height.value = withDelay(
      delay,
      withTiming(data.value * BAR_MAX_HEIGHT, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));

  return (
    <View style={chart.barWrap}>
      <Text style={chart.services}>{data.services}</Text>
      <Animated.View style={[chart.bar, barStyle]}>
        <LinearGradient
          colors={isToday ? PROF.gradAccent : ['rgba(73,192,188,0.5)', 'rgba(14,77,104,0.3)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Text style={[chart.day, isToday && chart.dayActive]}>{data.day}</Text>
    </View>
  );
}

const chart = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    height: BAR_MAX_HEIGHT + 50,
  },
  barWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: {
    width: '65%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    overflow: 'hidden',
  },
  day: {
    fontSize: TYPOGRAPHY.xs,
    color: PROF.textMuted,
    marginTop: 6,
    fontWeight: TYPOGRAPHY.medium,
  },
  dayActive: { color: PROF.accent, fontWeight: TYPOGRAPHY.bold },
  services: { fontSize: 10, color: PROF.textMuted, marginBottom: 4 },
});

function MetricCard({ icon, label, value, sub, color, index }) {
  const anim = useSharedValue(0);

  useEffect(() => {
    anim.value = withDelay(index * 100, withSpring(1, { damping: 16 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: anim.value,
    transform: [{ scale: anim.value }],
  }));

  return (
    <Animated.View style={[styles.metricCard, style]}>
      <GlassCard>
        <View style={styles.metricInner}>
          <LinearGradient
            colors={[color + '33', color + '15']}
            style={styles.metricIcon}
          >
            <Ionicons name={icon} size={20} color={color} />
          </LinearGradient>
          <Text style={styles.metricVal}>{value}</Text>
          <Text style={styles.metricLabel}>{label}</Text>
          {sub && <Text style={styles.metricSub}>{sub}</Text>}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

function ReviewItem({ text, rating, author, time, index }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(index * 120, withTiming(1, { duration: 400 }));
  }, []);

  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={anim}>
      <GlassCard style={styles.reviewCard}>
        <View style={styles.reviewInner}>
          <View style={styles.reviewHeader}>
            <View>
              <Text style={styles.reviewAuthor}>{author}</Text>
              <Text style={styles.reviewTime}>{time}</Text>
            </View>
            <View style={styles.reviewStars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons
                  key={s}
                  name={s <= rating ? 'star' : 'star-outline'}
                  size={12}
                  color={PROF.accent}
                />
              ))}
            </View>
          </View>
          <Text style={styles.reviewText}>{text}</Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

export default function ProfPerformanceScreen({ navigation }) {
  const headerAnim = useSharedValue(0);

  useEffect(() => {
    headerAnim.value = withTiming(1, { duration: 500 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerAnim.value,
    transform: [{ translateY: (1 - headerAnim.value) * -20 }],
  }));

  const metrics = [
    { icon: 'star', label: 'Calificación', value: '4.9', sub: 'Promedio', color: '#F5A623', index: 0 },
    { icon: 'checkmark-circle', label: 'Completados', value: '127', sub: 'Total', color: PROF.accent, index: 1 },
    { icon: 'trending-up', label: 'Tasa Éxito', value: '98%', sub: 'Confirmados', color: '#4CAF50', index: 2 },
    { icon: 'time', label: 'Hrs Activo', value: '164', sub: 'Este mes', color: '#9C27B0', index: 3 },
  ];

  // Servicios del trimestre (mock — en producción: filtrar por fecha del trimestre desde backend)
  const serviciosTrimestre = 20;
  const quarterLabel = getQuarterLabel();
  const level = computeLevel(serviciosTrimestre);

  const reviews = [
    { author: 'María García', text: 'Excelente servicio, muy profesional y puntual. Quedé encantada con el resultado.', rating: 5, time: 'Hace 2 días', index: 0 },
    { author: 'Laura Martínez', text: 'Muy bueno, llegó a tiempo y el trabajo fue de alta calidad.', rating: 5, time: 'Hace 4 días', index: 1 },
    { author: 'Sandra Patiño', text: 'Buen servicio, aunque llegó un poco tarde.', rating: 4, time: 'Hace 1 semana', index: 2 },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[PROF.bg, '#060f1e']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <TouchableOpacity
            onPress={() => navigation.getParent()?.openDrawer?.()}
            style={styles.iconBtn}
          >
            <Ionicons name="menu" size={24} color={PROF.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Desempeño</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="share-social-outline" size={20} color={PROF.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Score general ── */}
          <GlassCard style={styles.scoreCard}>
            <LinearGradient
              colors={['rgba(73,192,188,0.15)', 'rgba(14,77,104,0.2)']}
              style={styles.scoreGradient}
            >
              <View style={styles.scoreLeft}>
                <Text style={styles.scoreNum}>4.9</Text>
                <View style={styles.scoreStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons key={s} name="star" size={18} color={PROF.accent} />
                  ))}
                </View>
                <Text style={styles.scoreSub}>Basado en 127 servicios</Text>
              </View>
              <View style={styles.scoreRight}>
                {[5, 4, 3, 2, 1].map((r, i) => (
                  <View key={r} style={styles.scoreRow}>
                    <Text style={styles.scoreRowNum}>{r}</Text>
                    <View style={styles.scoreBar}>
                      <View
                        style={[
                          styles.scoreBarFill,
                          { width: `${[88, 8, 3, 1, 0][i]}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </GlassCard>

          {/* ── Métricas ── */}
          <View style={styles.metricsGrid}>
            {metrics.map((m) => (
              <MetricCard key={m.label} {...m} />
            ))}
          </View>

          {/* ── Gráfico semanal ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Servicios esta semana</Text>
            <View style={styles.weekTotal}>
              <Text style={styles.weekTotalText}>35 total</Text>
            </View>
          </View>

          <GlassCard style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Actividad diaria</Text>
              <Text style={styles.chartSub}>Sem. del 9–15 de Marzo</Text>
            </View>
            <BarChart />
          </GlassCard>

          {/* ── Nivel e insignias ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nivel del Trimestre</Text>
            <Text style={styles.sectionSub}>{quarterLabel}</Text>
          </View>

          <GlassCard style={styles.levelCard}>
            <LinearGradient
              colors={[`${level.color}18`, `${level.color}06`]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.levelContent}
            >
              {/* Badge + texto motivacional */}
              <View style={styles.levelHeader}>
                <LinearGradient colors={level.gradColors} style={styles.levelBadge}>
                  <Ionicons name={level.icon} size={16} color="#fff" />
                  <Text style={styles.levelBadgeText}>{level.label.toUpperCase()}</Text>
                </LinearGradient>
                {level.nextLabel ? (
                  <Text style={styles.levelNextHint}>Siguiente: {level.nextLabel}</Text>
                ) : (
                  <Text style={[styles.levelNextHint, { color: level.color }]}>★ Máximo nivel</Text>
                )}
              </View>

              {/* Barra de progreso */}
              <LevelProgressBar progress={level.progress} color={level.color} />

              {/* Motivacional */}
              <Text style={styles.levelMotivo}>{level.motivo}</Text>

              {/* Bono visibilidad */}
              <View style={styles.visiBonusRow}>
                <Ionicons name="eye" size={12} color={level.color} />
                <Text style={[styles.visiBonusText, { color: level.color }]}>
                  {level.visibilityBonus > 0
                    ? `+${level.visibilityBonus}% visibilidad extra en solicitudes cercanas`
                    : 'Visibilidad base — sube a Pro para +5%'}
                </Text>
              </View>

              {/* Stats trimestre */}
              <View style={styles.levelStats}>
                <View style={styles.levelStat}>
                  <Text style={styles.levelStatVal}>{serviciosTrimestre}</Text>
                  <Text style={styles.levelStatLabel}>Este trimestre</Text>
                </View>
                <View style={styles.levelDivider} />
                <View style={styles.levelStat}>
                  <Text style={styles.levelStatVal}>{level.next ?? '∞'}</Text>
                  <Text style={styles.levelStatLabel}>Meta siguiente</Text>
                </View>
                <View style={styles.levelDivider} />
                <View style={styles.levelStat}>
                  <Text style={[styles.levelStatVal, { color: level.remaining === 0 ? level.color : PROF.textPrimary }]}>
                    {level.remaining === 0 ? '★' : level.remaining}
                  </Text>
                  <Text style={styles.levelStatLabel}>
                    {level.remaining === 0 ? 'Nível máximo' : `Para ${level.nextLabel}`}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </GlassCard>

          {/* ── Reseñas recientes ── */}}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reseñas recientes</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {reviews.map((r) => (
            <ReviewItem key={r.author} {...r} />
          ))}

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function LevelProgressBar({ progress, color }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress * 100, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, barStyle]}>
        <LinearGradient
          colors={color ? [color, color + 'cc'] : PROF.gradAccent}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PROF.bg },
  scroll: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingTop: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: PROF.textPrimary,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PROF.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PROF.border,
  },

  // Score card
  scoreCard: { marginBottom: SPACING.md },
  scoreGradient: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  scoreLeft: { flex: 1, alignItems: 'center' },
  scoreNum: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.bold,
    color: PROF.textPrimary,
    lineHeight: 52,
  },
  scoreStars: { flexDirection: 'row', marginVertical: SPACING.xs },
  scoreSub: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, textAlign: 'center' },
  scoreRight: { flex: 1, paddingLeft: SPACING.md },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  scoreRowNum: { fontSize: 11, color: PROF.textMuted, width: 12, marginRight: 6 },
  scoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: PROF.accent,
    borderRadius: 3,
  },

  // Metrics grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  metricCard: { width: '47.5%' },
  metricInner: { padding: SPACING.md, alignItems: 'center' },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  metricVal: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: TYPOGRAPHY.bold,
    color: PROF.textPrimary,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: PROF.textMuted,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricSub: { fontSize: 10, color: PROF.textMuted, marginTop: 2 },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: PROF.textPrimary,
  },
  sectionLink: { fontSize: TYPOGRAPHY.sm, color: PROF.accent },
  weekTotal: {
    backgroundColor: PROF.accentDim,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  weekTotalText: { fontSize: TYPOGRAPHY.xs, color: PROF.accent, fontWeight: TYPOGRAPHY.semibold },

  // Chart
  chartCard: { marginBottom: SPACING.md },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingBottom: 0,
  },
  chartTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: PROF.textPrimary,
  },
  chartSub: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted },

  // Level card
  levelCard: { marginBottom: SPACING.md },
  levelContent: { padding: SPACING.md, borderRadius: BORDER_RADIUS.lg },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  levelBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: '#fff',
    marginLeft: 4,
    letterSpacing: 1,
  },
  levelScore: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
  },
  levelNextHint: {
    fontSize: TYPOGRAPHY.xs,
    color: PROF.textMuted,
    fontWeight: TYPOGRAPHY.medium,
  },
  levelMotivo: {
    fontSize: TYPOGRAPHY.xs,
    color: PROF.textSecondary,
    marginBottom: SPACING.xs,
    lineHeight: 16,
  },
  visiBonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 6,
  },
  visiBonusText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  levelStat: { alignItems: 'center', flex: 1 },
  levelStatVal: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: PROF.textPrimary,
  },
  levelStatLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: PROF.textMuted,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 14,
  },
  levelDivider: {
    width: 1,
    height: 36,
    backgroundColor: PROF.border,
  },

  // Reviews
  reviewCard: { marginBottom: SPACING.sm },
  reviewInner: { padding: SPACING.md },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  reviewAuthor: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: PROF.textPrimary,
  },
  reviewTime: { fontSize: 10, color: PROF.textMuted, marginTop: 1 },
  reviewStars: { flexDirection: 'row' },
  reviewText: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textSecondary,
    lineHeight: 19,
  },
});
