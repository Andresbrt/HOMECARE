/**
 * SubscriptionScreen -- Suscripcion Premium
 * Plan unico: $35.700 COP/mes (30.000 base + 19% IVA)
 * Homecare Colorimetria - Colombia
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, SPACING, BORDER_RADIUS } from '../../constants/theme';
import {
  MP_CALLBACK_SLUGS,
  MP_SANDBOX,
  PLAN_PRECIO_BASE_COP,
  PLAN_IVA_COP,
  PLAN_PRECIO_TOTAL_COP,
} from '../../constants/payment';
import { createSubscriptionCheckout, getMySubscription } from '../../services/paymentService';

// ---- Formatear precio colombiano: 35700 -> "35.700" -------------------------
const formatCOP = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// ---- Plan unico Premium -----------------------------------------------------
const PREMIUM_PLAN = {
  id:          'premium',
  name:        'Suscripcion Premium',
  color:       PROF.accent,
  icon:        'star',
  precioBase:  PLAN_PRECIO_BASE_COP,
  iva:         PLAN_IVA_COP,
  precioTotal: PLAN_PRECIO_TOTAL_COP,
  beneficios: [
    { label: 'Descuento especial en todos los servicios', icon: 'pricetag-outline'         },
    { label: 'Prioridad alta al asignar profesionales',   icon: 'flash-outline'            },
    { label: 'Pasa primero en la cola de servicio',       icon: 'rocket-outline'           },
    { label: 'Acceso a profesionales verificados',        icon: 'shield-checkmark-outline' },
    { label: 'Chat en tiempo real con profesionales',     icon: 'chatbubbles-outline'      },
    { label: 'Soporte prioritario 24/7',                  icon: 'headset-outline'          },
    { label: 'Garantia de satisfaccion',                  icon: 'ribbon-outline'           },
  ],
};

// ---- Pasos de confirmacion --------------------------------------------------
const CONFIRM_STEPS = [
  { id: 0, label: 'Procesando pago',    icon: 'card-outline'             },
  { id: 1, label: 'Verificando con MP', icon: 'shield-checkmark-outline' },
  { id: 2, label: 'Activando tu plan',  icon: 'star-outline'             },
];

// ---- Chips de confianza -----------------------------------------------------
const TRUST_ITEMS = [
  { icon: 'lock-closed-outline',    label: 'Pago seguro SSL'         },
  { icon: 'refresh-circle-outline', label: 'Cancela cuando quieras'  },
  { icon: 'checkmark-done-outline', label: 'Sin costos ocultos'      },
];

// ---- Config resultado de pago -----------------------------------------------
const RESULT_CONFIG = {
  success: {
    gradColors: PROF.gradAccent,
    iconName:   'checkmark-circle',
    iconColor:  PROF.bgDeep,
    title:      'Suscripcion activada!',
    ctaLabel:   'Continuar',
    ctaIcon:    'arrow-forward',
    showRetry:  false,
    pulse:      true,
  },
  pending: {
    gradColors: ['#F5A623', '#e08800'],
    iconName:   'time-outline',
    iconColor:  '#fff',
    title:      'Pago en revision',
    ctaLabel:   'Entendido',
    ctaIcon:    'close',
    showRetry:  false,
    pulse:      false,
  },
  failure: {
    gradColors: [PROF.error, '#cc2222'],
    iconName:   'close-circle',
    iconColor:  '#fff',
    title:      'Pago no completado',
    ctaLabel:   'Cerrar',
    ctaIcon:    'close',
    showRetry:  true,
    pulse:      false,
  },
};

// ============================================================================
// COMPONENTE: Anillos animados hero (3 ondas que se expanden)
// ============================================================================
function HeroRings() {
  const r1 = useSharedValue(1);
  const r2 = useSharedValue(1);
  const r3 = useSharedValue(1);

  useEffect(() => {
    r1.value = withRepeat(withTiming(2.2, { duration: 2200 }), -1, false);
    r2.value = withDelay(720,  withRepeat(withTiming(2.2, { duration: 2200 }), -1, false));
    r3.value = withDelay(1440, withRepeat(withTiming(2.2, { duration: 2200 }), -1, false));
  }, []);

  const s1 = useAnimatedStyle(() => ({
    transform: [{ scale: r1.value }],
    opacity: interpolate(r1.value, [1, 2.2], [0.50, 0]),
  }));
  const s2 = useAnimatedStyle(() => ({
    transform: [{ scale: r2.value }],
    opacity: interpolate(r2.value, [1, 2.2], [0.35, 0]),
  }));
  const s3 = useAnimatedStyle(() => ({
    transform: [{ scale: r3.value }],
    opacity: interpolate(r3.value, [1, 2.2], [0.20, 0]),
  }));

  const ring = {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, borderColor: PROF.accent,
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={ringStyles.center}>
        <Animated.View style={[ring, s3]} />
        <Animated.View style={[ring, s2]} />
        <Animated.View style={[ring, s1]} />
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

// ============================================================================
// COMPONENTE: Particula individual (burst de exito)
// ============================================================================
function ParticleItem({ angle, delay, color, size }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 900 }));
  }, []);
  const style = useAnimatedStyle(() => {
    const dist = 120 * progress.value;
    return {
      transform: [
        { translateX: Math.cos(angle) * dist },
        { translateY: Math.sin(angle) * dist },
      ],
      opacity: interpolate(progress.value, [0, 0.12, 0.80, 1], [0, 1, 1, 0]),
    };
  });
  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, position: 'absolute' },
        style,
      ]}
    />
  );
}

function SuccessParticles() {
  const palette = [PROF.accent, '#fff', '#F5A623', PROF.accent, '#7de8e5', '#fff'];
  const COUNT   = 14;
  return (
    <View style={[StyleSheet.absoluteFill, partStyles.center]} pointerEvents="none">
      {Array.from({ length: COUNT }, (_, i) => (
        <ParticleItem
          key={i}
          angle={(i / COUNT) * 2 * Math.PI - Math.PI / 2}
          delay={i * 20}
          color={palette[i % palette.length]}
          size={i % 3 === 0 ? 9 : 6}
        />
      ))}
    </View>
  );
}

const partStyles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
});

// ============================================================================
// COMPONENTE: Overlay de confirmacion paso a paso
// ============================================================================
function ConfirmingOverlay() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 900);
    const t2 = setTimeout(() => setStep(2), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 900 }), -1, false);
  }, []);
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  return (
    <View style={oStyles.bg}>
      <GlassCard style={oStyles.confirmCard}>
        <Animated.View style={spinStyle}>
          <LinearGradient colors={PROF.gradAccent} style={oStyles.confirmSpinner}>
            <Ionicons name="sync" size={26} color={PROF.bgDeep} />
          </LinearGradient>
        </Animated.View>
        <Text style={oStyles.confirmTitle}>Confirmando suscripcion...</Text>
        <View style={oStyles.stepList}>
          {CONFIRM_STEPS.map((s) => {
            const done   = step > s.id;
            const active = step === s.id;
            return (
              <View key={s.id} style={oStyles.stepRow}>
                {done
                  ? <Ionicons name="checkmark-circle" size={18} color={PROF.accent} />
                  : active
                  ? <ActivityIndicator size="small" color={PROF.accent} />
                  : <Ionicons name="ellipse-outline" size={18} color={PROF.textMuted} />
                }
                <Text style={[
                  oStyles.stepLabel,
                  done   && { color: PROF.accent },
                  active && { color: PROF.textPrimary, fontWeight: '600' },
                ]}>{s.label}</Text>
              </View>
            );
          })}
        </View>
      </GlassCard>
    </View>
  );
}

// ============================================================================
// COMPONENTE: Overlay resultado de pago
// ============================================================================
function PaymentResultOverlay({ status, onConfirm, onRetry }) {
  const cfg = RESULT_CONFIG[status] ?? RESULT_CONFIG.failure;

  const cardScale   = useSharedValue(0.55);
  const cardOpacity = useSharedValue(0);
  useEffect(() => {
    cardScale.value   = withSpring(1, { damping: 12, stiffness: 130 });
    cardOpacity.value = withTiming(1, { duration: 260 });
  }, []);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity:   cardOpacity.value,
  }));

  const ringScale = useSharedValue(1);
  const ringAlpha = useSharedValue(0.7);
  useEffect(() => {
    if (!cfg.pulse) return;
    ringScale.value = withRepeat(withTiming(2.8, { duration: 1500 }), -1, false);
    ringAlpha.value = withRepeat(withTiming(0,   { duration: 1500 }), -1, false);
  }, [cfg.pulse]);
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity:   ringAlpha.value,
  }));

  const subtitle =
    status === 'success'
      ? 'Tu Suscripcion Premium esta activa. Disfruta todos los beneficios exclusivos!'
      : status === 'pending'
      ? 'Estamos procesando tu pago. Te notificaremos cuando sea confirmado.'
      : 'No pudimos procesar el pago. Revisa tus datos o intenta con otro metodo de pago.';

  return (
    <View style={oStyles.bg}>
      {status === 'success' && <SuccessParticles />}
      <Animated.View style={[oStyles.resultCard, cardStyle]}>
        <GlassCard variant={status === 'success' ? 'accent' : 'default'} style={oStyles.inner}>

          <View style={oStyles.iconContainer}>
            {cfg.pulse && (
              <Animated.View style={[oStyles.pulseRing, ringStyle, { borderColor: PROF.accent }]} />
            )}
            <LinearGradient colors={cfg.gradColors} style={oStyles.iconCircle}>
              <Ionicons name={cfg.iconName} size={40} color={cfg.iconColor} />
            </LinearGradient>
          </View>

          <Text style={oStyles.resultTitle}>{cfg.title}</Text>
          <Text style={oStyles.resultSubtitle}>{subtitle}</Text>

          {status === 'success' && (
            <LinearGradient colors={PROF.gradAccent} style={oStyles.planPill}>
              <Ionicons name="star" size={12} color={PROF.bgDeep} />
              <Text style={oStyles.planPillText}>
                Premium  *  ${formatCOP(PLAN_PRECIO_TOTAL_COP)} COP/mes
              </Text>
            </LinearGradient>
          )}

          {MP_SANDBOX && (
            <View style={oStyles.sandboxBadge}>
              <Ionicons name="flask-outline" size={11} color={PROF.warning} />
              <Text style={oStyles.sandboxText}>SANDBOX -- SOLO PARA PRUEBAS</Text>
            </View>
          )}

          <View style={oStyles.btnRow}>
            {cfg.showRetry && (
              <TouchableOpacity onPress={onRetry} style={[oStyles.btn, oStyles.btnSecondary]}>
                <Ionicons name="refresh" size={15} color={PROF.textPrimary} />
                <Text style={oStyles.btnSecondaryLabel}>Reintentar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onConfirm} activeOpacity={0.85} style={{ flex: 1 }}>
              <LinearGradient colors={cfg.gradColors} style={[oStyles.btn, oStyles.btnPrimary]}>
                <Text style={oStyles.btnPrimaryLabel}>{cfg.ctaLabel}</Text>
                <Ionicons name={cfg.ctaIcon} size={15} color={cfg.iconColor} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </GlassCard>
      </Animated.View>
    </View>
  );
}

const oStyles = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,15,34,0.92)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 100, paddingHorizontal: SPACING.lg,
  },
  resultCard: { width: '100%', maxWidth: 360 },
  inner:      { alignItems: 'center', gap: SPACING.sm },

  iconContainer: {
    width: 88, height: 88,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2,
  },

  resultTitle:    { fontSize: 23, fontWeight: '800', color: PROF.textPrimary, textAlign: 'center', letterSpacing: -0.3 },
  resultSubtitle: { fontSize: 14, color: PROF.textSecondary, textAlign: 'center', lineHeight: 21 },

  planPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    marginTop: SPACING.xs,
  },
  planPillText: { fontSize: 13, fontWeight: '700', color: PROF.bgDeep },

  sandboxBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,166,35,0.12)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    marginTop: SPACING.xs,
  },
  sandboxText: { fontSize: 10, fontWeight: '700', color: PROF.warning, letterSpacing: 0.4 },

  btnRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md, width: '100%' },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, height: 48, borderRadius: BORDER_RADIUS.lg,
  },
  btnSecondary:      { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  btnSecondaryLabel: { fontSize: 14, fontWeight: '600', color: PROF.textPrimary },
  btnPrimary:        { shadowColor: PROF.accent, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  btnPrimaryLabel:   { fontSize: 15, fontWeight: '700', color: PROF.bgDeep },

  confirmCard:    { margin: SPACING.lg, padding: SPACING.xl, alignItems: 'center', gap: SPACING.md },
  confirmSpinner: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  confirmTitle:   { fontSize: 17, fontWeight: '700', color: PROF.textPrimary, textAlign: 'center' },
  stepList:       { width: '100%', gap: 10, marginTop: SPACING.xs },
  stepRow:        { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  stepLabel:      { fontSize: 13, color: PROF.textMuted, flex: 1 },
});

// ============================================================================
// COMPONENTE: Modal Checkout Mercado Pago
// ============================================================================
function CheckoutModal({ visible, url, insets, onClose, webViewRef, onPaymentResult }) {
  const [wvLoading, setWvLoading] = React.useState(false);

  const handleNavChange = ({ url: navUrl }) => {
    if (!navUrl) return true;
    if (navUrl.includes(MP_CALLBACK_SLUGS.success) || navUrl.includes('status=approved')) {
      onClose(); onPaymentResult('success'); return false;
    }
    if (navUrl.includes(MP_CALLBACK_SLUGS.failure) || navUrl.includes('status=failure')) {
      onClose(); onPaymentResult('failure'); return false;
    }
    if (navUrl.includes(MP_CALLBACK_SLUGS.pending) || navUrl.includes('status=pending')) {
      onClose(); onPaymentResult('pending'); return false;
    }
    return true;
  };

  const confirmClose = () =>
    Alert.alert(
      'Cancelar pago',
      'Si cierras ahora, tu proceso de pago sera cancelado.',
      [
        { text: 'Continuar pagando', style: 'cancel' },
        { text: 'Cancelar pago',     style: 'destructive', onPress: onClose },
      ],
    );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={confirmClose} statusBarTranslucent>
      <View style={[ckStyles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={PROF.gradMain} style={StyleSheet.absoluteFill} />

        <View style={ckStyles.bar}>
          <TouchableOpacity
            onPress={confirmClose}
            style={ckStyles.closeBtn}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="close" size={20} color={PROF.textPrimary} />
          </TouchableOpacity>
          <View style={ckStyles.titleRow}>
            <Ionicons name="lock-closed" size={13} color={PROF.accent} />
            <Text style={ckStyles.barTitle}>Pago seguro  *  Mercado Pago</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {MP_SANDBOX && (
          <View style={ckStyles.sandboxBar}>
            <Ionicons name="flask" size={12} color={PROF.bgDeep} />
            <Text style={ckStyles.sandboxBarText}>SANDBOX  *  Credenciales de prueba activas</Text>
          </View>
        )}

        {wvLoading && (
          <View style={ckStyles.loaderWrap}>
            <ActivityIndicator color={PROF.accent} size="large" />
          </View>
        )}

        {url && (
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            style={ckStyles.webview}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            onLoadStart={() => setWvLoading(true)}
            onLoadEnd={() => setWvLoading(false)}
            onError={() => setWvLoading(false)}
            onShouldStartLoadWithRequest={handleNavChange}
          />
        )}
      </View>
    </Modal>
  );
}

const ckStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PROF.bgDeep },
  bar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  barTitle: { fontSize: 14, fontWeight: '600', color: PROF.textPrimary },
  sandboxBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: PROF.warning, paddingVertical: 5,
  },
  sandboxBarText: { fontSize: 11, fontWeight: '800', color: PROF.bgDeep, letterSpacing: 0.3 },
  loaderWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 10, backgroundColor: 'rgba(0,15,34,0.6)',
  },
  webview: { flex: 1 },
});

// ============================================================================
// COMPONENTE: Trust badges (3 chips de confianza)
// ============================================================================
function TrustBadges() {
  return (
    <View style={tbStyles.row}>
      {TRUST_ITEMS.map((item, i) => (
        <View key={i} style={tbStyles.badge}>
          <Ionicons name={item.icon} size={12} color={PROF.accent} />
          <Text style={tbStyles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const tbStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 6,
    marginVertical: SPACING.sm,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  label: { fontSize: 10, color: PROF.textMuted, fontWeight: '500' },
});

// ============================================================================
// COMPONENTE: Tarjeta "Ya eres Premium" (cuando user ya tiene plan activo)
// ============================================================================
function PremiumActiveCard({ onClose }) {
  return (
    <Animated.View entering={FadeInDown.duration(450).springify()}>
      <GlassCard variant="accent" style={paStyles.card}>
        <LinearGradient
          colors={['rgba(73,192,188,0.18)', 'rgba(73,192,188,0.03)']}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient colors={PROF.gradAccent} style={paStyles.iconCircle}>
          <Ionicons name="checkmark-circle" size={28} color={PROF.bgDeep} />
        </LinearGradient>
        <Text style={paStyles.title}>Plan Premium Activo</Text>
        <Text style={paStyles.sub}>
          Todos los beneficios estan disponibles para ti. Disfruta la prioridad y los descuentos exclusivos.
        </Text>
        <LinearGradient colors={PROF.gradAccent} style={paStyles.pill}>
          <Ionicons name="star" size={11} color={PROF.bgDeep} />
          <Text style={paStyles.pillText}>${formatCOP(PLAN_PRECIO_TOTAL_COP)} COP/mes</Text>
        </LinearGradient>
        <TouchableOpacity onPress={onClose} style={paStyles.backBtn}>
          <Ionicons name="arrow-back" size={14} color={PROF.accent} />
          <Text style={paStyles.backBtnText}>Volver al inicio</Text>
        </TouchableOpacity>
      </GlassCard>
    </Animated.View>
  );
}

const paStyles = StyleSheet.create({
  card:      { alignItems: 'center', gap: SPACING.sm, overflow: 'hidden', marginTop: SPACING.sm },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: PROF.textPrimary },
  sub:   { fontSize: 13, color: PROF.textSecondary, textAlign: 'center', lineHeight: 20 },
  pill:  {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  pillText: { fontSize: 13, fontWeight: '700', color: PROF.bgDeep },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: SPACING.xs,
  },
  backBtnText: { fontSize: 13, fontWeight: '600', color: PROF.accent },
});

// ============================================================================
// PANTALLA PRINCIPAL
// ============================================================================
export default function SubscriptionScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const insets = useSafeAreaInsets();

  const isPremium = user?.plan === 'premium';

  const [loading, setLoading]                 = useState(false);
  const [checkoutUrl, setCheckoutUrl]         = useState(null);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  // 'idle' | 'confirming' | 'success' | 'failure' | 'pending'
  const [paymentStatus, setPaymentStatus]     = useState('idle');
  const webViewRef = useRef(null);

  const btnGlow  = useSharedValue(0.5);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    btnGlow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500 }), withTiming(0.3, { duration: 1500 })),
      -1, true,
    );
  }, []);

  useEffect(() => {
    if (!checkoutVisible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [checkoutVisible]);

  const glowStyle  = useAnimatedStyle(() => ({ opacity: interpolate(btnGlow.value, [0, 1], [0.22, 0.68]) }));
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  // ---- Iniciar checkout ----
  const handleSubscribe = useCallback(async () => {
    if (isPremium) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await createSubscriptionCheckout('premium');
      if (!result?.ok) throw new Error(result?.error ?? 'Error al iniciar pago');
      setCheckoutUrl(result.data.initPoint);
      setCheckoutVisible(true);
    } catch (err) {
      Alert.alert('Error al iniciar pago', err.message);
    } finally {
      setLoading(false);
    }
  }, [isPremium]);

  // ---- Resultado del pago (interceptado por WebView) ----
  const handlePaymentResult = useCallback(async (status) => {
    Haptics.notificationAsync(
      status === 'success'
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    );

    if (status === 'success') {
      setPaymentStatus('confirming');

      const minDelay = new Promise(res => setTimeout(res, 2600));
      const work     = async () => {
        try {
          // 1. Actualizacion optimista en AuthContext/SecureStore
          await updateUser({ plan: 'premium' });
          // 2. Sincronizar estado real del backend (puede llegar despues del webhook)
          const result = await getMySubscription();
          if (result?.ok && result?.data?.plan) {
            await updateUser({ plan: result.data.plan.toLowerCase() });
          }
        } catch (_) {
          // La actualizacion local optimista es suficiente
        }
      };

      await Promise.all([minDelay, work()]);
      setPaymentStatus('success');
    } else {
      setPaymentStatus(status);
    }
  }, [updateUser]);

  const handleResultConfirm = useCallback(() => {
    const prev = paymentStatus;
    setPaymentStatus('idle');
    if (prev === 'success' || prev === 'pending') navigation.goBack();
  }, [paymentStatus, navigation]);

  const handleResultRetry = useCallback(() => {
    setPaymentStatus('idle');
    setCheckoutUrl(null);
    setTimeout(() => handleSubscribe(), 120);
  }, [handleSubscribe]);

  return (
    <View style={s.screen}>
      <LinearGradient colors={PROF.gradMain} style={StyleSheet.absoluteFill} />

      {/* ---- Top Bar ---- */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={PROF.textPrimary} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Suscripcion</Text>
        {MP_SANDBOX && (
          <View style={s.sandboxChip}>
            <Ionicons name="flask" size={9} color={PROF.bgDeep} />
            <Text style={s.sandboxChipText}>SANDBOX</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Hero con anillos ---- */}
        <Animated.View entering={FadeIn.duration(520)} style={s.heroWrap}>
          <View style={s.heroIconWrap}>
            <HeroRings />
            <LinearGradient colors={PROF.gradAccent} style={s.heroIcon}>
              <Ionicons name="star" size={36} color={PROF.bgDeep} />
            </LinearGradient>
          </View>
          <Text style={s.heroTitle}>Suscripcion Premium</Text>
          <Text style={s.heroSubtitle}>
            Accede a los mejores profesionales con beneficios exclusivos y prioridad garantizada.
          </Text>
        </Animated.View>

        {/* ---- Tarjeta precio + beneficios ---- */}
        <Animated.View entering={FadeInDown.delay(80).duration(450).springify()}>
          <GlassCard variant="accent" style={s.priceCard}>

            {/* Shimmer diagonal decorativo */}
            <LinearGradient
              colors={['transparent', 'rgba(73,192,188,0.08)', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={s.planBadge}>
              <Ionicons name="flame" size={9} color={PROF.bgDeep} />
              <Text style={s.planBadgeText}>PLAN UNICO  *  COLOMBIA</Text>
            </View>

            {/* Desglose COP + IVA 19% */}
            <View style={s.priceSection}>
              <View style={s.priceRow}>
                <Text style={s.priceLabel}>Precio base</Text>
                <Text style={s.priceValue}>${formatCOP(PLAN_PRECIO_BASE_COP)} COP</Text>
              </View>
              <View style={s.priceRow}>
                <Text style={s.priceLabel}>IVA (19%)</Text>
                <Text style={s.priceValue}>+ ${formatCOP(PLAN_IVA_COP)} COP</Text>
              </View>
              <View style={s.priceDivider} />
              <View style={s.priceTotalRow}>
                <Text style={s.priceTotalLabel}>Total mensual</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.priceTotalValue}>${formatCOP(PLAN_PRECIO_TOTAL_COP)}</Text>
                  <Text style={s.priceTotalCurrency}>COP / mes</Text>
                </View>
              </View>
            </View>

            {/* Beneficios */}
            <View style={s.beneficiosList}>
              {PREMIUM_PLAN.beneficios.map((b, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.delay(100 + i * 45).duration(380)}
                  style={s.beneficioRow}
                >
                  <LinearGradient colors={PROF.gradAccent} style={s.bIconCircle}>
                    <Ionicons name={b.icon} size={13} color={PROF.bgDeep} />
                  </LinearGradient>
                  <Text style={s.beneficioText}>{b.label}</Text>
                </Animated.View>
              ))}
            </View>

            {isPremium && (
              <View style={s.activeRow}>
                <Ionicons name="checkmark-circle" size={17} color={PROF.accent} />
                <Text style={s.activeText}>Ya tienes Premium activo</Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* ---- Tarjeta promo para profesionales ---- */}
        <Animated.View entering={FadeInDown.delay(300).duration(450).springify()}>
          <GlassCard style={s.promoCard}>
            <LinearGradient
              colors={['rgba(73,192,188,0.15)', 'rgba(73,192,188,0.03)']}
              style={StyleSheet.absoluteFill}
            />

            {/* Comilla decorativa gigante de fondo */}
            <Text style={s.promoQuoteDecor}>"</Text>

            <View style={s.promoHeader}>
              <LinearGradient colors={PROF.gradAccent} style={s.promoIconCircle}>
                <Ionicons name="trending-up" size={17} color={PROF.bgDeep} />
              </LinearGradient>
              <View>
                <Text style={s.promoTitle}>Para profesionales</Text>
                <Text style={s.promoTitleSub}>Multiplica tus ingresos diarios</Text>
              </View>
            </View>

            <Text style={s.promoText}>
              Con{' '}
              <Text style={s.promoHighlight}>$30.000</Text>
              {' '}te puedes hacer entre{' '}
              <Text style={s.promoHighlight}>$160.000 y $200.000 al dia</Text>
              {' '}realizando servicios con nosotros.
            </Text>

            <View style={s.promoStatRow}>
              <View style={s.promoStat}>
                <Text style={s.promoStatValue}>x5+</Text>
                <Text style={s.promoStatLabel}>retorno diario</Text>
              </View>
              <View style={s.promoStatDivider} />
              <View style={s.promoStat}>
                <Text style={s.promoStatValue}>Alta</Text>
                <Text style={s.promoStatLabel}>prioridad en cola</Text>
              </View>
              <View style={s.promoStatDivider} />
              <View style={s.promoStat}>
                <Text style={s.promoStatValue}>100%</Text>
                <Text style={s.promoStatLabel}>verificados</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* ---- Trust badges ---- */}
        <Animated.View entering={FadeInDown.delay(420).duration(400)}>
          <TrustBadges />
        </Animated.View>

        {/* ---- CTA o tarjeta "ya eres premium" ---- */}
        {isPremium ? (
          <PremiumActiveCard onClose={() => navigation.goBack()} />
        ) : (
          <Animated.View entering={FadeInDown.delay(500).springify()} style={s.ctaWrap}>
            <Animated.View style={[s.ctaGlow, glowStyle]} />
            <Animated.View style={scaleStyle}>
              <TouchableOpacity
                onPress={handleSubscribe}
                onPressIn={() => { btnScale.value = withSpring(0.96, { damping: 14 }); }}
                onPressOut={() => { btnScale.value = withSpring(1.0, { damping: 14 }); }}
                disabled={loading}
                activeOpacity={1}
              >
                <LinearGradient colors={PROF.gradAccent} style={s.ctaBtn}>
                  {loading
                    ? <ActivityIndicator color={PROF.bgDeep} />
                    : (
                      <>
                        <Ionicons name="star" size={18} color={PROF.bgDeep} />
                        <Text style={s.ctaLabel}>
                          Activar por ${formatCOP(PLAN_PRECIO_TOTAL_COP)} COP/mes
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color={PROF.bgDeep} />
                      </>
                    )
                  }
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}

        <Text style={s.disclaimer}>
          Precio en Pesos Colombianos (COP). IVA 19% incluido.{'\n'}
          Los pagos se procesan de forma segura con Mercado Pago.{'\n'}
          Puedes cancelar en cualquier momento.
        </Text>
      </ScrollView>

      {/* ---- Modal Checkout MP ---- */}
      <CheckoutModal
        visible={checkoutVisible}
        url={checkoutUrl}
        insets={insets}
        webViewRef={webViewRef}
        onClose={() => setCheckoutVisible(false)}
        onPaymentResult={handlePaymentResult}
      />

      {/* ---- Overlay confirmando ---- */}
      {paymentStatus === 'confirming' && <ConfirmingOverlay />}

      {/* ---- Overlay resultado ---- */}
      {(paymentStatus === 'success' || paymentStatus === 'failure' || paymentStatus === 'pending') && (
        <PaymentResultOverlay
          status={paymentStatus}
          onConfirm={handleResultConfirm}
          onRetry={handleResultRetry}
        />
      )}
    </View>
  );
}

// ============================================================================
// ESTILOS PRINCIPALES
// ============================================================================
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PROF.bgDeep },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingBottom: 12, gap: SPACING.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: PROF.textPrimary },
  sandboxChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: PROF.warning,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  sandboxChipText: { fontSize: 9, fontWeight: '800', color: PROF.bgDeep, letterSpacing: 0.5 },

  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },

  // Hero
  heroWrap: { alignItems: 'center', marginBottom: SPACING.xl, gap: SPACING.sm, paddingTop: SPACING.md },
  heroIconWrap: {
    width: 80, height: 80,
    justifyContent: 'center', alignItems: 'center',
    // overflow visible para que los anillos se vean fuera del bounds
    overflow: 'visible',
  },
  heroIcon: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: {
    fontSize: 27, fontWeight: '800', color: PROF.textPrimary,
    textAlign: 'center', letterSpacing: -0.5, marginTop: SPACING.sm,
  },
  heroSubtitle: {
    fontSize: 14, color: PROF.textSecondary, textAlign: 'center',
    lineHeight: 21, paddingHorizontal: SPACING.lg,
  },

  // Tarjeta precio
  priceCard: { marginBottom: SPACING.md, overflow: 'hidden', paddingTop: SPACING.lg },
  planBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: PROF.accent, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  planBadgeText: { fontSize: 8, fontWeight: '800', color: PROF.bgDeep, letterSpacing: 0.5 },

  // Desglose precio
  priceSection:       { marginBottom: SPACING.md, gap: 9 },
  priceRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel:         { fontSize: 13, color: PROF.textSecondary },
  priceValue:         { fontSize: 14, fontWeight: '600', color: PROF.textPrimary },
  priceDivider:       { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 4 },
  priceTotalRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceTotalLabel:    { fontSize: 14, fontWeight: '700', color: PROF.textPrimary },
  priceTotalValue:    { fontSize: 30, fontWeight: '800', color: PROF.accent, textAlign: 'right', letterSpacing: -0.5 },
  priceTotalCurrency: { fontSize: 11, color: PROF.textMuted, textAlign: 'right' },

  // Beneficios
  beneficiosList: { gap: 11, marginBottom: SPACING.sm },
  beneficioRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bIconCircle: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  beneficioText: { fontSize: 13, color: PROF.textSecondary, flex: 1, lineHeight: 18 },

  // Estado activo en tarjeta
  activeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(73,192,188,0.12)',
    borderRadius: BORDER_RADIUS.md, paddingVertical: 8, paddingHorizontal: 12,
    marginTop: SPACING.xs,
  },
  activeText: { fontSize: 13, fontWeight: '600', color: PROF.accent },

  // Tarjeta promo profesionales
  promoCard: { marginBottom: SPACING.sm, overflow: 'hidden' },
  promoQuoteDecor: {
    position: 'absolute', top: -15, left: 8,
    fontSize: 110, fontWeight: '900', color: PROF.accent,
    opacity: 0.10, lineHeight: 110,
  },
  promoHeader:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  promoIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  promoTitle:    { fontSize: 15, fontWeight: '700', color: PROF.textPrimary },
  promoTitleSub: { fontSize: 11, color: PROF.textMuted, marginTop: 1 },
  promoText:     { fontSize: 15, color: PROF.textSecondary, lineHeight: 24, marginBottom: SPACING.md },
  promoHighlight: { color: PROF.accent, fontWeight: '800' },

  promoStatRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BORDER_RADIUS.md, paddingVertical: 12, paddingHorizontal: 8,
  },
  promoStat:        { flex: 1, alignItems: 'center' },
  promoStatValue:   { fontSize: 17, fontWeight: '800', color: PROF.accent },
  promoStatLabel:   { fontSize: 10, color: PROF.textMuted, textAlign: 'center', marginTop: 3 },
  promoStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.10)' },

  // CTA
  ctaWrap: { position: 'relative', marginTop: SPACING.md, marginBottom: SPACING.sm },
  ctaGlow: {
    position: 'absolute', top: -10, left: '8%', right: '8%', bottom: -10,
    borderRadius: BORDER_RADIUS.xl, backgroundColor: PROF.accent,
    shadowColor: PROF.accent, shadowOpacity: 1, shadowRadius: 20, elevation: 0,
  },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 56, borderRadius: BORDER_RADIUS.xl,
    shadowColor: PROF.accent, shadowOpacity: 0.60, shadowRadius: 12, elevation: 8,
  },
  ctaLabel: { fontSize: 15, fontWeight: '700', color: PROF.bgDeep },

  disclaimer: {
    fontSize: 11, color: PROF.textMuted, textAlign: 'center',
    lineHeight: 17, marginTop: SPACING.sm, paddingHorizontal: SPACING.md,
  },
});