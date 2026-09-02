/**
 * RecommendationsScreen — Recomendaciones de limpieza y mantenimiento del hogar
 * Categorías internas + opción de abrir URLs en WebView nativo.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Modal,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { WebView } from 'react-native-webview';
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

// ─── Datos de categorías ─────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'limpieza',
    icon: 'sparkles-outline',
    color: PROF.accent,
    title: 'Limpieza General',
    tips: [
      'Usa microfibra en seco antes de aplicar líquidos para eliminar el polvo.',
      'El vinagre blanco diluido en agua es ideal para limpiar vidrios y espejos.',
      'Limpia de arriba hacia abajo: empieza por techos y termina en el piso.',
      'Abre ventanas durante la limpieza para favorecer la ventilación.',
    ],
  },
  {
    id: 'desinfeccion',
    icon: 'shield-outline',
    color: '#7ED321',
    title: 'Desinfección',
    tips: [
      'El alcohol al 70% es más efectivo que al 90% para desinfectar superficies.',
      'La dilución de hipoclorito de sodio (1:50) es apta para pisos y baños.',
      'Deja actuar el desinfectante al menos 30 segundos antes de secar.',
      'Prioriza desinfectar zonas de alto contacto: manijas, interruptores y grifos.',
    ],
  },
  {
    id: 'organizacion',
    icon: 'albums-outline',
    color: '#FF8C00',
    title: 'Organización',
    tips: [
      'El método KonMari sugiere guardar solo lo que te genera alegría.',
      'Agrupa objetos por categoría, no por habitación.',
      'Etiqueta cajas y recipientes para facilitar la búsqueda.',
      'Dedica 10 minutos al día para mantener el orden ya logrado.',
    ],
  },
  {
    id: 'bano',
    icon: 'water-outline',
    color: '#00BFFF',
    title: 'Baño y Cocina',
    tips: [
      'El bicarbonato de sodio es excelente para eliminar manchas del inodoro.',
      'Limpia el microondas calentando agua con limón: el vapor afloja los residuos.',
      'Desengrasante + cepillo de dientes viejo = ideal para juntas de azulejos.',
      'Para el óxido en grifos, aplica pasta de bicarbonato y vinagre 10 min.',
    ],
  },
  {
    id: 'textiles',
    icon: 'shirt-outline',
    color: PROF.warning,
    title: 'Textiles y Alfombras',
    tips: [
      'Aspira las alfombras dos veces por semana para reducir ácaros.',
      'Agua fría siempre para manchas frescas de sangre o proteínas.',
      'El agua oxigenada elimina manchas de vino tinto en tela.',
      'Ventila colchones y almohadas al sol al menos una vez al mes.',
    ],
  },
  {
    id: 'mantenimiento',
    icon: 'construct-outline',
    color: '#9B59B6',
    title: 'Mantenimiento Preventivo',
    tips: [
      'Limpia los filtros del aire acondicionado cada 2-3 meses.',
      'Revisa y limpia las canaletas de agua al inicio de cada estación.',
      'Lubrica bisagras de puertas y ventanas con aceite de silicona.',
      'Comprueba las juntas de silicona en baños y cocina cada 6 meses.',
    ],
  },
];

// ─── WebView Modal (componente de nivel superior) ───────────────────────────
function WebViewModal({ visible, url, loading, insets, onClose, webViewRef, onLoadStart, onLoadEnd }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.wvContainer, { paddingTop: insets.top }]}>
        {/* Header WebView */}
        <View style={styles.wvBar}>
          <TouchableOpacity onPress={onClose} style={styles.wvCloseBtn}>
            <Ionicons name="close" size={20} color={PROF.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.wvTitle} numberOfLines={1}>
            {url?.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(url)}
            style={styles.wvOpenBtn}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons name="open-outline" size={18} color={PROF.accent} />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.wvLoading}>
            <ActivityIndicator color={PROF.accent} size="large" />
          </View>
        )}

        {url && (
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            style={{ flex: 1, backgroundColor: PROF.bgDeep }}
            onLoadStart={onLoadStart}
            onLoadEnd={onLoadEnd}
            onError={onLoadEnd}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Componente de categoría expandible ─────────────────────────────────────
function CategoryCard({ category, delay }) {
  const [expanded, setExpanded] = useState(false);
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500).springify()} style={{ marginBottom: SPACING.sm }}>
      <Animated.View style={scaleStyle}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setExpanded(e => !e);
          }}
          onPressIn={() => { scale.value = withSpring(0.98, { damping: 14 }); }}
          onPressOut={() => { scale.value = withSpring(1,    { damping: 14 }); }}
          activeOpacity={1}
        >
          <GlassCard variant="default" style={styles.catCard}>
            {/* Header */}
            <View style={styles.catHeader}>
              <View style={[styles.catIconWrap, { backgroundColor: `${category.color}20` }]}>
                <Ionicons name={category.icon} size={20} color={category.color} />
              </View>
              <Text style={styles.catTitle}>{category.title}</Text>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={PROF.textMuted}
              />
            </View>

            {/* Tips expandidos */}
            {expanded && (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.tipsList}>
                {category.tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <View style={[styles.tipDot, { backgroundColor: category.color }]} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function RecommendationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [webviewUrl, setWebviewUrl]   = useState(null);
  const [webviewLoading, setWvLoading] = useState(false);
  const webViewRef = useRef(null);

  // ── BackHandler: cierra el modal WebView antes de salir de la pantalla ───
  React.useEffect(() => {
    if (!webviewUrl) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeWebView();
      return true; // consumir el evento → no navegar atrás
    });
    return () => sub.remove();
  }, [webviewUrl]);

  const openUrl = (url) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWebviewUrl(url);
    setWvLoading(true);
  };

  const closeWebView = () => {
    setWebviewUrl(null);
    setWvLoading(false);
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
        <Text style={styles.topTitle}>Recomendaciones</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.heroWrap}>
          <LinearGradient colors={PROF.gradAccent} style={styles.heroIcon}>
            <Ionicons name="bulb-outline" size={30} color={PROF.bgDeep} />
          </LinearGradient>
          <Text style={styles.heroTitle}>Consejos para tu hogar</Text>
          <Text style={styles.heroSubtitle}>
            Aprende a mantener tu hogar limpio y ordenado con estos consejos profesionales.
          </Text>
        </Animated.View>

        {/* Categorías */}
        <Text style={styles.sectionLabel}>Categorías</Text>
        {CATEGORIES.map((cat, i) => (
          <CategoryCard key={cat.id} category={cat} delay={i * 70} />
        ))}

        {/* Recursos externos */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <Text style={styles.sectionLabel}>Recursos externos</Text>
          <GlassCard variant="default" style={styles.resourcesCard}>
            {[
              { icon: 'newspaper-outline',    label: 'Guía completa de limpieza',     url: 'https://www.mujeresdeempresa.com/guia-de-limpieza-del-hogar/' },
              { icon: 'videocam-outline',     label: 'Videos tutoriales en YouTube',  url: 'https://www.youtube.com/results?search_query=limpieza+hogar+consejos' },
              { icon: 'earth-outline',        label: 'Desinfectantes recomendados',   url: 'https://ec.gc.ca/scc-ccn/default.asp?lang=Es&n=BD928C4A-1' },
            ].map((res, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.resourceRow, i > 0 && styles.resourceSep]}
                onPress={() => openUrl(res.url)}
              >
                <View style={styles.resourceIcon}>
                  <Ionicons name={res.icon} size={18} color={PROF.accent} />
                </View>
                <Text style={styles.resourceLabel} numberOfLines={1}>{res.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={PROF.textMuted} />
              </TouchableOpacity>
            ))}
          </GlassCard>
        </Animated.View>
      </ScrollView>

      <WebViewModal
        visible={!!webviewUrl}
        url={webviewUrl}
        loading={webviewLoading}
        insets={insets}
        onClose={closeWebView}
        webViewRef={webViewRef}
        onLoadStart={() => setWvLoading(true)}
        onLoadEnd={() => setWvLoading(false)}
      />
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

  sectionLabel: { fontSize: 12, fontWeight: '700', color: PROF.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm },

  // Category card
  catCard: { padding: SPACING.md },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  catIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  catTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: PROF.textPrimary },

  // Tips
  tipsList: { marginTop: SPACING.md, gap: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  tipText: { flex: 1, fontSize: 13, color: PROF.textSecondary, lineHeight: 18 },

  // Resources
  resourcesCard: { marginBottom: SPACING.xl },
  resourceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  resourceSep: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  resourceIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(73,192,188,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  resourceLabel: { flex: 1, fontSize: 14, color: PROF.textSecondary, fontWeight: '500' },

  // WebView modal
  wvContainer: { flex: 1, backgroundColor: PROF.bgDeep },
  wvBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    backgroundColor: PROF.bgElevated,
    borderBottomWidth: 1, borderBottomColor: PROF.border,
    gap: SPACING.sm,
  },
  wvCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  wvTitle: { flex: 1, fontSize: 14, color: PROF.textSecondary, fontWeight: '500' },
  wvOpenBtn: { padding: 4 },
  wvLoading: {
    position: 'absolute', top: 56, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: PROF.bgDeep, zIndex: 10,
  },
});
