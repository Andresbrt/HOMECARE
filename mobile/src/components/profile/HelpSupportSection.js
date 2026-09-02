/**
 * HelpSupportSection — Ayuda y Soporte Premium Homecare 2026
 * FAQ con busqueda, asistente IA, contacto humano y centro de ayuda
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: '¿Como solicito un servicio de limpieza?',
    a: 'En la pantalla principal (mapa), selecciona "Limpieza" y elige el tipo de servicio. Completa el formulario y los profesionales disponibles enviaran ofertas.',
  },
  {
    q: '¿Como funciona el sistema de pagos?',
    a: 'Utilizamos Mercado Pago para procesar los pagos de forma segura. El cobro se realiza al aceptar una oferta del profesional.',
  },
  {
    q: '¿Puedo cancelar un servicio ya solicitado?',
    a: 'Si, puedes cancelar antes de que el profesional llegue. Ve a Historial, selecciona el servicio activo y presiona "Cancelar".',
  },
  {
    q: '¿Que pasa si no estoy satisfecho con el servicio?',
    a: 'Puedes calificar el servicio con 1 estrella y escribir una resena. Nuestro equipo revisara el caso y aplicara la politica de garantia de satisfaccion.',
  },
  {
    q: '¿Como contacto al profesional antes de que llegue?',
    a: 'Una vez aceptada la oferta apareceran un chat en tiempo real y un mapa de seguimiento del profesional.',
  },
  {
    q: '¿Como me convierto en profesional Homecare?',
    a: 'Registrate con el rol "Profesional", sube tu documentacion y espera la verificacion del equipo (24-48 h).',
  },
];

// ─── Item FAQ colapsable ──────────────────────────────────────────────────────
function FAQItem({ item, index }) {
  const [open, setOpen] = useState(false);
  const rotation = useSharedValue(0);
  const height   = useSharedValue(0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 90])}deg` }],
  }));

  const toggle = () => {
    Haptics.selectionAsync();
    const next = !open;
    rotation.value = withSpring(next ? 1 : 0, { damping: 16 });
    setOpen(next);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(16)}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.85} style={styles.faqRow}>
        <Text style={styles.faqQuestion} numberOfLines={open ? undefined : 2}>{item.q}</Text>
        <Animated.View style={chevronStyle}>
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

// ─── Botón de acción de soporte ───────────────────────────────────────────────
function SupportButton({ icon, title, subtitle, onPress, gradient, delay = 0 }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)} style={[animStyle, styles.supportBtnWrap]}>
      <TouchableOpacity
        onPress={() => {
          scale.value = withSpring(0.95, { damping: 16 }, () => { scale.value = withSpring(1); });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        activeOpacity={1}
      >
        <LinearGradient colors={gradient} style={styles.supportBtnGradient}>
          <Ionicons name={icon} size={22} color="#fff" />
          <View style={styles.supportBtnTexts}>
            <Text style={styles.supportBtnTitle}>{title}</Text>
            {subtitle ? <Text style={styles.supportBtnSub}>{subtitle}</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Enlace de centro de ayuda ────────────────────────────────────────────────
function HelpLink({ icon, label, url }) {
  return (
    <TouchableOpacity
      style={styles.helpLink}
      onPress={() => {
        Haptics.selectionAsync();
        Linking.openURL(url).catch(() =>
          Alert.alert('Error', 'No se pudo abrir el enlace.'),
        );
      }}
      activeOpacity={0.75}
    >
      <Ionicons name={icon} size={16} color={PROF.accent} />
      <Text style={styles.helpLinkText}>{label}</Text>
      <Ionicons name="open-outline" size={13} color={PROF.textMuted} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function HelpSupportSection({ navigation }) {
  const [search, setSearch] = useState('');

  const filteredFAQs = useMemo(() => {
    if (!search.trim()) return FAQS;
    const q = search.toLowerCase();
    return FAQS.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [search]);

  const handleSupportBot = () => {
    // Navegar al asistente IA si la ruta existe, sino mostrar alerta
    try {
      navigation?.navigate('SupportBot');
    } catch {
      Alert.alert('Asistente IA', 'Estamos cargando tu asistente de soporte. Un momento...');
    }
  };

  const handleHumanChat = () => {
    Alert.alert(
      'Soporte Humano',
      'Un agente de soporte se unira al chat en los proximos minutos.',
      [{ text: 'Entendido' }],
    );
  };

  return (
    <View style={styles.container}>
      <Animated.Text entering={FadeInDown.delay(50).springify()} style={styles.sectionTitle}>
        <Ionicons name="help-circle" size={15} color={PROF.accent} /> Ayuda y Soporte
      </Animated.Text>

      {/* ── Botones de accion rapida ── */}
      <SupportButton
        icon="sparkles-outline"
        title="Asistente IA de Soporte"
        subtitle="Respuestas instantaneas 24/7"
        gradient={['#0E4D68', '#49C0BC']}
        delay={80}
        onPress={handleSupportBot}
      />
      <SupportButton
        icon="chatbubble-ellipses-outline"
        title="Chat con un agente"
        subtitle="Tiempo de respuesta: ~5 min"
        gradient={['#1a5276', '#2980b9']}
        delay={140}
        onPress={handleHumanChat}
      />

      {/* ── FAQ ── */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.faqBlock}>
        <GlassCard variant="elevated" animated={false} padding={16}>
          <Text style={styles.faqTitle}>Preguntas frecuentes</Text>

          {/* Buscador */}
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={16} color={PROF.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar en FAQ..."
              placeholderTextColor={PROF.textMuted}
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={PROF.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {filteredFAQs.length === 0 ? (
            <Text style={styles.emptyFAQ}>No se encontraron resultados.</Text>
          ) : (
            filteredFAQs.map((item, i) => (
              <React.Fragment key={i}>
                <FAQItem item={item} index={i} />
                {i < filteredFAQs.length - 1 && <View style={styles.faqDivider} />}
              </React.Fragment>
            ))
          )}
        </GlassCard>
      </Animated.View>

      {/* ── Centro de ayuda ── */}
      <Animated.View entering={FadeInDown.delay(260).springify()}>
        <GlassCard variant="elevated" animated={false} padding={16}>
          <Text style={styles.faqTitle}>Centro de ayuda</Text>
          <HelpLink icon="document-text-outline"  label="Terminos y condiciones"   url="https://homecare.works/terminos" />
          <View style={styles.faqDivider} />
          <HelpLink icon="shield-outline"         label="Politica de privacidad"   url="https://homecare.works/privacidad" />
          <View style={styles.faqDivider} />
          <HelpLink icon="play-circle-outline"    label="Tutorial: primeros pasos" url="https://homecare.works/tutorial" />
          <View style={styles.faqDivider} />
          <HelpLink icon="star-outline"           label="Calificanos en la tienda"  url="https://play.google.com/store" />
        </GlassCard>
      </Animated.View>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  sectionTitle: {
    color: PROF.textPrimary,
    fontSize: TYPOGRAPHY.md ?? 15,
    fontFamily: TYPOGRAPHY.fontSemibold,
    paddingLeft: 4,
  },
  // ── Support buttons ──
  supportBtnWrap: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  supportBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  supportBtnTexts: {
    flex: 1,
  },
  supportBtnTitle: {
    color: '#fff',
    fontFamily: TYPOGRAPHY.fontSemibold,
    fontSize: TYPOGRAPHY.sm ?? 13,
  },
  supportBtnSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    marginTop: 2,
  },
  // ── FAQ ──
  faqBlock: {
    gap: SPACING.sm,
  },
  faqTitle: {
    color: PROF.textPrimary,
    fontFamily: TYPOGRAPHY.fontSemibold,
    fontSize: TYPOGRAPHY.sm ?? 13,
    marginBottom: SPACING.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    color: PROF.textPrimary,
    fontSize: TYPOGRAPHY.sm ?? 13,
    paddingVertical: 10,
  },
  emptyFAQ: {
    color: PROF.textMuted,
    fontSize: TYPOGRAPHY.sm ?? 13,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: 10,
  },
  faqQuestion: {
    flex: 1,
    color: PROF.textSecondary,
    fontSize: TYPOGRAPHY.sm ?? 13,
    fontFamily: TYPOGRAPHY.fontMedium,
  },
  faqAnswer: {
    color: PROF.textMuted,
    fontSize: TYPOGRAPHY.xs ?? 11,
    lineHeight: 18,
    paddingBottom: 10,
    paddingLeft: 4,
  },
  faqDivider: {
    height: 1,
    backgroundColor: PROF.border,
  },
  // ── Help links ──
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 12,
  },
  helpLinkText: {
    flex: 1,
    color: PROF.textSecondary,
    fontSize: TYPOGRAPHY.sm ?? 13,
  },
});
