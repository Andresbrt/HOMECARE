/**
 * PremiumServicesScreen — Catálogo de servicios premium Home Care
 * Cada servicio muestra: precio, duración, features incluidas y CTA "Solicitar".
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, SPACING, BORDER_RADIUS } from '../../constants/theme';
import useModeStore from '../../store/modeStore';

// ─── Catálogo de servicios ───────────────────────────────────────────────────
const SERVICES = [
  {
    id: 'limpieza_general',
    icon: 'sparkles',
    color: PROF.accent,
    gradient: ['#49C0BC', '#2a9d99'],
    name: 'Limpieza General',
    description: 'Limpieza completa del hogar con productos de alta calidad.',
    priceRange: '$25 – $60',
    duration: '2 – 4 hrs',
    badge: 'Más solicitado',
    features: [
      'Barrido y trapeado de todos los pisos',
      'Limpieza de cocina y baños',
      'Desempolvado de muebles y superficies',
      'Vaciado de basureros',
      'Organización básica',
    ],
  },
  {
    id: 'limpieza_premium',
    icon: 'star',
    color: '#FFD700',
    gradient: ['#FFD700', '#FFA500'],
    name: 'Limpieza Premium',
    description: 'Servicio profundo con atención a todos los detalles del hogar.',
    priceRange: '$60 – $120',
    duration: '4 – 6 hrs',
    badge: 'Premium',
    features: [
      'Todo lo incluido en Limpieza General',
      'Limpieza dentro de electrodomésticos',
      'Lavado de ventanas interiores y exteriores',
      'Limpieza de alfombras y tapizados',
      'Desinfección profunda de baños y cocina',
      'Remoción de cal y sarro',
    ],
  },
  {
    id: 'limpieza_por_horas',
    icon: 'time-outline',
    color: '#7ED321',
    gradient: ['#7ED321', '#5BA515'],
    name: 'Limpieza por Horas',
    description: 'Servicio flexible adaptado a tus necesidades y disponibilidad.',
    priceRange: '$12 – $18 /hr',
    duration: 'Mínimo 2 hrs',
    badge: 'Flexible',
    features: [
      'Paga solo el tiempo que necesitas',
      'Profesional calificado a domicilio',
      'Tú decides qué áreas priorizar',
      'Sin compromiso de contrato',
    ],
  },
  {
    id: 'desinfeccion',
    icon: 'shield-checkmark',
    color: '#00BFFF',
    gradient: ['#00BFFF', '#0080C0'],
    name: 'Desinfección Profesional',
    description: 'Eliminación de virus, bacterias y alérgenos certificada.',
    priceRange: '$40 – $90',
    duration: '2 – 3 hrs',
    badge: 'Certificado',
    features: [
      'Productos certificados por autoridades sanitarias',
      'Nebulización de ambientes',
      'Desinfección de superficies de alto contacto',
      'Certificado de desinfección emitido',
      'Efectivo contra virus y hongos',
    ],
  },
  {
    id: 'organizacion',
    icon: 'albums',
    color: '#FF8C00',
    gradient: ['#FF8C00', '#CC5500'],
    name: 'Organización del Hogar',
    description: 'Sistema de organización profesional para tu espacio.',
    priceRange: '$35 – $80',
    duration: '3 – 5 hrs',
    badge: 'Nuevo',
    features: [
      'Evaluación de espacios y propuesta de mejora',
      'Organización de clósets y cajones',
      'Etiquetado y sistema de almacenamiento',
      'Descarte asistido de objetos innecesarios',
      'Guía para mantener el orden',
    ],
  },
  {
    id: 'post_obra',
    icon: 'construct',
    color: '#9B59B6',
    gradient: ['#9B59B6', '#7D3C98'],
    name: 'Limpieza Post-Obra',
    description: 'Limpieza especializada tras remodelaciones y construcciones.',
    priceRange: '$80 – $200',
    duration: '6 – 10 hrs',
    badge: 'Especializado',
    features: [
      'Remoción de residuos de construcción',
      'Limpieza de polvo de cemento y pintura',
      'Limpieza profunda de azulejos recientes',
      'Pulido y protección de pisos nuevos',
      'Retiro de materiales sobrantes',
    ],
  },
];

// ─── Tarjeta de servicio ─────────────────────────────────────────────────────
function ServiceCard({ service, onRequest, delay }) {
  const [expanded, setExpanded] = useState(false);
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500).springify()} style={styles.cardWrap}>
      <Animated.View style={scaleStyle}>
        <GlassCard variant="default" style={styles.card}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <LinearGradient colors={service.gradient} style={styles.cardIcon}>
              <Ionicons name={service.icon} size={22} color={service.color === '#FFD700' ? PROF.bgDeep : PROF.textPrimary} />
            </LinearGradient>

            <View style={{ flex: 1 }}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.cardName}>{service.name}</Text>
                <View style={[styles.cardBadge, { backgroundColor: `${service.color}22` }]}>
                  <Text style={[styles.cardBadgeText, { color: service.color }]}>{service.badge}</Text>
                </View>
              </View>
              <Text style={styles.cardDescription} numberOfLines={2}>{service.description}</Text>
            </View>
          </View>

          {/* Precio y duración */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={14} color={PROF.accent} />
              <Text style={styles.metaValue}>{service.priceRange}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={PROF.accent} />
              <Text style={styles.metaValue}>{service.duration}</Text>
            </View>
          </View>

          {/* Features expandibles */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setExpanded(e => !e);
            }}
            style={styles.expandBtn}
          >
            <Text style={styles.expandLabel}>
              {expanded ? 'Ocultar detalles' : 'Ver qué incluye'}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={PROF.accent}
            />
          </TouchableOpacity>

          {expanded && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.featuresList}>
              {service.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={14} color={service.color} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* CTA */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onRequest(service);
            }}
            onPressIn={() => { scale.value = withSpring(0.97, { damping: 14 }); }}
            onPressOut={() => { scale.value = withSpring(1,    { damping: 14 }); }}
            activeOpacity={1}
          >
            <LinearGradient colors={service.gradient} style={styles.ctaBtn}>
              <Text style={styles.ctaLabel}>Solicitar servicio</Text>
              <Ionicons name="arrow-forward" size={16} color={PROF.textPrimary} />
            </LinearGradient>
          </TouchableOpacity>
        </GlassCard>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function PremiumServicesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const mode = useModeStore((s) => s.mode);

  const handleRequest = (service) => {
    // ServiceRequest solo existe en UserModeStack — los profesionales no pueden solicitarlo
    if (mode !== 'usuario') {
      Alert.alert(
        'Solo para usuarios',
        'Los profesionales no pueden solicitar servicios. Cambia al modo usuario para continuar.',
        [{ text: 'Entendido' }]
      );
      return;
    }
    navigation.navigate('ServiceRequest', { tipoServicio: service.id });
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={PROF.gradMain} style={StyleSheet.absoluteFill} />

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={PROF.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Servicios Premium</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.heroWrap}>
          <LinearGradient colors={PROF.gradAccent} style={styles.heroIcon}>
            <Ionicons name="diamond-outline" size={30} color={PROF.bgDeep} />
          </LinearGradient>
          <Text style={styles.heroTitle}>Servicios del hogar</Text>
          <Text style={styles.heroSubtitle}>
            Profesionales verificados y certificados listos para transformar tu espacio.
          </Text>
        </Animated.View>

        {/* Catálogo */}
        {SERVICES.map((svc, i) => (
          <ServiceCard
            key={svc.id}
            service={svc}
            onRequest={handleRequest}
            delay={i * 70}
          />
        ))}

        {/* Info adicional */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <GlassCard variant="default" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={PROF.accent} />
              <Text style={styles.infoText}>Todos los profesionales están verificados y asegurados</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="star-outline" size={18} color={PROF.accent} />
              <Text style={styles.infoText}>Garantía de satisfacción o repetimos el servicio sin costo</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="refresh-circle-outline" size={18} color={PROF.accent} />
              <Text style={styles.infoText}>Cancelación gratuita con 2 horas de anticipación</Text>
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PROF.bgDeep },

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

  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },

  // Hero
  heroWrap: { alignItems: 'center', marginBottom: SPACING.xl, gap: SPACING.sm },
  heroIcon: { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: PROF.textPrimary, textAlign: 'center' },
  heroSubtitle: {
    fontSize: 13, color: PROF.textSecondary, textAlign: 'center',
    lineHeight: 19, paddingHorizontal: SPACING.md,
  },

  // Card
  cardWrap: { marginBottom: SPACING.md },
  card: {},
  cardHeader: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  cardIcon: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  nameBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' },
  cardName: { fontSize: 16, fontWeight: '700', color: PROF.textPrimary },
  cardBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  cardBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  cardDescription: { fontSize: 12, color: PROF.textSecondary, lineHeight: 16 },

  // Meta (precio / duración)
  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 8, paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  metaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  metaValue: { fontSize: 13, color: PROF.textSecondary, fontWeight: '600' },
  metaDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Expand
  expandBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: SPACING.sm,
  },
  expandLabel: { fontSize: 13, color: PROF.accent, fontWeight: '600' },
  featuresList: { gap: 7, marginBottom: SPACING.sm },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  featureText: { flex: 1, fontSize: 13, color: PROF.textSecondary, lineHeight: 17 },

  // CTA
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 46, borderRadius: BORDER_RADIUS.lg,
    marginTop: 4,
  },
  ctaLabel: { fontSize: 14, fontWeight: '700', color: PROF.textPrimary },

  // Info footer
  infoCard: { marginBottom: SPACING.lg, gap: SPACING.sm },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { flex: 1, fontSize: 13, color: PROF.textSecondary, lineHeight: 18 },
});
