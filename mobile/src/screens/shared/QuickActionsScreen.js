/**
 * QuickActionsScreen — Acciones Rápidas de Limpieza Homecare 2026
 * 3 servicios pre-configurados que abren CreateRequestScreen
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

const SERVICIOS = [
  {
    id: 'general',
    label: 'Limpieza General',
    desc: 'Limpieza completa de tu hogar. Ideal para mantenimiento semanal o mensual.',
    icon: 'sparkles-outline',
    badge: 'Más popular',
    gradient: ['#0E4D68', '#49C0BC'],
    tipoLimpieza: 'BASICA',
    titulo: 'Limpieza General del Hogar',
  },
  {
    id: 'premium',
    label: 'Limpieza Premium',
    desc: 'Limpieza profunda con desinfección y tratamiento de superficies difíciles.',
    icon: 'diamond-outline',
    badge: 'Recomendado',
    gradient: ['#1a2f4a', '#0E4D68'],
    tipoLimpieza: 'PROFUNDA',
    titulo: 'Limpieza Premium Profunda',
  },
  {
    id: 'horas',
    label: 'Limpieza por Horas',
    desc: 'Paga exactamente las horas que necesitas. Tú defines el valor por hora.',
    icon: 'time-outline',
    badge: 'Flexible',
    gradient: ['#001B38', '#0E4D68'],
    tipoLimpieza: 'BASICA',
    titulo: 'Servicio de Limpieza por Horas',
    esPorHoras: true,
  },
];

function ServiceCard({ s, onPress, delay }) {
  const scale = useSharedValue(1);
  const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(15)} style={anim}>
      <TouchableOpacity
        onPress={() => {
          scale.value = withSpring(0.97, { damping: 16 }, () => { scale.value = withSpring(1); });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress(s);
        }}
        activeOpacity={1}
      >
        <LinearGradient colors={s.gradient} style={styles.card}>
          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{s.badge}</Text>
          </View>

          {/* Icon + Title */}
          <View style={styles.cardTop}>
            <View style={styles.iconCircle}>
              <Ionicons name={s.icon} size={28} color="#fff" />
            </View>
            <View style={styles.cardTitles}>
              <Text style={styles.cardLabel}>{s.label}</Text>
              <Text style={styles.cardDesc}>{s.desc}</Text>
            </View>
          </View>

          {/* CTA */}
          <View style={styles.cardBottom}>
            <Text style={styles.ctaText}>Solicitar ahora</Text>
            <Ionicons name="arrow-forward-circle" size={22} color="rgba(255,255,255,0.85)" />
          </View>

          {/* Decoración */}
          <View style={styles.deco1} />
          <View style={styles.deco2} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function QuickActionsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const handlePress = (s) => {
    navigation.navigate('ServiceRequest', {
      service: {
        title:        s.titulo,
        titulo:       s.titulo,
        tipoLimpieza: s.tipoLimpieza,
        esPorHoras:   s.esPorHoras ?? false,
      },
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={PROF.bgDeep} />
      <LinearGradient colors={[PROF.bgDeep, PROF.bg, PROF.bg]} style={StyleSheet.absoluteFill} locations={[0, 0.35, 1]} />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={PROF.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Solicitar servicio</Text>
        <View style={{ width: 38 }} />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text entering={FadeInDown.delay(80).springify()} style={styles.subtitle}>
          Selecciona el tipo de limpieza que necesitas
        </Animated.Text>

        {SERVICIOS.map((s, i) => (
          <ServiceCard key={s.id} s={s} onPress={handlePress} delay={80 + i * 80} />
        ))}

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={PROF.accent} />
          <Text style={styles.infoText}>
            Profesionales verificados responderán con ofertas en minutos.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: PROF.bgDeep },
  topBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, zIndex: 10 },
  backBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center' },
  topBarTitle:   { flex: 1, color: PROF.textPrimary, fontFamily: TYPOGRAPHY.fontBold, fontSize: 17, textAlign: 'center', marginLeft: -38 },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, gap: SPACING.md },
  subtitle:      { color: PROF.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: SPACING.xs },

  // Card
  card:       { borderRadius: BORDER_RADIUS.xl ?? 20, padding: SPACING.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(73,192,188,0.18)' },
  badge:      { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 10, paddingVertical: 3, marginBottom: SPACING.sm },
  badgeText:  { color: '#fff', fontSize: 11, fontFamily: TYPOGRAPHY.fontSemibold },
  cardTop:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  cardTitles: { flex: 1 },
  cardLabel:  { color: '#fff', fontFamily: TYPOGRAPHY.fontBold, fontSize: 18, marginBottom: 4 },
  cardDesc:   { color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 17 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', paddingTop: SPACING.sm },
  ctaText:    { color: '#fff', fontFamily: TYPOGRAPHY.fontSemibold, fontSize: 14 },

  // Decoración de fondo
  deco1: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.04)', right: -30, top: -30 },
  deco2: { position: 'absolute', width: 80,  height: 80,  borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.04)', right: 20, bottom: -20 },

  // Info
  infoBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: PROF.accentDim, borderRadius: BORDER_RADIUS.md, padding: SPACING.md },
  infoText: { flex: 1, color: PROF.textSecondary, fontSize: 12, lineHeight: 17 },
});
