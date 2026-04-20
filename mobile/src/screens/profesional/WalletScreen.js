/**
 * Professional WalletScreen  Cartera Premium Homecare 2026
 * Saldo COL$, botones Recargar/Retirar con glow, préstamo animado,
 * stats de ingresos y historial real desde el backend.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../../components/shared/GlassCard';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { computeLevel } from '../../utils/levelUtils';

// ─── Icono por tipo de transacción ───────────────────────────────────────────
const TX_ICONS = {
  income:     'color-palette',
  bonus:      'star',
  withdrawal: 'card-outline',
  refund:     'refresh-circle',
  default:    'cash-outline',
};

function txIcon(tx) {
  if (tx.tipo === 'RETIRO' || tx.monto < 0) return TX_ICONS.withdrawal;
  if (tx.tipo === 'BONO') return TX_ICONS.bonus;
  if (tx.tipo === 'REEMBOLSO') return TX_ICONS.refund;
  return TX_ICONS.income;
}

function txType(tx) {
  if (tx.tipo === 'RETIRO' || tx.monto < 0) return 'withdrawal';
  if (tx.tipo === 'BONO') return 'bonus';
  return 'income';
}

// ─── Calcular estadísticas rápidas desde lista de pagos ──────────────────────
function buildStats(pagos) {
  const now = new Date();
  const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek  = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let hoy = 0, semana = 0, mes = 0;
  for (const p of pagos) {
    const monto = Number(p.monto ?? p.precioAcordado ?? 0);
    if (monto <= 0) continue;
    const d = new Date(p.createdAt ?? p.fechaPago ?? p.fecha ?? 0);
    if (d >= startOfMonth) mes += monto;
    if (d >= startOfWeek)  semana += monto;
    if (d >= startOfDay)   hoy += monto;
  }
  return [
    { label: 'Hoy',    amount: hoy.toLocaleString('es-CO') },
    { label: 'Semana', amount: semana.toLocaleString('es-CO') },
    { label: 'Mes',    amount: mes.toLocaleString('es-CO') },
  ];
}

// ─── Item de transacción con animación de entrada ─────────────────────────────
function TxItem({ item, index }) {
  const monto = Number(item.monto ?? item.precioAcordado ?? 0);
  const isPositive = monto >= 0;
  const type = txType(item);
  const isBonus = type === 'bonus';
  const icon = txIcon(item);
  const date = new Date(item.createdAt ?? item.fechaPago ?? item.fecha ?? 0);

  return (
    <Animated.View entering={FadeInDown.delay(index * 75).duration(300)}>
      <GlassCard animated={false} style={styles.txCard} padding={SPACING.md}>
        <View style={styles.txRow}>
          <LinearGradient
            colors={
              isBonus
                ? PROF.gradAccent
                : isPositive
                  ? ['rgba(73,192,188,0.28)', 'rgba(73,192,188,0.08)']
                  : ['rgba(14,77,104,0.5)', 'rgba(0,27,56,0.8)']
            }
            style={styles.txIconWrap}
          >
            <Ionicons name={icon} size={17} color={isBonus ? '#fff' : PROF.accent} />
          </LinearGradient>
          <View style={styles.txInfo}>
            <Text style={styles.txTitle} numberOfLines={1}>
              {item.descripcion ?? item.titulo ?? item.tipoServicio ?? 'Pago'}
            </Text>
            {item.clienteNombre || item.proveedorNombre ? (
              <Text style={styles.txClient}>{item.clienteNombre ?? item.proveedorNombre}</Text>
            ) : null}
            <Text style={styles.txDate}>{date.toLocaleDateString('es-CO')}</Text>
          </View>
          <Text style={[styles.txAmount, isPositive ? styles.txPos : styles.txNeg]}>
            {isPositive ? '+' : ''}COL${'\n'}
            {Math.abs(monto).toLocaleString('es-CO')}
          </Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function WalletScreen({ navigation }) {
  const { user } = useAuth();
  const level = computeLevel(user?.serviciosCompletados ?? 0);
  const { width } = useWindowDimensions();

  // ── State ─────────────────────────────────────────────────────────────────
  const [pagos, setPagos]       = useState([]);
  const [stats, setStats]       = useState([
    { label: 'Hoy',    amount: '—' },
    { label: 'Semana', amount: '—' },
    { label: 'Mes',    amount: '—' },
  ]);
  const [balance, setBalance]   = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  // ── Animaciones ───────────────────────────────────────────────────────────
  const balanceScale  = useSharedValue(0.88);
  const loanPulse     = useSharedValue(1);
  const loanGlow      = useSharedValue(0.4);
  const recargarScale = useSharedValue(1);

  useEffect(() => {
    balanceScale.value = withSpring(1, { damping: 14, stiffness: 100 });
    loanPulse.value = withRepeat(
      withSequence(
        withTiming(1.012, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,     { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true,
    );
    loanGlow.value = withRepeat(
      withSequence(withTiming(0.85, { duration: 1800 }), withTiming(0.3, { duration: 1800 })),
      -1, true,
    );
  }, []);

  const balanceStyle   = useAnimatedStyle(() => ({ transform: [{ scale: balanceScale.value }] }));
  const loanPulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: loanPulse.value }] }));
  const loanGlowStyle  = useAnimatedStyle(() => ({ shadowOpacity: loanGlow.value }));
  const recargarStyle  = useAnimatedStyle(() => ({ transform: [{ scale: recargarScale.value }] }));

  // ── Fetch pagos reales ────────────────────────────────────────────────────
  const fetchWalletData = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/payments/me');
      const lista = Array.isArray(data) ? data : [];
      setPagos(lista);
      setStats(buildStats(lista));
      // Balance = suma de ingresos positivos (el backend no tiene endpoint de saldo dedicado)
      const bal = lista.reduce((acc, p) => acc + Number(p.monto ?? p.precioAcordado ?? 0), 0);
      setBalance(Math.max(0, bal));
    } catch {
      // Silencioso: la UI muestra "—" si falla
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { fetchWalletData(); }, [fetchWalletData]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRecargar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    recargarScale.value = withSpring(0.93, { damping: 10 }, () => {
      recargarScale.value = withSpring(1, { damping: 12 });
    });
  };

  const handleRetirar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <LinearGradient colors={PROF.gradMain} style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#000F22" />
      <SafeAreaView style={styles.safe}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.getParent()?.openDrawer?.()} style={styles.menuBtn}>
            <Ionicons name="menu" size={28} color={PROF.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.brandTitle}>CARTERA</Text>
          <TouchableOpacity style={styles.historyBtn} onPress={fetchWalletData}>
            <Ionicons name="refresh-outline" size={24} color={PROF.textPrimary} />
          </TouchableOpacity>
        </View>

        {loadingData ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={PROF.accent} />
          </View>
        ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/*  TARJETA DE SALDO PRINCIPAL (elevated + glow)  */}
          <GlassCard variant="elevated" glow style={styles.balanceCard} padding={0}>
            <LinearGradient
              colors={['rgba(14,77,104,0.0)', 'rgba(0,27,56,0.45)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.decor1} />
            <View style={styles.decor2} />

            <View style={styles.balanceTop}>
              <Text style={styles.balanceLabel}>Saldo disponible</Text>
              <View style={styles.platinoBadge}>
                <Ionicons name={level.icon} size={10} color={level.color} />
                <Text style={[styles.platinoText, { color: level.color }]}>{level.label}</Text>
              </View>
            </View>

            <Animated.View style={balanceStyle}>
              <Text style={[styles.balanceAmount, { fontSize: Math.min(44, width * 0.11) }]}>
                COL$ {balance.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
              </Text>
            </Animated.View>

            <View style={styles.balanceDeltaRow}>
              <Ionicons name="trending-up" size={13} color={PROF.success} />
              <Text style={styles.balanceDeltaText}>
                {pagos.length} transacciones totales
              </Text>
            </View>

            {/* Botones Recargar / Retirar */}
            <View style={styles.balanceBtns}>
              <Animated.View style={[styles.btnFlex, recargarStyle]}>
                <TouchableOpacity onPress={handleRecargar} activeOpacity={0.85} style={styles.btnRecargar}>
                  <LinearGradient colors={PROF.gradAccent} style={styles.btnGradient}>
                    <Ionicons name="add-circle-outline" size={19} color="#fff" />
                    <Text style={styles.btnText}>Recargar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity onPress={handleRetirar} activeOpacity={0.85} style={[styles.btnFlex, styles.btnRetirar]}>
                <View style={styles.btnOutline}>
                  <Ionicons name="arrow-up-circle-outline" size={19} color={PROF.accent} />
                  <Text style={styles.btnOutlineText}>Retirar a cuenta</Text>
                </View>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/*  ESTADÍSTICAS RÁPIDAS  */}
          <View style={styles.statsRow}>
            {stats.map((s, i) => (
              <Animated.View
                key={s.label}
                entering={FadeInDown.delay(i * 100).duration(280)}
                style={styles.statFlex}
              >
                <GlassCard variant="accent" animated={false} padding={SPACING.md}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statAmount} numberOfLines={1}>COL$ {s.amount}</Text>
                  <View style={styles.statDeltaRow}>
                    <Ionicons name="trending-up" size={10} color={PROF.success} />
                    <Text style={styles.statDelta}>acumulado</Text>
                  </View>
                </GlassCard>
              </Animated.View>
            ))}
          </View>

          {/*  PRÉSTAMO PARA EQUIPO PROFESIONAL (animación pulsante)  */}
          <Animated.View
            style={[
              loanGlowStyle,
              {
                ...SHADOWS.glowStrong,
                shadowColor: PROF.accent,
                borderRadius: BORDER_RADIUS.xl,
                marginBottom: SPACING.md,
              },
            ]}
          >
            <Animated.View style={loanPulseStyle}>
              <GlassCard variant="elevated" animated={false} padding={0}>
                <LinearGradient
                  colors={['rgba(73,192,188,0.18)', 'rgba(14,77,104,0.5)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loanGradient}
                >
                  <View style={styles.loanLeft}>
                    <LinearGradient colors={PROF.gradAccent} style={styles.loanIconWrap}>
                      <Ionicons name="briefcase" size={22} color="#fff" />
                    </LinearGradient>
                    <View style={styles.loanInfo}>
                      <Text style={styles.loanTitle}>Préstamo para equipo</Text>
                      <Text style={styles.loanSub}>
                        Hasta COL$ 2.000.000 para profesionales Elite
                      </Text>
                      <View style={styles.loanBadge}>
                        <Ionicons name="flash" size={10} color={PROF.accent} />
                        <Text style={styles.loanBadgeText}>Tasa 0% los primeros 30 días</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.loanBtn} activeOpacity={0.8}>
                    <Text style={styles.loanBtnText}>Ver oferta</Text>
                    <Ionicons name="chevron-forward" size={13} color={PROF.accent} />
                  </TouchableOpacity>
                </LinearGradient>
              </GlassCard>
            </Animated.View>
          </Animated.View>

          {/*  HISTORIAL DE MOVIMIENTOS  */}
          <Text style={styles.sectionTitle}>Movimientos recientes</Text>
          {pagos.length === 0 ? (
            <GlassCard animated={false} padding={SPACING.xl}>
              <View style={styles.emptyWrap}>
                <Ionicons name="receipt-outline" size={40} color={PROF.textMuted} />
                <Text style={styles.emptyTitle}>Sin movimientos</Text>
                <Text style={styles.emptyDesc}>
                  Cuando completes servicios y recibas pagos aparecerán aquí.
                </Text>
              </View>
            </GlassCard>
          ) : (
            pagos.slice(0, 30).map((tx, i) => (
              <TxItem key={String(tx.id ?? i)} item={tx} index={i} />
            ))
          )}

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe:   { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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
  menuBtn:    { padding: SPACING.sm },
  historyBtn: { padding: SPACING.sm },

  scroll: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },

  // Balance card
  balanceCard: { marginBottom: SPACING.md, overflow: 'hidden' },
  decor1: {
    position: 'absolute', top: -60, right: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(73,192,188,0.07)',
  },
  decor2: {
    position: 'absolute', bottom: -40, left: 10,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(73,192,188,0.04)',
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  balanceLabel: { fontSize: TYPOGRAPHY.sm, color: PROF.textSecondary },
  platinoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PROF.accentDim,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full, gap: 4,
  },
  platinoText: { fontSize: 10, fontWeight: TYPOGRAPHY.bold },

  balanceAmount: {
    fontWeight: TYPOGRAPHY.bold,
    color: PROF.textPrimary,
    letterSpacing: -1,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  balanceDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xs, gap: 6,
  },
  balanceDeltaText: { fontSize: TYPOGRAPHY.xs, color: PROF.success },

  balanceBtns: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  btnFlex: { flex: 1 },
  btnRecargar: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.glow,
    shadowColor: PROF.accent,
  },
  btnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md, gap: 7,
  },
  btnText: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.bold, color: '#fff' },

  btnRetirar: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: PROF.accentGlow,
  },
  btnOutline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md, gap: 7,
  },
  btnOutlineText: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.bold, color: PROF.accent },

  // Stats
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statFlex: { flex: 1 },
  statLabel:  { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, marginBottom: 4 },
  statAmount: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary },
  statDeltaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  statDelta: { fontSize: 10, color: PROF.success },

  // Préstamo
  loanGradient: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loanLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: SPACING.md },
  loanIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  loanInfo: { flex: 1 },
  loanTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary },
  loanSub: { fontSize: TYPOGRAPHY.xs, color: PROF.textSecondary, marginTop: 3, lineHeight: 16 },
  loanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PROF.accentDim,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full, gap: 4,
    marginTop: 6, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: PROF.accentGlow,
  },
  loanBadgeText: { fontSize: 10, color: PROF.accent, fontWeight: TYPOGRAPHY.semibold },
  loanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1, borderColor: PROF.accentGlow,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 6, gap: 2,
  },
  loanBtnText: { fontSize: TYPOGRAPHY.xs, color: PROF.accent, fontWeight: TYPOGRAPHY.bold },

  // Historial
  sectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: PROF.textPrimary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  txCard: { marginBottom: SPACING.sm },
  txRow:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  txIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txTitle:  { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold, color: PROF.textPrimary },
  txClient: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, marginTop: 2 },
  txDate:   { fontSize: 10, color: PROF.textMuted, marginTop: 2 },
  txAmount: { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.bold, textAlign: 'right' },
  txPos: { color: PROF.success },
  txNeg: { color: PROF.error },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingVertical: SPACING.md },
  emptyTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.semibold, color: PROF.textPrimary, marginTop: SPACING.md },
  emptyDesc:  { fontSize: TYPOGRAPHY.sm, color: PROF.textMuted, textAlign: 'center', marginTop: SPACING.xs, lineHeight: 18 },
});

