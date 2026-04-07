/**
 * QuickActionButtons — Botones rapidos de servicio de limpieza
 * "Limpieza General" | "Limpieza Premium" | "Limpieza por Horas"
 * Navegan a CreateRequestScreen con tipo pre-seleccionado
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

// ─── Definición de los 3 servicios rápidos ────────────────────────────────────
const QUICK_SERVICES = [
  {
    id: 'general',
    label: 'Limpieza General',
    subtitle: 'Hogar o apartamento',
    icon: 'sparkles-outline',
    tipoLimpieza: 'BASICA',
    titulo: 'Limpieza General del Hogar',
    gradient: ['#0E4D68', '#49C0BC'],
    badge: 'Popular',
  },
  {
    id: 'premium',
    label: 'Limpieza Premium',
    subtitle: 'Profunda y detallada',
    icon: 'diamond-outline',
    tipoLimpieza: 'PROFUNDA',
    titulo: 'Limpieza Premium Profunda',
    gradient: ['#1a3d5c', '#2a9d99'],
    badge: 'Recomendado',
  },
  {
    id: 'horas',
    label: 'Limpieza por Horas',
    subtitle: 'Flexible, tu eliges el tiempo',
    icon: 'time-outline',
    tipoLimpieza: 'BASICA',
    titulo: 'Servicio de Limpieza por Horas',
    gradient: ['#0a2640', '#1a6b5a'],
    badge: null,
  },
];

// ─── Botón individual ─────────────────────────────────────────────────────────
function ServiceButton({ service, onPress, index }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.93, { damping: 14 }, () => {
      scale.value = withSpring(1, { damping: 14 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(service);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 90).springify().damping(16)}
      style={[styles.btnWrap, animStyle]}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={1} style={styles.btnTouchable}>
        <LinearGradient colors={service.gradient} style={styles.btnGradient}>
          {/* Badge */}
          {service.badge && (
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>{service.badge}</Text>
            </View>
          )}

          {/* Icono grande */}
          <View style={styles.iconCircle}>
            <Ionicons name={service.icon} size={26} color="#fff" />
          </View>

          {/* Textos */}
          <Text style={styles.btnLabel}>{service.label}</Text>
          <Text style={styles.btnSubtitle}>{service.subtitle}</Text>

          {/* Flecha */}
          <View style={styles.arrowRow}>
            <Text style={styles.ctaText}>Solicitar ahora</Text>
            <Ionicons name="arrow-forward-circle" size={18} color="rgba(255,255,255,0.7)" />
          </View>

          {/* Brillo decorativo */}
          <View style={styles.shimmer} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function QuickActionButtons({ navigation }) {
  const handleServicePress = (service) => {
    navigation.navigate('ServiceRequest', {
      service: {
        title: service.titulo,
        tipoLimpieza: service.tipoLimpieza,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify()} style={styles.headerRow}>
        <Ionicons name="flash" size={16} color={PROF.accent} />
        <Text style={styles.sectionTitle}>Solicitar servicio rapido</Text>
      </Animated.View>
      <Text style={styles.sectionSubtitle}>
        Profesionales verificados disponibles ahora
      </Text>

      <View style={styles.grid}>
        {/* Primera fila: dos botones */}
        <View style={styles.gridRow}>
          {QUICK_SERVICES.slice(0, 2).map((s, i) => (
            <View key={s.id} style={styles.gridHalf}>
              <ServiceButton service={s} index={i} onPress={handleServicePress} />
            </View>
          ))}
        </View>
        {/* Segunda fila: botón completo */}
        <ServiceButton service={QUICK_SERVICES[2]} index={2} onPress={handleServicePress} />
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
  },
  sectionTitle: {
    color: PROF.textPrimary,
    fontSize: TYPOGRAPHY.md ?? 15,
    fontFamily: TYPOGRAPHY.fontSemibold,
  },
  sectionSubtitle: {
    color: PROF.textMuted,
    fontSize: TYPOGRAPHY.xs ?? 11,
    paddingLeft: 4,
    marginTop: -4,
  },
  grid: {
    gap: SPACING.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  gridHalf: {
    flex: 1,
  },
  // ── Botón ──
  btnWrap: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    // Sombra glow turquesa
    shadowColor: '#49C0BC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  btnTouchable: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  btnGradient: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    minHeight: 130,
    justifyContent: 'flex-end',
    gap: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  badgeWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(73,192,188,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(73,192,188,0.5)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#49C0BC',
    fontSize: 9,
    fontFamily: TYPOGRAPHY.fontBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  btnLabel: {
    color: '#fff',
    fontFamily: TYPOGRAPHY.fontBold,
    fontSize: TYPOGRAPHY.sm ?? 13,
  },
  btnSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  ctaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontMedium,
  },
  shimmer: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
