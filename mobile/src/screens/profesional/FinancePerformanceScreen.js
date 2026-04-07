/**
 * FinancePerformanceScreen — Finanzas y Rendimiento combinados
 * Tabs internos: Finanzas | Rendimiento
 * Evita navegación excesiva — todo en una sola pantalla.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withRepeat, withSequence, withDelay, Easing, FadeInDown, FadeIn,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

// ─── Datos mock Finanzas ──────────────────────────────────────────────────────
const BALANCE = 328630;
const FIN_STATS = [
  { label: 'Hoy',    amount: '185.000', delta: '+12%' },
  { label: 'Semana', amount: '780.000', delta: '+8%'  },
  { label: 'Mes',    amount: '2.340.000', delta: '+22%' },
];
const TRANSACTIONS = [
  { id: '1', type: 'income', title: 'Colorimetría Interior', client: 'María G.', amount: 85000,  date: 'Hoy, 10:30 AM', icon: 'color-palette' },
  { id: '2', type: 'income', title: 'Análisis de Fachada',   client: 'Ana L.',   amount: 60000,  date: 'Hoy, 8:00 AM',  icon: 'home-outline' },
  { id: '3', type: 'withdrawal', title: 'Retiro a Bancolombia', client: null, amount: -120000, date: 'Ayer, 4:00 PM', icon: 'card-outline' },
  { id: '4', type: 'income', title: 'Diagnóstico Cromático', client: 'Laura M.', amount: 60000,  date: 'Ayer, 2:30 PM', icon: 'eye-outline' },
  { id: '5', type: 'bonus',  title: 'Bono Nivel Platino',    client: null, amount: 25000,  date: 'Lun, 9:00 AM',  icon: 'star' },
];

// ─── Datos mock Rendimiento ──────────────────────────────────────────────────
const WEEKLY = [
  { day: 'L', value: 0.6, svcs: 4 }, { day: 'M', value: 0.85, svcs: 6 },
  { day: 'X', value: 0.45, svcs: 3 }, { day: 'J', value: 1.0, svcs: 7 },
  { day: 'V', value: 0.75, svcs: 5 }, { day: 'S', value: 0.9, svcs: 6 },
  { day: 'D', value: 0.55, svcs: 4 },
];
const BAR_MAX = 80;
const METRICS = [
  { icon: 'star', label: 'Calificación', value: '4.9', sub: 'Promedio', color: '#F5A623' },
  { icon: 'checkmark-circle', label: 'Completados', value: '127', sub: 'Servicios', color: PROF.accent },
  { icon: 'trending-up', label: 'Tasa Éxito', value: '98%', sub: 'Confirmados', color: '#4CAF50' },
  { icon: 'time', label: 'Hrs Activo', value: '164', sub: 'Este mes', color: '#9C27B0' },
];
const REVIEWS = [
  { author: 'María García', text: 'Excelente servicio, muy profesional y puntual.', rating: 5, time: 'Hace 2 días' },
  { author: 'Laura Martínez', text: 'Llegó a tiempo y el trabajo fue de alta calidad.', rating: 5, time: 'Hace 4 días' },
  { author: 'Sandra Patiño', text: 'Buen servicio, aunque llegó un poco tarde.', rating: 4, time: 'Hace 1 semana' },
];

// ─── Componente: Tab Switcher ────────────────────────────────────────────────
function TabSwitcher({ activeTab, setActiveTab }) {
  const translateX = useSharedValue(activeTab === 0 ? 0 : 1);
  useEffect(() => {
    translateX.value = withSpring(activeTab === 0 ? 0 : 1, { damping: 16, stiffness: 200 });
  }, [activeTab]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(translateX.value, [0, 1], [4, 4]) }],
    left: `${interpolate(translateX.value, [0, 1], [0, 50])}%`,
  }));

  const handleTab = useCallback((tab) => {
    if (tab === activeTab) return;
    Haptics.selectionAsync();
    setActiveTab(tab);
  }, [activeTab, setActiveTab]);

  return (
    <View style={ts.container}>
      <Animated.View style={[ts.indicator, indicatorStyle]} />
      {[['Finanzas', 'wallet-outline'], ['Rendimiento', 'bar-chart-outline']].map(([label, icon], i) => (
        <TouchableOpacity
          key={label}
          style={[ts.tabBtn, activeTab === i && ts.tabBtnActive]}
          onPress={() => handleTab(i)}
          activeOpacity={0.75}
        >
          <Ionicons name={icon} size={16} color={activeTab === i ? PROF.accent : PROF.textMuted} />
          <Text style={[ts.tabLabel, activeTab === i && ts.tabLabelActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const ts = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BORDER_RADIUS.full,
    padding: 3,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '46%',
    backgroundColor: PROF.accentDim,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: PROF.accentGlow,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    zIndex: 1,
    borderRadius: BORDER_RADIUS.full,
  },
  tabBtnActive: {},
  tabLabel: { fontSize: 13, fontWeight: '600', color: PROF.textMuted },
  tabLabelActive: { color: PROF.accent },
});

// ─── Componente: Tarjeta de transacción ──────────────────────────────────────
function TxItem({ item, index }) {
  const pos = item.amount > 0;
  const bonus = item.type === 'bonus';
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(250)}>
      <GlassCard animated={false} style={fp.txCard} padding={SPACING.md}>
        <View style={fp.txRow}>
          <LinearGradient
            colors={bonus ? PROF.gradAccent : pos ? ['rgba(73,192,188,0.28)', 'rgba(73,192,188,0.08)'] : ['rgba(14,77,104,0.5)', 'rgba(0,27,56,0.8)']}
            style={fp.txIconWrap}
          >
            <Ionicons name={item.icon} size={17} color={bonus ? '#fff' : PROF.accent} />
          </LinearGradient>
          <View style={fp.txInfo}>
            <Text style={fp.txTitle}>{item.title}</Text>
            {item.client ? <Text style={fp.txClient}>{item.client}</Text> : null}
            <Text style={fp.txDate}>{item.date}</Text>
          </View>
          <Text style={[fp.txAmount, pos ? fp.txPos : fp.txNeg]}>
            {pos ? '+' : ''}COL$ {'\n'}{Math.abs(item.amount).toLocaleString('es-CO')}
          </Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Componente: Barra del gráfico ───────────────────────────────────────────
function BarItem({ data, index, isToday }) {
  const h = useSharedValue(0);
  const op = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(index * 70, withTiming(data.value * BAR_MAX, { duration: 500, easing: Easing.out(Easing.cubic) }));
    op.value = withDelay(index * 70, withTiming(1, { duration: 250 }));
  }, []);
  const barStyle = useAnimatedStyle(() => ({ height: h.value, opacity: op.value }));
  return (
    <View style={fp.barWrap}>
      <Text style={fp.barSvc}>{data.svcs}</Text>
      <Animated.View style={[fp.bar, barStyle]}>
        <LinearGradient colors={isToday ? PROF.gradAccent : ['rgba(73,192,188,0.5)', 'rgba(14,77,104,0.3)']} start={{x:0,y:0}} end={{x:0,y:1}} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Text style={[fp.barDay, isToday && fp.barDayActive]}>{data.day}</Text>
    </View>
  );
}

// ─── Componente: Tarjeta de métrica ──────────────────────────────────────────
function MetricCard({ icon, label, value, sub, color, index }) {
  const anim = useSharedValue(0);
  useEffect(() => { anim.value = withDelay(index * 80, withSpring(1, { damping: 16 })); }, []);
  const style = useAnimatedStyle(() => ({ opacity: anim.value, transform: [{ scale: anim.value }] }));
  return (
    <Animated.View style={[fp.metricWrap, style]}>
      <GlassCard>
        <View style={fp.metricInner}>
          <LinearGradient colors={[color + '33', color + '15']} style={fp.metricIcon}>
            <Ionicons name={icon} size={18} color={color} />
          </LinearGradient>
          <Text style={fp.metricVal}>{value}</Text>
          <Text style={fp.metricLabel}>{label}</Text>
          {sub && <Text style={fp.metricSub}>{sub}</Text>}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Componente: Reseña ──────────────────────────────────────────────────────
function ReviewItem({ review, index }) {
  const op = useSharedValue(0);
  useEffect(() => { op.value = withDelay(index * 100, withTiming(1, { duration: 350 })); }, []);
  const anim = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.View style={anim}>
      <GlassCard style={fp.reviewCard}>
        <View style={fp.reviewInner}>
          <View style={fp.reviewHead}>
            <View>
              <Text style={fp.reviewAuthor}>{review.author}</Text>
              <Text style={fp.reviewTime}>{review.time}</Text>
            </View>
            <View style={fp.reviewStars}>
              {[1,2,3,4,5].map(s => <Ionicons key={s} name={s <= review.rating ? 'star' : 'star-outline'} size={12} color={PROF.accent} />)}
            </View>
          </View>
          <Text style={fp.reviewText}>{review.text}</Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function FinancePerformanceScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState(0);

  // Animación del balance
  const balScale = useSharedValue(0.9);
  const loanPulse = useSharedValue(1);
  const loanGlow  = useSharedValue(0.4);
  useEffect(() => {
    balScale.value = withSpring(1, { damping: 14, stiffness: 100 });
    loanPulse.value = withRepeat(
      withSequence(withTiming(1.01, { duration: 1800, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) })),
      -1, true,
    );
    loanGlow.value = withRepeat(
      withSequence(withTiming(0.8, { duration: 1800 }), withTiming(0.3, { duration: 1800 })),
      -1, true,
    );
  }, []);

  const balStyle = useAnimatedStyle(() => ({ transform: [{ scale: balScale.value }] }));
  const loanPStyle = useAnimatedStyle(() => ({ transform: [{ scale: loanPulse.value }] }));
  const loanGStyle = useAnimatedStyle(() => ({ shadowOpacity: loanGlow.value }));

  const recargarScale = useSharedValue(1);
  const recStyle = useAnimatedStyle(() => ({ transform: [{ scale: recargarScale.value }] }));
  const handleRecargar = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    recargarScale.value = withSpring(0.93, { damping: 10 }, () => { recargarScale.value = withSpring(1); });
  }, []);

  // ── Tab: Finanzas ──
  const FinanzasTab = () => (
    <View>
      {/* Saldo principal */}
      <GlassCard variant="elevated" glow style={fp.balanceCard} padding={0}>
        <LinearGradient colors={['rgba(14,77,104,0.0)', 'rgba(0,27,56,0.45)']} style={StyleSheet.absoluteFill} />
        <View style={fp.decor1} /><View style={fp.decor2} />
        <View style={fp.balTop}>
          <Text style={fp.balLabel}>Saldo disponible</Text>
          <View style={fp.balBadge}>
            <Ionicons name="star" size={10} color={PROF.accent} />
            <Text style={fp.balBadgeText}>Platino</Text>
          </View>
        </View>
        <Animated.View style={balStyle}>
          <Text style={[fp.balAmount, { fontSize: Math.min(40, width * 0.1) }]}>
            COL$ {(BALANCE / 100).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </Text>
        </Animated.View>
        <View style={fp.balDelta}>
          <Ionicons name="trending-up" size={13} color={PROF.success} />
          <Text style={fp.balDeltaText}>+22% vs mes anterior</Text>
        </View>
        <View style={fp.balBtns}>
          <Animated.View style={[fp.balBtnFlex, recStyle]}>
            <TouchableOpacity onPress={handleRecargar} activeOpacity={0.85} style={fp.balBtnWrap}>
              <LinearGradient colors={PROF.gradAccent} style={fp.balBtnGrad}>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={fp.balBtnText}>Recargar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity activeOpacity={0.85} style={[fp.balBtnFlex, fp.balBtnOutlineWrap]}>
            <View style={fp.balBtnOutline}>
              <Ionicons name="arrow-up-circle-outline" size={18} color={PROF.accent} />
              <Text style={fp.balBtnOutlineText}>Retirar</Text>
            </View>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Stats rápidos */}
      <View style={fp.finStatsRow}>
        {FIN_STATS.map((s, i) => (
          <Animated.View key={s.label} entering={FadeInDown.delay(i * 80).duration(250)} style={fp.finStatFlex}>
            <GlassCard variant="accent" animated={false} padding={SPACING.md}>
              <Text style={fp.finStatLabel}>{s.label}</Text>
              <Text style={fp.finStatAmount}>COL$ {s.amount}</Text>
              <View style={fp.finStatDelta}>
                <Ionicons name="trending-up" size={10} color={PROF.success} />
                <Text style={fp.finStatDeltaText}>{s.delta}</Text>
              </View>
            </GlassCard>
          </Animated.View>
        ))}
      </View>

      {/* Préstamo */}
      <Animated.View style={[loanGStyle, { ...SHADOWS.glowStrong, shadowColor: PROF.accent, borderRadius: BORDER_RADIUS.xl, marginBottom: SPACING.md }]}>
        <Animated.View style={loanPStyle}>
          <GlassCard variant="elevated" animated={false} padding={0}>
            <LinearGradient colors={['rgba(73,192,188,0.18)', 'rgba(14,77,104,0.5)']} start={{x:0,y:0}} end={{x:1,y:1}} style={fp.loanGrad}>
              <View style={fp.loanLeft}>
                <LinearGradient colors={PROF.gradAccent} style={fp.loanIcon}>
                  <Ionicons name="briefcase" size={20} color="#fff" />
                </LinearGradient>
                <View style={fp.loanInfo}>
                  <Text style={fp.loanTitle}>Préstamo para equipo</Text>
                  <Text style={fp.loanSub}>Hasta COL$ 2.000.000 · Tasa 0% los primeros 30 días</Text>
                </View>
              </View>
              <TouchableOpacity style={fp.loanBtn} activeOpacity={0.8}>
                <Text style={fp.loanBtnText}>Ver oferta</Text>
                <Ionicons name="chevron-forward" size={13} color={PROF.accent} />
              </TouchableOpacity>
            </LinearGradient>
          </GlassCard>
        </Animated.View>
      </Animated.View>

      {/* Movimientos */}
      <Text style={fp.sectionTitle}>Movimientos recientes</Text>
      {TRANSACTIONS.map((tx, i) => <TxItem key={tx.id} item={tx} index={i} />)}
    </View>
  );

  // ── Tab: Rendimiento ──
  const RendimientoTab = () => {
    const progressW = useSharedValue(0);
    useEffect(() => { progressW.value = withTiming(89, { duration: 1000, easing: Easing.out(Easing.cubic) }); }, []);
    const progStyle = useAnimatedStyle(() => ({ width: `${progressW.value}%` }));

    return (
      <View>
        {/* Score general */}
        <GlassCard style={fp.scoreCard}>
          <LinearGradient colors={['rgba(73,192,188,0.15)', 'rgba(14,77,104,0.2)']} style={fp.scoreGrad}>
            <View style={fp.scoreLeft}>
              <Text style={fp.scoreNum}>4.9</Text>
              <View style={fp.scoreStars}>{[1,2,3,4,5].map(s => <Ionicons key={s} name="star" size={18} color={PROF.accent} />)}</View>
              <Text style={fp.scoreSub}>Basado en 127 servicios</Text>
            </View>
            <View style={fp.scoreRight}>
              {[5,4,3,2,1].map((r, i) => (
                <View key={r} style={fp.scoreRow}>
                  <Text style={fp.scoreRowNum}>{r}</Text>
                  <View style={fp.scoreBar}>
                    <View style={[fp.scoreBarFill, { width: `${[88,8,3,1,0][i]}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          </LinearGradient>
        </GlassCard>

        {/* Métricas 2x2 */}
        <View style={fp.metricsGrid}>
          {METRICS.map((m, i) => <MetricCard key={m.label} {...m} index={i} />)}
        </View>

        {/* Gráfico semanal */}
        <View style={fp.secHead}>
          <Text style={fp.secHeadTitle}>Servicios esta semana</Text>
          <View style={fp.weekBadge}><Text style={fp.weekBadgeText}>35 total</Text></View>
        </View>
        <GlassCard style={fp.chartCard}>
          <View style={fp.chartHead}>
            <Text style={fp.chartTitle}>Actividad diaria</Text>
          </View>
          <View style={fp.chartContainer}>
            {WEEKLY.map((d, i) => <BarItem key={d.day} data={d} index={i} isToday={i === 6} />)}
          </View>
        </GlassCard>

        {/* Nivel */}
        <GlassCard style={fp.levelCard}>
          <LinearGradient colors={PROF.gradCard} style={fp.levelContent}>
            <View style={fp.levelHead}>
              <LinearGradient colors={PROF.gradAccent} style={fp.levelBadge}>
                <Ionicons name="diamond" size={14} color="#fff" />
                <Text style={fp.levelBadgeText}>PLATINO</Text>
              </LinearGradient>
              <Text style={fp.levelScore}>89 puntos</Text>
            </View>
            <View style={fp.progressTrack}>
              <Animated.View style={[fp.progressFill, progStyle]}>
                <LinearGradient colors={PROF.gradAccent} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill} />
              </Animated.View>
            </View>
            <View style={fp.levelStats}>
              <View style={fp.levelStat}><Text style={fp.levelStatVal}>12</Text><Text style={fp.levelStatLabel}>Servicios</Text></View>
              <View style={fp.levelDivider} />
              <View style={fp.levelStat}><Text style={fp.levelStatVal}>15</Text><Text style={fp.levelStatLabel}>Meta semanal</Text></View>
              <View style={fp.levelDivider} />
              <View style={fp.levelStat}><Text style={fp.levelStatVal}>3</Text><Text style={fp.levelStatLabel}>Para Diamante</Text></View>
            </View>
          </LinearGradient>
        </GlassCard>

        {/* Reseñas */}
        <View style={fp.secHead}>
          <Text style={fp.secHeadTitle}>Reseñas recientes</Text>
          <TouchableOpacity><Text style={fp.secLink}>Ver todas</Text></TouchableOpacity>
        </View>
        {REVIEWS.map((r, i) => <ReviewItem key={r.author} review={r} index={i} />)}
      </View>
    );
  };

  return (
    <LinearGradient colors={PROF.gradMain} style={fp.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#000F22" />
      <SafeAreaView style={fp.safe}>
        {/* Header */}
        <View style={fp.header}>
          <TouchableOpacity onPress={() => navigation.getParent()?.openDrawer?.()} style={fp.menuBtn}>
            <Ionicons name="menu" size={28} color={PROF.textPrimary} />
          </TouchableOpacity>
          <Text style={fp.brandTitle}>FINANZAS</Text>
          <View style={{ width: 48 }} />
        </View>

        {/* Tab Switcher */}
        <View style={fp.tabSwitcherWrap}>
          <TabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />
        </View>

        {/* Content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={fp.scroll} key={activeTab}>
          {activeTab === 0 ? <FinanzasTab /> : <RendimientoTab />}
          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const fp = StyleSheet.create({
  screen: { flex: 1 }, safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, borderBottomWidth: 1, borderBottomColor: PROF.border },
  menuBtn: { padding: SPACING.sm },
  brandTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary, letterSpacing: 4 },
  tabSwitcherWrap: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  scroll: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },

  // Balance
  balanceCard: { marginBottom: SPACING.md, overflow: 'hidden' },
  decor1: { position: 'absolute', top: -60, right: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(73,192,188,0.06)' },
  decor2: { position: 'absolute', bottom: -30, left: 10, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(73,192,188,0.04)' },
  balTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  balLabel: { fontSize: TYPOGRAPHY.sm, color: PROF.textSecondary },
  balBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: PROF.accentDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, gap: 4 },
  balBadgeText: { fontSize: 10, color: PROF.accent, fontWeight: TYPOGRAPHY.bold },
  balAmount: { fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary, letterSpacing: -1, paddingHorizontal: SPACING.lg, marginTop: SPACING.sm },
  balDelta: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, marginTop: SPACING.xs, gap: 6 },
  balDeltaText: { fontSize: TYPOGRAPHY.xs, color: PROF.success },
  balBtns: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.lg, paddingTop: SPACING.md },
  balBtnFlex: { flex: 1 },
  balBtnWrap: { borderRadius: BORDER_RADIUS.md, overflow: 'hidden', ...SHADOWS.glow, shadowColor: PROF.accent },
  balBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, gap: 7 },
  balBtnText: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.bold, color: '#fff' },
  balBtnOutlineWrap: { borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: PROF.accentGlow },
  balBtnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, gap: 7 },
  balBtnOutlineText: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.bold, color: PROF.accent },

  // Fin stats
  finStatsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  finStatFlex: { flex: 1 },
  finStatLabel: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, marginBottom: 4 },
  finStatAmount: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary },
  finStatDelta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  finStatDeltaText: { fontSize: 10, color: PROF.success },

  // Loan
  loanGrad: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loanLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: SPACING.md },
  loanIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  loanInfo: { flex: 1 },
  loanTitle: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary },
  loanSub: { fontSize: TYPOGRAPHY.xs, color: PROF.textSecondary, marginTop: 3, lineHeight: 16 },
  loanBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: PROF.accentGlow, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 6, gap: 2 },
  loanBtnText: { fontSize: TYPOGRAPHY.xs, color: PROF.accent, fontWeight: TYPOGRAPHY.bold },

  // Transactions
  sectionTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.semibold, color: PROF.textPrimary, marginBottom: SPACING.sm, marginTop: SPACING.xs },
  txCard: { marginBottom: SPACING.sm },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  txIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txTitle: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold, color: PROF.textPrimary },
  txClient: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, marginTop: 2 },
  txDate: { fontSize: 10, color: PROF.textMuted, marginTop: 2 },
  txAmount: { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.bold, textAlign: 'right' },
  txPos: { color: PROF.success }, txNeg: { color: PROF.error },

  // Score
  scoreCard: { marginBottom: SPACING.md },
  scoreGrad: { flexDirection: 'row', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  scoreLeft: { flex: 1, alignItems: 'center' },
  scoreNum: { fontSize: 44, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary, lineHeight: 48 },
  scoreStars: { flexDirection: 'row', marginVertical: SPACING.xs },
  scoreSub: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, textAlign: 'center' },
  scoreRight: { flex: 1, paddingLeft: SPACING.md },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  scoreRowNum: { fontSize: 11, color: PROF.textMuted, width: 12, marginRight: 6 },
  scoreBar: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: '100%', backgroundColor: PROF.accent, borderRadius: 3 },

  // Metrics
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  metricWrap: { width: '47.5%' },
  metricInner: { padding: SPACING.md, alignItems: 'center' },
  metricIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  metricVal: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary },
  metricLabel: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, fontWeight: TYPOGRAPHY.medium, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricSub: { fontSize: 10, color: PROF.textMuted, marginTop: 2 },

  // Chart
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm, marginTop: SPACING.sm },
  secHeadTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary },
  secLink: { fontSize: TYPOGRAPHY.sm, color: PROF.accent },
  weekBadge: { backgroundColor: PROF.accentDim, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: BORDER_RADIUS.full },
  weekBadgeText: { fontSize: TYPOGRAPHY.xs, color: PROF.accent, fontWeight: TYPOGRAPHY.semibold },
  chartCard: { marginBottom: SPACING.md },
  chartHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, paddingBottom: 0 },
  chartTitle: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold, color: PROF.textPrimary },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, height: BAR_MAX + 50 },
  barWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '65%', borderTopLeftRadius: 6, borderTopRightRadius: 6, overflow: 'hidden' },
  barSvc: { fontSize: 10, color: PROF.textMuted, marginBottom: 4 },
  barDay: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, marginTop: 6, fontWeight: TYPOGRAPHY.medium },
  barDayActive: { color: PROF.accent, fontWeight: TYPOGRAPHY.bold },

  // Level
  levelCard: { marginBottom: SPACING.md },
  levelContent: { padding: SPACING.md, borderRadius: BORDER_RADIUS.lg },
  levelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  levelBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: BORDER_RADIUS.full },
  levelBadgeText: { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.bold, color: '#fff', marginLeft: 4, letterSpacing: 1 },
  levelScore: { fontSize: TYPOGRAPHY.sm, color: PROF.textSecondary, fontWeight: TYPOGRAPHY.medium },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: SPACING.md },
  progressFill: { height: '100%', borderRadius: 4, overflow: 'hidden' },
  levelStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  levelStat: { alignItems: 'center', flex: 1 },
  levelStatVal: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary },
  levelStatLabel: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, textAlign: 'center', marginTop: 2, lineHeight: 14 },
  levelDivider: { width: 1, height: 36, backgroundColor: PROF.border },

  // Reviews
  reviewCard: { marginBottom: SPACING.sm },
  reviewInner: { padding: SPACING.md },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs },
  reviewAuthor: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold, color: PROF.textPrimary },
  reviewTime: { fontSize: 10, color: PROF.textMuted, marginTop: 1 },
  reviewStars: { flexDirection: 'row' },
  reviewText: { fontSize: TYPOGRAPHY.sm, color: PROF.textSecondary, lineHeight: 19 },
});
