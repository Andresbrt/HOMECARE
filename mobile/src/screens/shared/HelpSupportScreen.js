/**
 * HelpSupportScreen — Ayuda y Soporte Homecare 2026
 * FAQ buscable, asistente IA, soporte humano, centro de ayuda
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

const FAQS = [
  { q: '¿Como solicito un servicio de limpieza?',
    a: 'En la pantalla principal presiona uno de los 3 botones de servicio (General, Premium o Por Horas). Completa el formulario y los profesionales disponibles enviaran ofertas.' },
  { q: '¿Como funciona el sistema de pagos?',
    a: 'Utilizamos Mercado Pago para procesar los pagos de forma segura. El cobro se realiza al aceptar la oferta del profesional.' },
  { q: '¿Puedo cancelar un servicio ya solicitado?',
    a: 'Si, puedes cancelar antes de que el profesional llegue. Ve a Historial, selecciona el servicio activo y presiona "Cancelar".' },
  { q: '¿Que pasa si no estoy satisfecho con el servicio?',
    a: 'Califica con 1 estrella y escribe una resena. Nuestro equipo revisara el caso y aplicara la politica de garantia de satisfaccion.' },
  { q: '¿Como contacto al profesional antes de que llegue?',
    a: 'Una vez aceptada la oferta aparecera un chat en tiempo real y un mapa de seguimiento del profesional.' },
  { q: '¿Como me convierto en profesional Homecare?',
    a: 'Registrate con el rol "Profesional", sube tu documentacion y espera la verificacion del equipo (24-48 h).' },
];

function FAQItem({ item, index }) {
  const [open, setOpen] = useState(false);
  const rot = useSharedValue(0);
  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rot.value, [0, 1], [0, 90])}deg` }],
  }));
  const toggle = () => {
    Haptics.selectionAsync();
    rot.value = withSpring(open ? 0 : 1, { damping: 16 });
    setOpen(o => !o);
  };
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(16)}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.85} style={styles.faqRow}>
        <Text style={styles.faqQuestion}>{item.q}</Text>
        <Animated.View style={chevron}>
          <Ionicons name="chevron-forward" size={16} color={PROF.textMuted} />
        </Animated.View>
      </TouchableOpacity>
      {open && (
        <Animated.Text entering={FadeInDown.duration(220)} style={styles.faqAnswer}>
          {item.a}
        </Animated.Text>
      )}
    </Animated.View>
  );
}

function SupportCard({ icon, title, subtitle, gradient, onPress, delay = 0 }) {
  const scale = useSharedValue(1);
  const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)} style={[anim, { flex: 1 }]}>
      <TouchableOpacity
        onPress={() => {
          scale.value = withSpring(0.95, { damping: 16 }, () => { scale.value = withSpring(1); });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress?.();
        }}
        activeOpacity={1}
        style={styles.supportCard}
      >
        <LinearGradient colors={gradient} style={styles.supportGrad}>
          <View style={styles.supportIconWrap}>
            <Ionicons name={icon} size={24} color="#fff" />
          </View>
          <Text style={styles.supportTitle}>{title}</Text>
          <Text style={styles.supportSub}>{subtitle}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function LinkRow({ icon, label, onPress, delay = 0 }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)}>
      <TouchableOpacity style={styles.linkRow} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.linkIcon}>
          <Ionicons name={icon} size={18} color={PROF.accent} />
        </View>
        <Text style={styles.linkLabel}>{label}</Text>
        <Ionicons name="chevron-forward" size={15} color={PROF.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HelpSupportScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() =>
    query.trim().length < 2
      ? FAQS
      : FAQS.filter(f =>
          f.q.toLowerCase().includes(query.toLowerCase()) ||
          f.a.toLowerCase().includes(query.toLowerCase())
        ),
    [query]
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={PROF.bgDeep} />
      <LinearGradient colors={[PROF.bgDeep, PROF.bg, PROF.bg]} style={StyleSheet.absoluteFill} locations={[0, 0.35, 1]} />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={PROF.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Ayuda y Soporte</Text>
        <View style={{ width: 38 }} />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Contacto directo ───────────────────────────── */}
        <Text style={styles.section}>Contacto directo</Text>
        <View style={styles.supportRow}>
          <SupportCard
            icon="sparkles-outline"
            title="Asistente IA"
            subtitle="Respuesta inmediata"
            gradient={['#0E4D68', '#49C0BC']}
            onPress={() => navigation.navigate('SupportBot')}
            delay={40}
          />
          <SupportCard
            icon="chatbubbles-outline"
            title="Soporte humano"
            subtitle="Lun–Vie 8am–6pm"
            gradient={['#1a2f4a', '#0E4D68']}
            onPress={() => Alert.alert('Soporte humano', 'Conectando con un agente...\n\nHorario: Lunes a Viernes 8am – 6pm')}
            delay={100}
          />
        </View>

        {/* ── Centro de ayuda ───────────────────────────── */}
        <Text style={styles.section}>Centro de ayuda</Text>
        <GlassCard variant="default">
          <LinkRow icon="document-text-outline" label="Términos y condiciones" onPress={() => Linking.openURL('https://homecare.app/terminos')} delay={160} />
          <View style={styles.sep} />
          <LinkRow icon="shield-outline" label="Política de privacidad" onPress={() => Linking.openURL('https://homecare.app/privacidad')} delay={200} />
          <View style={styles.sep} />
          <LinkRow icon="play-circle-outline" label="Tutorial de uso" onPress={() => Linking.openURL('https://homecare.app/tutorial')} delay={240} />
          <View style={styles.sep} />
          <LinkRow icon="star-outline" label="Calificar la app" onPress={() => Linking.openURL('https://play.google.com/store')} delay={280} />
        </GlassCard>

        {/* ── FAQ ───────────────────────────────────────── */}
        <Text style={styles.section}>Preguntas frecuentes</Text>

        {/* Buscador */}
        <Animated.View entering={FadeInDown.delay(120).springify().damping(16)} style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={PROF.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar en la ayuda…"
            placeholderTextColor={PROF.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={PROF.textMuted} />
            </TouchableOpacity>
          )}
        </Animated.View>

        <GlassCard variant="default">
          {filtered.length === 0 ? (
            <Text style={styles.noResults}>No se encontraron resultados para "{query}"</Text>
          ) : (
            filtered.map((f, i) => (
              <View key={i}>
                {i > 0 && <View style={styles.sep} />}
                <FAQItem item={f} index={i} />
              </View>
            ))
          )}
        </GlassCard>

        {/* Versión */}
        <Text style={styles.version}>Homecare v1.0.0 — 2026</Text>
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
  section:       { color: PROF.textMuted, fontSize: 11, fontFamily: TYPOGRAPHY.fontBold, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: SPACING.xs },
  sep:           { height: 1, backgroundColor: PROF.border, marginVertical: 2 },

  // Soporte cards
  supportRow:    { flexDirection: 'row', gap: SPACING.sm },
  supportCard:   { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: PROF.border },
  supportGrad:   { padding: SPACING.md, alignItems: 'center', gap: 6, minHeight: 110, justifyContent: 'center' },
  supportIconWrap:{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  supportTitle:  { color: '#fff', fontFamily: TYPOGRAPHY.fontBold, fontSize: 13, textAlign: 'center' },
  supportSub:    { color: 'rgba(255,255,255,0.65)', fontSize: 11, textAlign: 'center' },

  // Links
  linkRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
  linkIcon:  { width: 32, height: 32, borderRadius: 9, backgroundColor: PROF.accentDim, justifyContent: 'center', alignItems: 'center' },
  linkLabel: { flex: 1, color: PROF.textPrimary, fontFamily: TYPOGRAPHY.fontSemibold, fontSize: 14 },

  // FAQ
  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: BORDER_RADIUS.md, paddingHorizontal: 14, borderWidth: 1, borderColor: PROF.border, gap: 8 },
  searchIcon:  { marginRight: 2 },
  searchInput: { flex: 1, color: PROF.textPrimary, fontSize: 14, paddingVertical: 12 },
  faqRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
  faqQuestion: { flex: 1, color: PROF.textPrimary, fontFamily: TYPOGRAPHY.fontSemibold, fontSize: 13 },
  faqAnswer:   { color: PROF.textSecondary, fontSize: 12, lineHeight: 19, paddingBottom: 10, paddingRight: 8 },
  noResults:   { color: PROF.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: SPACING.md },
  version:     { color: PROF.textMuted, fontSize: 10, textAlign: 'center', opacity: 0.5, marginTop: SPACING.sm },
});
