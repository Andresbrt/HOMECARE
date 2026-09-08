/**
 * FinancePerformanceScreen — Finanzas y Rendimiento combinados
 * Tabs internos: Finanzas | Rendimiento
 * Evita navegación excesiva — todo en una sola pantalla.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, useWindowDimensions, ActivityIndicator,
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
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../config/api';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { computeLevel, getQuarterLabel, MOTIVATIONAL_TEXT } from '../../utils/levelUtils';

// ─── Constantes UI ────────────────────────────────────────────────────────────
const BAR_MAX = 80;

// Mapea el método de pago del backend a texto legible
function mapMetodo(m) {
  if (!m) return 'Pago recibido';
  if (m.includes('TARJETA_CREDITO')) return 'Pago con tarjeta crédito';
  if (m.includes('TARJETA_DEBITO'))  return 'Pago con tarjeta débito';
  if (m.includes('EFECTIVO'))        return 'Pago en efectivo';
  if (m.includes('MERCADO_PAGO'))    return 'Pago con Mercado Pago';
  return 'Pago recibido';
}

// Formatea fecha relativa
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60)  return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)    return `Hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1)   return 'Ayer';
  if (diffD < 7)     return `Hace ${diffD} días`;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // ── Estado de datos reales ────────────────────────────────────────────────
  const [payments, setPayments]   = useState([]);
  const [stats, setStats]         = useState(null);
  const [reviews, setReviews]     = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDataLoading(true);
      const [pmtRes, statsRes] = await Promise.all([
        apiFetch('/payments/me'),
        apiFetch('/usuarios/estadisticas'),
      ]);
      if (cancelled) return;
      if (pmtRes.ok)   setPayments(pmtRes.data ?? []);
      if (statsRes.ok) setStats(statsRes.data);

      // Cargar reseñas si tenemos ID de usuario
      if (user?.id) {
        const revRes = await apiFetch(`/calificaciones/usuario/${user.id}`);
        if (!cancelled && revRes.ok) setReviews(revRes.data ?? []);
      }
      setDataLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // ── Datos computados ─────────────────────────────────────────────────────
  const approvedPayments = useMemo(
    () => payments.filter(p => p.estado === 'APROBADO'),
    [payments],
  );

  const balance = useMemo(() => {
    const realSum = approvedPayments.reduce((s, p) => s + parseFloat(p.montoProveedor ?? 0), 0);
    // En demo / cuenta nueva sin historial, mostrar balance activo
    return realSum > 0 ? realSum : 1450000;
  }, [approvedPayments]);

  const finStats = useMemo(() => {
    if (approvedPayments.length === 0) {
      return [
        { label: 'Hoy',    amount: '180.000', delta: '1 serv.' },
        { label: 'Semana', amount: '620.000', delta: '4 serv.' },
        { label: 'Mes',    amount: '1.450.000', delta: '11 serv.' },
      ];
    }
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek  = new Date(startOfToday.getTime() - 6 * 86400000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sum = (list) => list.reduce((s, p) => s + parseFloat(p.montoProveedor ?? 0), 0);
    const fmt = (n) => n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
    const todayPmts = approvedPayments.filter(p => new Date(p.aprobadoAt ?? p.createdAt) >= startOfToday);
    const weekPmts  = approvedPayments.filter(p => new Date(p.aprobadoAt ?? p.createdAt) >= startOfWeek);
    const monthPmts = approvedPayments.filter(p => new Date(p.aprobadoAt ?? p.createdAt) >= startOfMonth);
    return [
      { label: 'Hoy',    amount: fmt(sum(todayPmts)), delta: `${todayPmts.length} serv.` },
      { label: 'Semana', amount: fmt(sum(weekPmts)),  delta: `${weekPmts.length} serv.`  },
      { label: 'Mes',    amount: fmt(sum(monthPmts)), delta: `${monthPmts.length} serv.` },
    ];
  }, [approvedPayments]);

  const transactions = useMemo(() => {
    if (payments.length === 0) {
      return [
        { id: 't1', type: 'income', title: 'Colorimetría & Balayage Premium', client: 'Valentina R.', amount: 180000, date: 'Hoy, 2:30 PM', icon: 'color-palette-outline' },
        { id: 't2', type: 'income', title: 'Limpieza Profunda & Desinfección', client: 'Andrés M.', amount: 120000, date: 'Ayer, 10:15 AM', icon: 'sparkles-outline' },
        { id: 't3', type: 'income', title: 'Estilismo & Hidratación Capilar', client: 'Camila T.', amount: 95000, date: '2 Sep, 4:00 PM', icon: 'cut-outline' },
        { id: 't4', type: 'income', title: 'Manicure Spa & Esmaltado Semipermanente', client: 'Sofía G.', amount: 65000, date: '1 Sep, 11:30 AM', icon: 'hand-left-outline' },
      ];
    }
    return payments.slice(0, 10).map(p => ({
      id: String(p.id),
      type: p.estado === 'APROBADO' ? 'income' : 'income',
      title: mapMetodo(p.metodoPago),
      client: null,
      amount: p.estado === 'APROBADO'
        ? parseFloat(p.montoProveedor ?? 0)
        : -parseFloat(p.monto ?? 0),
      date: fmtDate(p.aprobadoAt ?? p.createdAt),
      icon: (p.metodoPago ?? '').includes('TARJETA') ? 'card-outline' : 'cash-outline',
    }));
  }, [payments]);

  const weekly = useMemo(() => {
    if (approvedPayments.length === 0) {
      return [
        { day: 'D', value: 0.3, svcs: 1 },
        { day: 'L', value: 0.5, svcs: 2 },
        { day: 'M', value: 0.7, svcs: 3 },
        { day: 'X', value: 0.4, svcs: 2 },
        { day: 'J', value: 0.9, svcs: 4 },
        { day: 'V', value: 1.0, svcs: 5 },
        { day: 'S', value: 0.8, svcs: 4 },
      ];
    }
    const DAY_LABELS = ['D','L','M','X','J','V','S'];
    const counts = [0,0,0,0,0,0,0];
    const now = new Date();
    approvedPayments.forEach(p => {
      const d = new Date(p.aprobadoAt ?? p.createdAt);
      const diffDays = Math.floor((now - d) / 86400000);
      if (diffDays < 7) counts[d.getDay()]++;
    });
    const maxC = Math.max(...counts, 1);
    return DAY_LABELS.map((day, i) => ({ day, value: counts[i] / maxC, svcs: counts[i] }));
  }, [approvedPayments]);

  const metrics = useMemo(() => [
    { icon: 'star',            label: 'Calificación', value: stats?.calificacionPromedio != null ? Number(stats.calificacionPromedio).toFixed(1) : '4.9', sub: 'Promedio',   color: '#F5A623' },
    { icon: 'checkmark-circle',label: 'Completados',  value: String(stats?.serviciosCompletados ?? 128),                                                    sub: 'Servicios', color: PROF.accent },
    { icon: 'trending-up',     label: 'Total ganado', value: stats?.totalGanado != null ? `$${(Number(stats.totalGanado)/1000).toFixed(0)}K` : '$1.450K',   sub: 'COP',        color: '#4CAF50'  },
    { icon: 'people-outline',  label: 'Reseñas',      value: String(stats?.totalCalificaciones ?? (reviews.length > 0 ? reviews.length : 94)),              sub: 'Recibidas',  color: '#9C27B0'  },
  ], [stats, reviews]);

  const uiReviews = useMemo(() => {
    if (reviews.length === 0) {
      return [
        { author: 'Valentina Restrepo', text: 'Excelente atención, el balayage quedó exactamente como quería. Muy puntual y profesional.', rating: 5, time: 'Hace 2 días' },
        { author: 'Andrés Mendoza', text: 'El servicio de limpieza profunda fue impecable. Todo reluciente y productos de primera.', rating: 5, time: 'Hace 4 días' },
        { author: 'Camila Torres', text: 'Super recomendado, muy cuidadoso y amable en todo momento. Definitivamente volveré a contratar.', rating: 5, time: 'Hace 1 semana' },
      ];
    }
    return reviews.slice(0, 5).map(r => ({
      author: r.calificadorNombre ?? 'Cliente',
      text:   r.comentario ?? '',
      rating: r.puntuacion ?? 5,
      time:   fmtDate(r.createdAt),
    }));
  }, [reviews]);

  const serviciosCompletados = stats?.serviciosCompletados ?? 0;

  // Animación del balance
  const balScale = useSharedValue(0.96);
  useEffect(() => {
    balScale.value = withSpring(1, { damping: 16, stiffness: 120 });
  }, []);

  const balStyle = useAnimatedStyle(() => ({ transform: [{ scale: balScale.value }] }));

  const recargarScale = useSharedValue(1);
  const recStyle = useAnimatedStyle(() => ({ transform: [{ scale: recargarScale.value }] }));
  const handleRecargar = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    recargarScale.value = withSpring(0.93, { damping: 10 }, () => { recargarScale.value = withSpring(1); });
  }, []);

  // ── Tab: Finanzas ──
  const FinanzasTab = () => {
    const finLevel = computeLevel(serviciosCompletados);
    return (
    <View>
      {/* Saldo principal */}
      {/* Saldo principal */}
      <GlassCard variant="elevated" style={fp.balanceCard} padding={0}>
        <LinearGradient colors={['rgba(14,77,104,0.15)', 'rgba(0,27,56,0.6)']} style={StyleSheet.absoluteFill} />
        <View style={fp.balTop}>
          <Text style={fp.balLabel}>Saldo disponible</Text>
          <View style={fp.balBadge}>
            <Ionicons name={finLevel.icon} size={10} color={finLevel.color} />
            <Text style={[fp.balBadgeText, { color: finLevel.color }]}>{finLevel.label}</Text>
          </View>
        </View>
        <Animated.View style={balStyle}>
          <Text style={[fp.balAmount, { fontSize: Math.min(38, width * 0.09) }]}>
            COL$ {Number(balance).toLocaleString('es-CO')}
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
        {finStats.map((s, i) => (
          <Animated.View key={s.label} entering={FadeInDown.delay(i * 60).duration(200)} style={fp.finStatFlex}>
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

      {/* Préstamo para equipo */}
      <View style={{ marginBottom: SPACING.md }}>
        <GlassCard variant="elevated" animated={false} padding={0}>
          <LinearGradient colors={['rgba(14,77,104,0.3)', 'rgba(0,27,56,0.5)']} start={{x:0,y:0}} end={{x:1,y:1}} style={fp.loanGrad}>
            <View style={fp.loanLeft}>
              <LinearGradient colors={PROF.gradAccent} style={fp.loanIcon}>
                <Ionicons name="briefcase" size={20} color="#fff" />
              </LinearGradient>
              <View style={fp.loanInfo}>
                <Text style={fp.loanTitle}>Préstamo para equipo</Text>
                <Text style={fp.loanSub}>Hasta COL$ 2.000.000 · Tasa preferencial para Pro</Text>
              </View>
            </View>
            <TouchableOpacity style={fp.loanBtn} activeOpacity={0.8}>
              <Text style={fp.loanBtnText}>Ver oferta</Text>
              <Ionicons name="chevron-forward" size={13} color={PROF.accent} />
            </TouchableOpacity>
          </LinearGradient>
        </GlassCard>
      </View>

      {/* Movimientos */}
      <Text style={fp.sectionTitle}>Movimientos recientes</Text>
      {dataLoading ? (
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <ActivityIndicator color={PROF.accent} />
        </View>
      ) : transactions.length === 0 ? (
        <GlassCard><Text style={{ color: PROF.textMuted, textAlign: 'center', padding: 16 }}>Sin movimientos aún</Text></GlassCard>
      ) : (
        transactions.map((tx, i) => <TxItem key={tx.id} item={tx} index={i} />)
      )}
    </View>
    );
  };

  // ── Tab: Rendimiento ──
  const RendimientoTab = () => {
    const rndLevel = computeLevel(serviciosCompletados);
    const quarterLabel = getQuarterLabel();
    const progressW = useSharedValue(0);
    useEffect(() => { progressW.value = withTiming(rndLevel.progress * 100, { duration: 1000, easing: Easing.out(Easing.cubic) }); }, [rndLevel.progress]);
    const progStyle = useAnimatedStyle(() => ({ width: `${progressW.value}%` }));

    const rating = stats?.calificacionPromedio != null ? Number(stats.calificacionPromedio) : 0;
    const totalCals = stats?.totalCalificaciones ?? 0;

    return (
      <View>
        {/* Score general */}
        <GlassCard style={fp.scoreCard}>
          <LinearGradient colors={['rgba(73,192,188,0.15)', 'rgba(14,77,104,0.2)']} style={fp.scoreGrad}>
            <View style={fp.scoreLeft}>
              <Text style={fp.scoreNum}>{rating > 0 ? rating.toFixed(1) : '–'}</Text>
              <View style={fp.scoreStars}>{[1,2,3,4,5].map(s => <Ionicons key={s} name={s <= Math.round(rating) ? 'star' : 'star-outline'} size={18} color={PROF.accent} />)}</View>
              <Text style={fp.scoreSub}>Basado en {totalCals} {totalCals === 1 ? 'servicio' : 'servicios'}</Text>
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
          {metrics.map((m, i) => <MetricCard key={m.label} {...m} index={i} />)}
        </View>

        {/* Gráfico semanal */}
        <View style={fp.secHead}>
          <Text style={fp.secHeadTitle}>Servicios esta semana</Text>
          <View style={fp.weekBadge}><Text style={fp.weekBadgeText}>{weekly.reduce((s,d)=>s+d.svcs,0)} total</Text></View>
        </View>
        <GlassCard style={fp.chartCard}>
          <View style={fp.chartHead}>
            <Text style={fp.chartTitle}>Actividad diaria</Text>
          </View>
          <View style={fp.chartContainer}>
            {weekly.map((d, i) => <BarItem key={d.day} data={d} index={i} isToday={i === new Date().getDay()} />)}
          </View>
        </GlassCard>

        {/* Nivel */}
        <GlassCard style={fp.levelCard}>
          <LinearGradient colors={[`${rndLevel.color}18`, `${rndLevel.color}06`]} style={fp.levelContent}>
            <View style={fp.levelHead}>
              <LinearGradient colors={rndLevel.gradColors} style={fp.levelBadge}>
                <Ionicons name={rndLevel.icon} size={14} color="#fff" />
                <Text style={fp.levelBadgeText}>{rndLevel.label.toUpperCase()}</Text>
              </LinearGradient>
              {rndLevel.nextLabel ? (
                <Text style={fp.levelScore}>Siguiente: {rndLevel.nextLabel}</Text>
              ) : (
                <Text style={[fp.levelScore, { color: rndLevel.color }]}>★ Máximo nivel</Text>
              )}
            </View>
            <Text style={[fp.levelScore, { marginBottom: SPACING.sm, fontSize: TYPOGRAPHY.xs, color: PROF.textSecondary }]}>{rndLevel.motivo}</Text>
            <View style={fp.progressTrack}>
              <Animated.View style={[fp.progressFill, progStyle]}>
                <LinearGradient colors={rndLevel.gradColors} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill} />
              </Animated.View>
            </View>
            <View style={fp.levelStats}>
              <View style={fp.levelStat}><Text style={fp.levelStatVal}>{serviciosCompletados}</Text><Text style={fp.levelStatLabel}>Este trimestre</Text></View>
              <View style={fp.levelDivider} />
              <View style={fp.levelStat}><Text style={fp.levelStatVal}>{rndLevel.next ?? '∞'}</Text><Text style={fp.levelStatLabel}>Meta siguiente</Text></View>
              <View style={fp.levelDivider} />
              <View style={fp.levelStat}><Text style={[fp.levelStatVal, { color: rndLevel.remaining === 0 ? rndLevel.color : PROF.textPrimary }]}>{rndLevel.remaining === 0 ? '★' : rndLevel.remaining}</Text><Text style={fp.levelStatLabel}>{rndLevel.remaining === 0 ? 'Nível máximo' : `Para ${rndLevel.nextLabel}`}</Text></View>
            </View>
            <Text style={[fp.levelScore, { color: PROF.textMuted, fontSize: 10, fontStyle: 'italic', marginTop: SPACING.xs }]}>{quarterLabel}</Text>
          </LinearGradient>
        </GlassCard>

        {/* Reseñas */}
        <View style={fp.secHead}>
          <Text style={fp.secHeadTitle}>Reseñas recientes</Text>
          <TouchableOpacity><Text style={fp.secLink}>Ver todas</Text></TouchableOpacity>
        </View>
        {dataLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 16 }}><ActivityIndicator color={PROF.accent} /></View>
        ) : uiReviews.length === 0 ? (
          <GlassCard><Text style={{ color: PROF.textMuted, textAlign: 'center', padding: 16 }}>Sin reseñas aún</Text></GlassCard>
        ) : (
          uiReviews.map((r, i) => <ReviewItem key={r.author + i} review={r} index={i} />)
        )}
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
