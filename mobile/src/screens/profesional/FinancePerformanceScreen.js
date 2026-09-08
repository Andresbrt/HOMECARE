/**
 * FinancePerformanceScreen — Finanzas y Rendimiento combinados
 * Tabs internos: Finanzas | Rendimiento
 * Evita navegación excesiva — todo en una sola pantalla.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, useWindowDimensions, ActivityIndicator,
  Alert, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  FadeInDown, FadeIn, interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../../components/shared/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../config/api';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { computeLevel, getQuarterLabel } from '../../utils/levelUtils';

// ─── Constantes UI ────────────────────────────────────────────────────────────
const BAR_MAX = 80;

// Mapea el método de pago del backend a texto legible
function mapMetodo(m) {
  if (!m) return 'Pago recibido';
  if (m.includes('TARJETA_CREDITO')) return 'Pago con tarjeta crédito';
  if (m.includes('TARJETA_DEBITO'))  return 'Pago con tarjeta débito';
  if (m.includes('EFECTIVO'))        return 'Pago en efectivo';
  if (m.includes('MERCADO_PAGO'))    return 'Pago con Mercado Pago';
  if (m.includes('RECARGA'))         return 'Recarga de saldo';
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
  const diffD = Math.floor(diffMs / 86400000);
  if (diffD === 1)   return 'Ayer';
  if (diffD < 7)     return `Hace ${diffD} días`;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

// ─── Componente: Tab Switcher (Transiciones sutiles) ─────────────────────────
function TabSwitcher({ activeTab, setActiveTab }) {
  const translateX = useSharedValue(activeTab === 0 ? 0 : 1);
  useEffect(() => {
    translateX.value = withTiming(activeTab === 0 ? 0 : 1, { duration: 180 });
  }, [activeTab]);

  const indicatorStyle = useAnimatedStyle(() => ({
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
          <Ionicons name={icon} size={15} color={activeTab === i ? PROF.accent : PROF.textMuted} />
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
    width: '48%',
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
    paddingVertical: 9,
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
    <Animated.View entering={FadeIn.duration(200)}>
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

// ─── Componente: Barra del gráfico (Minimalista & Sutil) ──────────────────────
function BarItem({ data, isToday }) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withTiming(data.value * BAR_MAX, { duration: 250 });
  }, [data.value]);
  const barStyle = useAnimatedStyle(() => ({ height: h.value }));
  return (
    <View style={fp.barWrap}>
      <Text style={fp.barSvc}>{data.svcs > 0 ? data.svcs : ''}</Text>
      <Animated.View style={[fp.bar, barStyle]}>
        <LinearGradient
          colors={isToday ? PROF.gradAccent : ['rgba(73,192,188,0.45)', 'rgba(14,77,104,0.25)']}
          start={{x:0,y:0}} end={{x:0,y:1}}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Text style={[fp.barDay, isToday && fp.barDayActive]}>{data.day}</Text>
    </View>
  );
}

// ─── Componente: Tarjeta de métrica (Minimalista & Limpia) ───────────────────
function MetricCard({ icon, label, value, sub, color }) {
  return (
    <View style={fp.metricWrap}>
      <GlassCard animated={false}>
        <View style={fp.metricInner}>
          <LinearGradient colors={[color + '22', color + '0A']} style={fp.metricIcon}>
            <Ionicons name={icon} size={17} color={color} />
          </LinearGradient>
          <Text style={fp.metricVal}>{value}</Text>
          <Text style={fp.metricLabel}>{label}</Text>
          {sub ? <Text style={fp.metricSub}>{sub}</Text> : null}
        </View>
      </GlassCard>
    </View>
  );
}

// ─── Componente: Reseña (Sutil y Elegante) ───────────────────────────────────
function ReviewItem({ review }) {
  return (
    <GlassCard animated={false} style={fp.reviewCard}>
      <View style={fp.reviewInner}>
        <View style={fp.reviewHead}>
          <View>
            <Text style={fp.reviewAuthor}>{review.author}</Text>
            <Text style={fp.reviewTime}>{review.time}</Text>
          </View>
          <View style={fp.reviewStars}>
            {[1,2,3,4,5].map(s => (
              <Ionicons key={s} name={s <= review.rating ? 'star' : 'star-outline'} size={12} color="#F5A623" />
            ))}
          </View>
        </View>
        {review.text ? <Text style={fp.reviewText}>{review.text}</Text> : null}
      </View>
    </GlassCard>
  );
}

// ─── Componente: Modal de Recarga de Saldo (Mercado Pago) ─────────────────────
function RecargaModal({ visible, onClose, onConfirm, loading }) {
  const PRESETS = [20000, 50000, 100000, 200000];
  const [selectedPreset, setSelectedPreset] = useState(50000);
  const [customText, setCustomText] = useState('');

  const currentAmount = customText ? (parseInt(customText.replace(/[^0-9]/g, ''), 10) || 0) : (selectedPreset || 0);

  const handleSelectPreset = (amount) => {
    Haptics.selectionAsync();
    setSelectedPreset(amount);
    setCustomText('');
  };

  const handleCustomChange = (text) => {
    const raw = text.replace(/[^0-9]/g, '');
    setCustomText(raw);
    if (raw) {
      setSelectedPreset(null);
    }
  };

  const handlePay = () => {
    if (currentAmount < 5000) {
      Alert.alert('Monto mínimo', 'El monto mínimo de recarga es $5.000 COP.');
      return;
    }
    onConfirm(currentAmount);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={fp.modalWrap}>
        <TouchableOpacity style={fp.modalOverlay} activeOpacity={1} onPress={onClose} />
        <View style={fp.modalSheet}>
          <View style={fp.modalHandle} />

          <View style={fp.modalHeaderRow}>
            <LinearGradient colors={PROF.gradAccent} style={fp.modalIconBox}>
              <Ionicons name="wallet" size={18} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={fp.modalTitle}>Recargar Billetera</Text>
              <Text style={fp.modalSubtitle}>Acredita saldo a tu cuenta profesional</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={fp.modalCloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#A0B8D2" />
            </TouchableOpacity>
          </View>

          {/* Selector de montos predefinidos */}
          <Text style={fp.modalSectionLabel}>Monto a recargar</Text>
          <View style={fp.presetGrid}>
            {PRESETS.map((p) => {
              const active = selectedPreset === p && !customText;
              return (
                <TouchableOpacity
                  key={p}
                  style={[fp.presetChip, active && fp.presetChipActive]}
                  onPress={() => handleSelectPreset(p)}
                  activeOpacity={0.8}
                >
                  <Text style={[fp.presetChipText, active && fp.presetChipTextActive]}>
                    ${p.toLocaleString('es-CO')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* O escribe un monto personalizado */}
          <Text style={[fp.modalSectionLabel, { marginTop: SPACING.sm }]}>O ingresa otro valor (COP)</Text>
          <View style={fp.customInputWrap}>
            <Text style={fp.customInputPrefix}>$</Text>
            <TextInput
              style={fp.customInput}
              placeholder="Ej. 75.000"
              placeholderTextColor="#6D8CA8"
              keyboardType="number-pad"
              value={customText ? Number(customText).toLocaleString('es-CO') : ''}
              onChangeText={handleCustomChange}
            />
          </View>

          {/* Resumen del cobro */}
          <View style={fp.modalSummaryBox}>
            <View style={fp.summaryRow}>
              <Text style={fp.summaryLabel}>Total a recargar:</Text>
              <Text style={fp.summaryAmount}>COL$ {currentAmount.toLocaleString('es-CO')}</Text>
            </View>
            <View style={fp.methodsRow}>
              <Ionicons name="shield-checkmark" size={14} color={PROF.accent} />
              <Text style={fp.methodsText}>Mercado Pago · PSE, Tarjetas Débito/Crédito y Efecty</Text>
            </View>
          </View>

          {/* Botón de pago */}
          <TouchableOpacity
            style={[fp.modalPayBtn, loading && { opacity: 0.6 }]}
            onPress={handlePay}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient colors={PROF.gradAccent} style={fp.modalPayGrad}>
              {loading ? (
                <ActivityIndicator size="small" color="#001B38" />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={16} color="#001B38" />
                  <Text style={fp.modalPayText}>Recargar COL$ {currentAmount.toLocaleString('es-CO')}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#001B38" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function FinancePerformanceScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // ── Estado de datos reales (sin datos de prueba) ──────────────────────────
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [walletData, setWalletData] = useState(null);
  const [pendingCommissions, setPendingCommissions] = useState({
    totalComisionPendiente: 0,
    totalServiciosPendientes: 0,
    items: [],
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingCommissions, setPayingCommissions] = useState(false);

  const loadAllData = useCallback(async () => {
    try {
      const [pmtRes, statsRes, comisionesRes, walletRes] = await Promise.all([
        apiFetch('/payments/me'),
        apiFetch('/usuarios/estadisticas'),
        apiFetch('/payments/comisiones/pendientes'),
        apiFetch('/payments/wallet'),
      ]);

      if (pmtRes?.ok) setPayments(pmtRes.data ?? []);
      if (statsRes?.ok) setStats(statsRes.data);
      if (comisionesRes?.ok && comisionesRes.data) setPendingCommissions(comisionesRes.data);
      if (walletRes?.ok && walletRes.data) setWalletData(walletRes.data);

      if (user?.id) {
        const revRes = await apiFetch(`/calificaciones/usuario/${user.id}`);
        if (revRes?.ok) setReviews(revRes.data ?? []);
      }
    } catch (e) {
      console.warn('Error fetching finances:', e);
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setDataLoading(true);
    loadAllData();
  }, [loadAllData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllData();
  }, [loadAllData]);

  // ── Datos computados (100% basados en backend real) ───────────────────────
  const approvedPayments = useMemo(
    () => payments.filter(p => p.estado === 'APROBADO'),
    [payments],
  );

  const balance = useMemo(() => {
    if (walletData?.saldoDisponible != null) {
      return parseFloat(walletData.saldoDisponible);
    }
    return approvedPayments.reduce((s, p) => s + parseFloat(p.montoProveedor ?? 0), 0);
  }, [walletData, approvedPayments]);

  const finStats = useMemo(() => {
    const sum = (list) => list.reduce((s, p) => s + parseFloat(p.montoProveedor ?? 0), 0);
    const fmt = (n) => n.toLocaleString('es-CO', { maximumFractionDigits: 0 });

    if (approvedPayments.length === 0) {
      return [
        { label: 'Hoy', amount: '0', delta: '0 serv.' },
        { label: 'Semana', amount: '0', delta: '0 serv.' },
        { label: 'Mes', amount: '0', delta: '0 serv.' },
      ];
    }
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayPmts = approvedPayments.filter(p => new Date(p.aprobadoAt ?? p.createdAt) >= startOfToday);
    const weekPmts = approvedPayments.filter(p => new Date(p.aprobadoAt ?? p.createdAt) >= startOfWeek);
    const monthPmts = approvedPayments.filter(p => new Date(p.aprobadoAt ?? p.createdAt) >= startOfMonth);

    return [
      { label: 'Hoy', amount: fmt(sum(todayPmts)), delta: `${todayPmts.length} serv.` },
      { label: 'Semana', amount: fmt(sum(weekPmts)), delta: `${weekPmts.length} serv.` },
      { label: 'Mes', amount: fmt(sum(monthPmts)), delta: `${monthPmts.length} serv.` },
    ];
  }, [approvedPayments]);

  const transactions = useMemo(() => {
    if (payments.length === 0) {
      return [];
    }
    return payments.slice(0, 15).map(p => ({
      id: String(p.id),
      type: 'income',
      title: mapMetodo(p.metodoPago),
      client: p.servicio?.concepto ?? (p.clienteNombre ? `Cliente: ${p.clienteNombre}` : null),
      amount: p.estado === 'APROBADO'
        ? parseFloat(p.montoProveedor ?? p.montoTotal ?? 0)
        : -parseFloat(p.montoTotal ?? 0),
      date: fmtDate(p.aprobadoAt ?? p.createdAt),
      icon: (p.metodoPago ?? '').includes('TARJETA')
        ? 'card-outline'
        : (p.metodoPago ?? '').includes('EFECTIVO')
          ? 'cash-outline'
          : (p.metodoPago ?? '').includes('PSE')
            ? 'business-outline'
            : 'wallet-outline',
    }));
  }, [payments]);

  const weekly = useMemo(() => {
    const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    approvedPayments.forEach(p => {
      const d = new Date(p.aprobadoAt ?? p.createdAt);
      const diffDays = Math.floor((now - d) / 86400000);
      if (diffDays < 7) counts[d.getDay()]++;
    });
    const maxC = Math.max(...counts, 1);
    return DAY_LABELS.map((day, i) => ({
      day,
      value: counts[i] > 0 ? counts[i] / maxC : 0,
      svcs: counts[i],
    }));
  }, [approvedPayments]);

  const ratingVal = stats?.calificacionPromedio != null
    ? Number(stats.calificacionPromedio)
    : (reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.puntuacion || 5), 0) / reviews.length) : 0);

  const totalCals = stats?.totalCalificaciones ?? reviews.length;

  const starPercentages = useMemo(() => {
    if (reviews.length === 0) return [0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1
    reviews.forEach(r => {
      const p = Math.min(5, Math.max(1, Math.round(r.puntuacion || 5)));
      counts[5 - p]++;
    });
    return counts.map(c => Math.round((c / reviews.length) * 100));
  }, [reviews]);

  const metrics = useMemo(() => [
    {
      icon: 'star',
      label: 'Calificación',
      value: ratingVal > 0 ? ratingVal.toFixed(1) : '–',
      sub: totalCals > 0 ? `${totalCals} valoraciones` : 'Sin calificar',
      color: '#F5A623',
    },
    {
      icon: 'checkmark-circle',
      label: 'Completados',
      value: String(stats?.serviciosCompletados ?? approvedPayments.length),
      sub: 'Servicios',
      color: PROF.accent,
    },
    {
      icon: 'trending-up',
      label: 'Total ganado',
      value: `$${Number(balance).toLocaleString('es-CO')}`,
      sub: 'COP netos',
      color: '#10B981',
    },
    {
      icon: 'chatbubbles-outline',
      label: 'Reseñas',
      value: String(totalCals),
      sub: 'Recibidas',
      color: '#6366F1',
    },
  ], [ratingVal, totalCals, stats, approvedPayments.length, balance]);

  const uiReviews = useMemo(() => {
    if (reviews.length === 0) return [];
    return reviews.slice(0, 10).map(r => ({
      author: r.calificadorNombre ?? 'Cliente verificado',
      text: r.comentario ?? '',
      rating: r.puntuacion ?? 5,
      time: fmtDate(r.createdAt),
    }));
  }, [reviews]);

  const serviciosCompletados = stats?.serviciosCompletados ?? approvedPayments.length;

  // Modal y procesamiento de recarga
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [recharging, setRecharging] = useState(false);

  const handleRecargar = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRechargeModalVisible(true);
  }, []);

  const handleConfirmRecarga = useCallback(async (monto) => {
    try {
      setRecharging(true);
      // Realizar la recarga a la billetera profesional
      const directRes = await apiFetch('/payments/wallet/recargar-directo', {
        method: 'POST',
        body: JSON.stringify({ monto }),
      });

      if (directRes?.ok) {
        setRechargeModalVisible(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '¡Recarga exitosa! ✓',
          `Se han acreditado COL$ ${Number(monto).toLocaleString('es-CO')} a tu billetera profesional.`,
          [{ text: 'Entendido', onPress: () => loadAllData() }]
        );
        loadAllData();
        return;
      }

      // Si falla, intentar crear preferencia en Mercado Pago
      const res = await apiFetch('/payments/wallet/recargar', {
        method: 'POST',
        body: JSON.stringify({ monto }),
      });

      if (res?.ok && res.data?.preferenceId) {
        setRechargeModalVisible(false);
        navigation.navigate('PaymentBricks', {
          monto,
          preferenceId: res.data.preferenceId,
        });
      } else {
        Alert.alert('Error', directRes?.error || res?.error || 'No se pudo procesar la recarga.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Ocurrió un error al procesar la recarga.');
    } finally {
      setRecharging(false);
    }
  }, [navigation, loadAllData]);

  // ── Checkout de comisiones a Homecare (Carrito de Finanzas) ───────────────
  const handleCheckoutComisiones = useCallback(async () => {
    const total = pendingCommissions?.totalComisionPendiente || 0;
    if (total <= 0) {
      Alert.alert('Al día', 'No tienes comisiones pendientes por pagar.');
      return;
    }

    try {
      setPayingCommissions(true);
      const res = await apiFetch('/payments/comisiones/checkout', { method: 'POST' });

      if (res?.ok && res.data?.preferenceId) {
        navigation.navigate('PaymentBricks', {
          monto: res.data.totalAPagar,
          preferenceId: res.data.preferenceId,
        });
      } else {
        // En ambiente de desarrollo / pruebas locales sin pasarela externa
        Alert.alert(
          'Liquidación de Comisiones',
          `Monto a pagar a Homecare: COL$ ${Number(total).toLocaleString('es-CO')}\n\n¿Deseas confirmar la liquidación de las ${pendingCommissions.totalServiciosPendientes} comisiones pendientes?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Confirmar pago',
              onPress: async () => {
                await apiFetch('/payments/comisiones/liquidar-directo', { method: 'POST' });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('¡Comisiones al día! ✓', 'Tus comisiones han sido liquidadas exitosamente.');
                loadAllData();
              },
            },
          ]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo iniciar el pago de comisiones.');
    } finally {
      setPayingCommissions(false);
    }
  }, [pendingCommissions, navigation, loadAllData]);

  // ── Tab: Finanzas ──
  const FinanzasTab = () => {
    const finLevel = computeLevel(serviciosCompletados);
    const hasCommissions = (pendingCommissions.items?.length ?? 0) > 0;
    const totalComisiones = pendingCommissions.totalComisionPendiente ?? 0;

    return (
      <View>
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
          <View>
            <Text style={[fp.balAmount, { fontSize: Math.min(38, width * 0.09) }]}>
              COL$ {Number(balance).toLocaleString('es-CO')}
            </Text>
          </View>
          <View style={fp.balDelta}>
            <Ionicons name="checkmark-circle" size={13} color={balance > 0 ? PROF.success : PROF.textMuted} />
            <Text style={[fp.balDeltaText, { color: balance > 0 ? PROF.success : PROF.textMuted }]}>
              {balance > 0 ? 'Balance de servicios verificado' : 'Sin saldo acumulado aún'}
            </Text>
          </View>
          <View style={fp.balBtns}>
            <View style={fp.balBtnFlex}>
              <TouchableOpacity onPress={handleRecargar} activeOpacity={0.8} style={fp.balBtnWrap}>
                <LinearGradient colors={PROF.gradAccent} style={fp.balBtnGrad}>
                  <Ionicons name="add-circle-outline" size={17} color="#fff" />
                  <Text style={fp.balBtnText}>Recargar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[fp.balBtnFlex, fp.balBtnOutlineWrap]}
              onPress={() => {
                if (balance <= 0) {
                  Alert.alert('Retiro', 'No tienes saldo disponible para retirar en este momento.');
                } else {
                  Alert.alert('Retirar Fondos', `Tu saldo de COL$ ${Number(balance).toLocaleString('es-CO')} será transferido a tu cuenta bancaria registrada.`);
                }
              }}
            >
              <View style={fp.balBtnOutline}>
                <Ionicons name="arrow-up-circle-outline" size={18} color={PROF.accent} />
                <Text style={fp.balBtnOutlineText}>Retirar</Text>
              </View>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* ── CARRITO DE LIQUIDACIÓN DE COMISIONES (INGRESOS DE LA PLATAFORMA) ── */}
        <View style={{ marginBottom: SPACING.md }}>
          <GlassCard variant="elevated" animated={false} padding={0}>
            <LinearGradient
              colors={['rgba(14,77,104,0.35)', 'rgba(0,27,56,0.65)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={fp.cartGrad}
            >
              <View style={fp.cartHeaderRow}>
                <View style={fp.cartTitleLeft}>
                  <LinearGradient colors={PROF.gradAccent} style={fp.cartIconBox}>
                    <Ionicons name="cart" size={20} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={fp.cartTitle}>Carrito de Liquidación Homecare</Text>
                    <Text style={fp.cartSub}>
                      {hasCommissions
                        ? `${pendingCommissions.items.length} comisiones pendientes por servicios en efectivo`
                        : 'Al día · Sin comisiones pendientes'}
                    </Text>
                  </View>
                </View>
                {hasCommissions && (
                  <View style={fp.cartBadgeWrap}>
                    <Text style={fp.cartBadgeNum}>{pendingCommissions.items.length}</Text>
                  </View>
                )}
              </View>

              {hasCommissions ? (
                <View style={fp.cartBody}>
                  <View style={fp.cartTotalRow}>
                    <Text style={fp.cartTotalLabel}>Total a pagar a Homecare (10%):</Text>
                    <Text style={fp.cartTotalAmount}>
                      COL$ {Number(totalComisiones).toLocaleString('es-CO')}
                    </Text>
                  </View>

                  {/* Desglose de servicios en el carrito */}
                  <View style={fp.cartItemsContainer}>
                    {pendingCommissions.items.slice(0, 3).map((it, idx) => (
                      <View key={it.pagoId || idx} style={fp.cartSingleItem}>
                        <Ionicons name="receipt-outline" size={13} color={PROF.accent} />
                        <Text style={fp.cartItemConcept} numberOfLines={1}>{it.concepto}</Text>
                        <Text style={fp.cartItemFee}>+COL$ {Number(it.comision).toLocaleString('es-CO')}</Text>
                      </View>
                    ))}
                    {pendingCommissions.items.length > 3 && (
                      <Text style={fp.cartMoreText}>
                        +{pendingCommissions.items.length - 3} servicios adicionales en tu carrito...
                      </Text>
                    )}
                  </View>

                  {/* Botón Pagar Comisiones con Mercado Pago */}
                  <TouchableOpacity
                    style={fp.cartPayButton}
                    onPress={handleCheckoutComisiones}
                    activeOpacity={0.88}
                    disabled={payingCommissions}
                  >
                    <LinearGradient
                      colors={['#0E4D68', '#49C0BC']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={fp.cartPayGrad}
                    >
                      {payingCommissions ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="card" size={18} color="#fff" />
                          <Text style={fp.cartPayButtonText}>Pagar Comisiones a Homecare</Text>
                          <Ionicons name="arrow-forward" size={16} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <Text style={fp.cartMethodsFootnote}>
                    Procesado por Mercado Pago · Acepta PSE, Tarjetas y Efecty
                  </Text>
                </View>
              ) : (
                <View style={fp.cartUpToDateRow}>
                  <Ionicons name="checkmark-circle" size={22} color={PROF.success} />
                  <Text style={fp.cartUpToDateText}>
                    No tienes comisiones pendientes. Todos tus servicios en efectivo están al día con la plataforma.
                  </Text>
                </View>
              )}
            </LinearGradient>
          </GlassCard>
        </View>

        {/* Stats rápidos */}
        <View style={fp.finStatsRow}>
          {finStats.map((s, i) => (
            <Animated.View key={s.label} entering={FadeInDown.delay(i * 60).duration(200)} style={fp.finStatFlex}>
              <GlassCard variant="accent" animated={false} padding={SPACING.md}>
                <Text style={fp.finStatLabel}>{s.label}</Text>
                <Text style={fp.finStatAmount}>COL$ {s.amount}</Text>
                <View style={fp.finStatDelta}>
                  <Ionicons name="checkmark" size={10} color={PROF.success} />
                  <Text style={fp.finStatDeltaText}>{s.delta}</Text>
                </View>
              </GlassCard>
            </Animated.View>
          ))}
        </View>

        {/* Movimientos recientes */}
        <Text style={fp.sectionTitle}>Movimientos recientes</Text>
        {dataLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <ActivityIndicator color={PROF.accent} />
          </View>
        ) : transactions.length === 0 ? (
          <GlassCard>
            <View style={fp.emptyTxWrap}>
              <Ionicons name="receipt-outline" size={28} color={PROF.accent} />
              <Text style={fp.emptyTxTitle}>Sin movimientos aún</Text>
              <Text style={fp.emptyTxSub}>
                Tus pagos por servicios completados y transferencias aparecerán aquí.
              </Text>
            </View>
          </GlassCard>
        ) : (
          transactions.map((tx, i) => <TxItem key={tx.id} item={tx} index={i} />)
        )}
      </View>
    );
  };

  // ── Tab: Rendimiento (Diseño Minimalista & Ejecutivo) ──
  const RendimientoTab = () => {
    const rndLevel = computeLevel(serviciosCompletados);
    const quarterLabel = getQuarterLabel();
    const progressW = useSharedValue(0);

    useEffect(() => {
      progressW.value = withTiming(rndLevel.progress * 100, { duration: 300 });
    }, [rndLevel.progress]);

    const progStyle = useAnimatedStyle(() => ({ width: `${progressW.value}%` }));

    return (
      <View>
        {/* Score general minimalista */}
        <GlassCard style={fp.scoreCard}>
          <LinearGradient colors={['rgba(73,192,188,0.08)', 'rgba(14,77,104,0.14)']} style={fp.scoreGrad}>
            <View style={fp.scoreLeft}>
              <Text style={fp.scoreNum}>{ratingVal > 0 ? ratingVal.toFixed(1) : '–'}</Text>
              <View style={fp.scoreStars}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Ionicons
                    key={s}
                    name={s <= Math.round(ratingVal) ? 'star' : 'star-outline'}
                    size={16}
                    color="#F5A623"
                  />
                ))}
              </View>
              <Text style={fp.scoreSub}>
                {totalCals > 0
                  ? `${totalCals} ${totalCals === 1 ? 'opinión de cliente' : 'opiniones de clientes'}`
                  : 'Sin calificaciones aún'}
              </Text>
            </View>
            <View style={fp.scoreRight}>
              {[5, 4, 3, 2, 1].map((r, i) => (
                <View key={r} style={fp.scoreRow}>
                  <Text style={fp.scoreRowNum}>{r}</Text>
                  <Ionicons name="star" size={9} color="#F5A623" style={{ marginRight: 4 }} />
                  <View style={fp.scoreBar}>
                    <View style={[fp.scoreBarFill, { width: `${starPercentages[i]}%` }]} />
                  </View>
                  <Text style={fp.scorePctText}>{starPercentages[i]}%</Text>
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
          <View style={fp.weekBadge}>
            <Text style={fp.weekBadgeText}>{weekly.reduce((s, d) => s + d.svcs, 0)} total</Text>
          </View>
        </View>
        <GlassCard style={fp.chartCard}>
          <View style={fp.chartHead}>
            <Text style={fp.chartTitle}>Actividad diaria</Text>
          </View>
          <View style={fp.chartContainer}>
            {weekly.map((d, i) => (
              <BarItem key={d.day + i} data={d} index={i} isToday={i === new Date().getDay()} />
            ))}
          </View>
        </GlassCard>

        {/* Nivel Pro minimalista */}
        <GlassCard style={fp.levelCard}>
          <LinearGradient colors={[`${rndLevel.color}14`, `${rndLevel.color}04`]} style={fp.levelContent}>
            <View style={fp.levelHead}>
              <LinearGradient colors={rndLevel.gradColors} style={fp.levelBadge}>
                <Ionicons name={rndLevel.icon} size={14} color="#fff" />
                <Text style={fp.levelBadgeText}>{rndLevel.label.toUpperCase()}</Text>
              </LinearGradient>
              {rndLevel.nextLabel ? (
                <Text style={fp.levelScore}>Siguiente: {rndLevel.nextLabel}</Text>
              ) : (
                <Text style={[fp.levelScore, { color: rndLevel.color }]}>★ Máximo nivel alcanzado</Text>
              )}
            </View>
            <Text style={[fp.levelScore, { marginBottom: SPACING.sm, fontSize: TYPOGRAPHY.xs, color: PROF.textSecondary }]}>
              {rndLevel.motivo}
            </Text>
            <View style={fp.progressTrack}>
              <Animated.View style={[fp.progressFill, progStyle]}>
                <LinearGradient colors={rndLevel.gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              </Animated.View>
            </View>
            <View style={fp.levelStats}>
              <View style={fp.levelStat}>
                <Text style={fp.levelStatVal}>{serviciosCompletados}</Text>
                <Text style={fp.levelStatLabel}>Completados</Text>
              </View>
              <View style={fp.levelDivider} />
              <View style={fp.levelStat}>
                <Text style={fp.levelStatVal}>{rndLevel.next ?? '∞'}</Text>
                <Text style={fp.levelStatLabel}>Meta siguiente</Text>
              </View>
              <View style={fp.levelDivider} />
              <View style={fp.levelStat}>
                <Text style={[fp.levelStatVal, { color: rndLevel.remaining === 0 ? rndLevel.color : PROF.textPrimary }]}>
                  {rndLevel.remaining === 0 ? '★' : rndLevel.remaining}
                </Text>
                <Text style={fp.levelStatLabel}>
                  {rndLevel.remaining === 0 ? 'Nivel máximo' : `Para ${rndLevel.nextLabel}`}
                </Text>
              </View>
            </View>
            <Text style={[fp.levelScore, { color: PROF.textMuted, fontSize: 10, fontStyle: 'italic', marginTop: SPACING.xs }]}>
              {quarterLabel}
            </Text>
          </LinearGradient>
        </GlassCard>

        {/* Reseñas de clientes */}
        <View style={fp.secHead}>
          <Text style={fp.secHeadTitle}>Reseñas de clientes</Text>
          {uiReviews.length > 0 && (
            <View style={fp.weekBadge}>
              <Text style={fp.weekBadgeText}>{uiReviews.length} verificadas</Text>
            </View>
          )}
        </View>

        {dataLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <ActivityIndicator color={PROF.accent} />
          </View>
        ) : uiReviews.length === 0 ? (
          <GlassCard style={fp.emptyReviewCard}>
            <View style={fp.emptyReviewInner}>
              <Ionicons name="chatbox-ellipses-outline" size={32} color={PROF.accent} />
              <Text style={fp.emptyReviewTitle}>Aún no tienes reseñas</Text>
              <Text style={fp.emptyReviewSub}>
                Cuando completes servicios y tus clientes te califiquen, sus opiniones y comentarios aparecerán aquí.
              </Text>
            </View>
          </GlassCard>
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={fp.scroll}
          key={activeTab}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PROF.accent}
              colors={[PROF.accent]}
            />
          }
        >
          {activeTab === 0 ? <FinanzasTab /> : <RendimientoTab />}
          <View style={{ height: SPACING.xl }} />
        </ScrollView>

        <RecargaModal
          visible={rechargeModalVisible}
          onClose={() => setRechargeModalVisible(false)}
          onConfirm={handleConfirmRecarga}
          loading={recharging}
        />
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
  scorePctText: { fontSize: 10, color: PROF.textMuted, width: 32, textAlign: 'right' },

  // Empty states
  emptyTxWrap: { alignItems: 'center', padding: SPACING.lg },
  emptyTxTitle: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary, marginTop: SPACING.sm },
  emptyTxSub: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, textAlign: 'center', marginTop: 4, lineHeight: 16 },
  emptyReviewCard: { marginBottom: SPACING.md },
  emptyReviewInner: { alignItems: 'center', padding: SPACING.xl },
  emptyReviewTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary, marginTop: SPACING.sm },
  emptyReviewSub: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, textAlign: 'center', marginTop: 4, lineHeight: 18, maxWidth: 280 },

  // Carrito de Comisiones
  cartGrad: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(73,192,188,0.2)' },
  cartHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cartTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cartIconBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  cartTitle: { fontSize: 14, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary },
  cartSub: { fontSize: 11, color: PROF.textSecondary, marginTop: 2 },
  cartBadgeWrap: { backgroundColor: '#EF4444', paddingHorizontal: 9, paddingVertical: 3, borderRadius: BORDER_RADIUS.full, marginLeft: 8 },
  cartBadgeNum: { color: '#fff', fontSize: 11, fontWeight: '800' },
  cartBody: { marginTop: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  cartTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  cartTotalLabel: { fontSize: 12, color: PROF.textSecondary, fontWeight: '600' },
  cartTotalAmount: { fontSize: 16, fontWeight: '800', color: PROF.accent },
  cartItemsContainer: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md },
  cartSingleItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  cartItemConcept: { flex: 1, fontSize: 11, color: PROF.textPrimary },
  cartItemFee: { fontSize: 11, fontWeight: '700', color: PROF.accent },
  cartMoreText: { fontSize: 10, color: PROF.textMuted, fontStyle: 'italic', marginTop: 4, textAlign: 'center' },
  cartPayButton: { borderRadius: BORDER_RADIUS.md, overflow: 'hidden', ...SHADOWS.glow, shadowColor: PROF.accent },
  cartPayGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  cartPayButtonText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  cartMethodsFootnote: { fontSize: 10, color: PROF.textMuted, textAlign: 'center', marginTop: 8 },
  cartUpToDateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: SPACING.sm, paddingVertical: 4 },
  cartUpToDateText: { fontSize: 12, color: PROF.success, flex: 1, lineHeight: 16 },

  // Recarga Modal (Sólido, alta legibilidad, sin transparencias borrosas)
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 5, 16, 0.85)' },
  modalSheet: {
    backgroundColor: '#041527', // Sólido deep navy, cero transparencia
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#183F67',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 25,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1C4A78',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.md,
  },
  modalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.bold,
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#A0B8D2',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalSectionLabel: {
    fontSize: 11,
    color: '#49C0BC',
    fontWeight: TYPOGRAPHY.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#0A223E',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#173D68',
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: 'rgba(73, 192, 188, 0.22)',
    borderColor: '#49C0BC',
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.bold,
    color: '#D2E3F3',
  },
  presetChipTextActive: {
    color: '#49C0BC',
    fontWeight: TYPOGRAPHY.bold,
  },
  customInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A223E',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#173D68',
    paddingHorizontal: 14,
    marginBottom: SPACING.md,
  },
  customInputPrefix: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.bold,
    color: '#49C0BC',
    marginRight: 6,
  },
  customInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
    fontWeight: TYPOGRAPHY.semibold,
  },
  modalSummaryBox: {
    backgroundColor: '#071A2E',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#153A62',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#A0B8D2',
    fontWeight: TYPOGRAPHY.medium,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.bold,
    color: '#49C0BC',
  },
  methodsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  methodsText: {
    fontSize: 11,
    color: '#A0B8D2',
    flex: 1,
  },
  modalPayBtn: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.glow,
    shadowColor: PROF.accent,
  },
  modalPayGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  modalPayText: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.bold,
    color: '#001B38',
  },
});
