/**
 * DashboardScreen — Centro de Control Profesional Homecare 2026
 * Rediseñado para ser claro, scannable y sin sobrecarga.
 * Un profesional en campo necesita ver TODO en un vistazo rápido.
 */
import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar, RefreshControl, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, interpolate, FadeIn, FadeInDown, FadeOut, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../../components/shared/GlassCard';
import { useAuth } from '../../context/AuthContext';
import useChatStore from '../../store/chatStore';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import ScreenLayout from '../../components/shared/ScreenLayout';
import { computeLevel, getQuarterLabel, MOTIVATIONAL_TEXT } from '../../utils/levelUtils';

// Número de solicitudes pendientes (mock — conectar a backend)
const PENDING_REQUESTS = 3;

// Umbral del nivel Elite (meta trimestral)
const ELITE_THRESHOLD = 26;

// ─── Tooltip helper ───────────────────────────────────────────────────────────
function Tooltip({ text }) {
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={tip.wrap}>
      <Text style={tip.text}>{text}</Text>
    </Animated.View>
  );
}
const tip = StyleSheet.create({
  wrap: { position: 'absolute', bottom: '100%', right: 0, marginBottom: 8, backgroundColor: 'rgba(0,15,34,0.92)', borderWidth: 1, borderColor: PROF.glassBorder, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, maxWidth: 220, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  text: { fontSize: TYPOGRAPHY.xs, color: PROF.textPrimary, fontWeight: TYPOGRAPHY.medium, textAlign: 'right' },
});

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ icon, value, label, color }) {
  return (
    <View style={dp.statPill}>
      <Ionicons name={icon} size={14} color={color || PROF.accent} />
      <Text style={dp.statPillValue}>{value}</Text>
      <Text style={dp.statPillLabel}>{label}</Text>
    </View>
  );
}

// ─── Quick action circular ────────────────────────────────────────────────────
function QuickCircle({ icon, label, colors, onPress }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={() => {
          scale.value = withSpring(0.9, { damping: 12 }, () => { scale.value = withSpring(1); });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.85}
        style={dp.qcWrap}
      >
        <LinearGradient colors={colors} style={dp.qcGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
          <Ionicons name={icon} size={22} color="#fff" />
        </LinearGradient>
        <Text style={dp.qcLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Activity item compacto ───────────────────────────────────────────────────
function ActivityItem({ item, index }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(300)} style={dp.actRow}>
      <View style={dp.actIcon}>
        <Ionicons name="checkmark-circle" size={16} color={PROF.accent} />
      </View>
      <View style={dp.actInfo}>
        <Text style={dp.actType}>{item.type}</Text>
        <Text style={dp.actAddr} numberOfLines={1}>{item.address}</Text>
      </View>
      <Text style={dp.actAmount}>{item.amount}</Text>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function ProfDashboardScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const unreadTotal = useChatStore((s) => s.unreadTotal ?? 0);
  const activeService = useChatStore((s) => s.activeService);
  const [isAvailable, setIsAvailable] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  const weeklyServices = 20;  // demo Pro — en producción: user?.serviciosCompletados ?? 0
  const level = computeLevel(weeklyServices);
  const quarterLabel = getQuarterLabel();
  // Progreso dentro del nivel actual (barra de la tarjeta)
  const progressPct = level.progress;

  // ── Animaciones ──
  const glowAnim = useSharedValue(0.35);
  const toggleScale = useSharedValue(1);
  const progressAnim = useSharedValue(0);
  const fabScale = useSharedValue(0);
  const fabChatScale = useSharedValue(0);

  useEffect(() => {
    progressAnim.value = withTiming(progressPct, { duration: 1200, easing: Easing.out(Easing.cubic) });
    fabScale.value = withSpring(1, { damping: 14, stiffness: 160, mass: 0.8 });
  }, []);

  useEffect(() => {
    if (isAvailable) {
      glowAnim.value = withRepeat(withSequence(withTiming(0.8, { duration: 1200 }), withTiming(0.35, { duration: 1200 })), -1, true);
    } else {
      glowAnim.value = withTiming(0.2, { duration: 400 });
    }
  }, [isAvailable]);

  useEffect(() => {
    fabChatScale.value = withSpring(activeService ? 1 : 0, { damping: 14, stiffness: 200, mass: 0.7 });
  }, [activeService]);

  const glowStyle = useAnimatedStyle(() => ({ shadowOpacity: glowAnim.value }));
  const progressStyle = useAnimatedStyle(() => ({ width: `${interpolate(progressAnim.value, [0, 1], [0, 100])}%` }));
  const toggleStyle = useAnimatedStyle(() => ({ transform: [{ scale: toggleScale.value }] }));
  const fabAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }], opacity: fabScale.value }));
  const fabChatAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabChatScale.value }], opacity: fabChatScale.value }));

  // ── Handlers ──
  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    toggleScale.value = withSpring(0.92, { damping: 10 }, () => { toggleScale.value = withSpring(1); });
    setIsAvailable(p => !p);
  }, []);

  const handleOpenChats = useCallback(() => {
    setTooltip(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeService) {
      navigation.navigate('Chat', { solicitudId: activeService.solicitudId, destinatarioId: activeService.destinatarioId, titulo: activeService.titulo ?? 'Chat' });
    } else {
      navigation.navigate('ChatList');
    }
  }, [activeService, navigation]);

  const handleOpenActiveChat = useCallback(() => {
    if (!activeService) return;
    setTooltip(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('Chat', { solicitudId: activeService.solicitudId, destinatarioId: activeService.destinatarioId, titulo: activeService.titulo ?? 'Servicio activo' });
  }, [activeService, navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

  const mockActivity = [
    { type: 'Limpieza Básica', address: 'Cra 15 #82-45, Bogotá', amount: 'COL$ 45.000' },
    { type: 'Limpieza Profunda', address: 'Cll 100 #19-25, Bogotá', amount: 'COL$ 85.000' },
    { type: 'Limpieza Oficina', address: 'Av El Dorado #90-35', amount: 'COL$ 120.000' },
  ];

  return (
    <ScreenLayout backgroundColor={PROF.background} top={true}>
      <LinearGradient colors={PROF.gradMain} style={dp.screen}>
        <StatusBar barStyle="light-content" backgroundColor="#000F22" />

        {/* ═══ HEADER ═══ */}
        <View style={dp.header}>
          <TouchableOpacity onPress={() => navigation.getParent()?.openDrawer?.()} style={dp.menuBtn}>
            <Ionicons name="menu" size={28} color={PROF.textPrimary} />
          </TouchableOpacity>
          <Text style={dp.brandTitle}>HOMECARE</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={dp.bellBtn}>
            <Ionicons name="notifications-outline" size={24} color={PROF.textPrimary} />
            <View style={dp.notifBadge}><Text style={dp.notifBadgeText}>3</Text></View>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={dp.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PROF.accent} />}
        >
          {/* ═══ SALUDO COMPACTO ═══ */}
          <View style={dp.greeting}>
            <Text style={dp.greetingHola}>Hola, {user?.nombre || 'Profesional'} 👋</Text>
            <Text style={dp.greetingDate}>{today}</Text>
          </View>
          <Animated.View style={[dp.toggleWrap, glowStyle]}>
            <Animated.View style={[toggleStyle, { borderRadius: BORDER_RADIUS.lg }]}>
              <TouchableOpacity onPress={handleToggle} activeOpacity={0.9}>
                <LinearGradient
                  colors={isAvailable ? PROF.gradAccent : ['rgba(14,77,104,0.4)', 'rgba(0,27,56,0.9)']}
                  style={dp.toggleInner}
                >
                  <View style={[dp.toggleDot, isAvailable && dp.toggleDotActive]}>
                    <Ionicons name={isAvailable ? 'radio-button-on' : 'radio-button-off'} size={20} color="#fff" />
                  </View>
                  <View style={dp.toggleText}>
                    <Text style={dp.toggleTitle}>{isAvailable ? 'Disponible' : 'Desconectado'}</Text>
                    <Text style={dp.toggleSub}>{isAvailable ? 'Recibirás solicitudes cercanas' : 'Toca para activarte'}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* ═══ SOLICITUDES PENDIENTES (si hay) ═══ */}
          {PENDING_REQUESTS > 0 && isAvailable && (
            <Animated.View entering={FadeIn.delay(150).duration(350)}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ProfRequests')}
                activeOpacity={0.85}
              >
                <GlassCard variant="accent" style={dp.pendingCard}>
                  <View style={dp.pendingRow}>
                    <View style={dp.pendingIcon}>
                      <Ionicons name="notifications" size={18} color="#fff" />
                    </View>
                    <View style={dp.pendingInfo}>
                      <Text style={dp.pendingTitle}>{PENDING_REQUESTS} solicitudes nuevas</Text>
                      <Text style={dp.pendingSub}>Toca para ver y aceptar</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#fff" />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ═══ TARJETA PRINCIPAL: Ingresos + Stats en uno ═══ */}
          <GlassCard variant="elevated" glow style={dp.mainCard}>
            <View style={dp.mainTop}>
              <View style={dp.mainInfo}>
                <Text style={dp.mainLabel}>Ingresos de hoy</Text>
                <Text style={[dp.mainAmount, { fontSize: Math.min(38, width * 0.09) }]}>COL$ 185.000</Text>
                <View style={dp.mainDelta}>
                  <Ionicons name="trending-up" size={13} color={PROF.success} />
                  <Text style={dp.mainDeltaText}>+12% vs ayer · 4 servicios</Text>
                </View>
              </View>
              <View style={dp.mainStats}>
                <StatPill icon="star" value="4.9" label="Rating" />
                <StatPill icon="checkmark-circle" value="127" label="Total" />
                <StatPill icon="trending-up" value="98%" label="Éxito" />
              </View>
            </View>
          </GlassCard>

          {/* ═══ PROGRESO TRIMESTRAL ═══ */}
          <GlassCard variant="elevated" style={dp.progressCard}>
            <View style={dp.progressRow}>
              <View style={dp.progressBadge}>
                <Ionicons name={level.icon} size={13} color={level.color} />
                <Text style={[dp.progressBadgeText, { color: level.color }]}>Nivel {level.label}</Text>
              </View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                {level.visibilityBonus > 0 && (
                  <Text style={{ fontSize:10, color: level.color, fontWeight:'700' }}>+{level.visibilityBonus}% visibilidad</Text>
                )}
                <Text style={dp.progressPct}>{Math.round(level.progress * 100)}%</Text>
              </View>
            </View>
            <View style={dp.progressTrack}>
              <Animated.View style={[dp.progressFill, progressStyle, { backgroundColor: level.color }]} />
            </View>
            <Text style={dp.progressHint}>
              {level.remaining > 0
                ? `${weeklyServices} servicios este trimestre · ${level.motivo}`
                : level.motivo}
            </Text>
            <Text style={dp.progressQuarter}>Trimestre actual: {quarterLabel}</Text>
            {/* Texto motivacional */}
            <View style={dp.motivoRow}>
              <Ionicons name="flash" size={13} color="#FFD700" />
              <Text style={dp.motivoText} numberOfLines={2}>{MOTIVATIONAL_TEXT}</Text>
            </View>
          </GlassCard>

          {/* ═══ ACCIONES RÁPIDAS (3 circulares, no duplican tabs) ═══ */}
          <Animated.View entering={FadeIn.delay(200).duration(400)}>
            <Text style={dp.sectionLabel}>Acciones rápidas</Text>
            <View style={dp.qcRow}>
              <QuickCircle icon="map-outline" label="Mapa" colors={[PROF.accent, '#0a6b6b']} onPress={() => navigation.navigate('ProfMap')} />
              <QuickCircle icon="list-outline" label="Solicitudes" colors={['#0E4D68', '#1a3d5c']} onPress={() => navigation.navigate('ProfRequests')} />
              <QuickCircle icon="chatbubbles" label="Chat" colors={['#1a5276', '#2980b9']} onPress={handleOpenChats} />
            </View>
          </Animated.View>

          {/* ═══ ACTIVIDAD RECIENTE (solo 3, compacta) ═══ */}
          <Animated.View entering={FadeIn.delay(300).duration(400)}>
            <View style={dp.actHead}>
              <Text style={dp.actTitle}>Actividad reciente</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProfFinancePerformance')} activeOpacity={0.75}>
                <Text style={dp.actLink}>Ver más</Text>
              </TouchableOpacity>
            </View>
            <GlassCard variant="elevated" style={dp.actCard}>
              {mockActivity.map((item, i) => (
                <View key={i}>
                  <ActivityItem item={item} index={i} />
                  {i < mockActivity.length - 1 && <View style={dp.actSep} />}
                </View>
              ))}
            </GlassCard>
          </Animated.View>

          {/* ═══ CONSEJO DEL DÍA (tooltip amigable) ═══ */}
          <Animated.View entering={FadeIn.delay(400).duration(400)}>
            <GlassCard variant="default" style={dp.tipCard}>
              <View style={dp.tipRow}>
                <View style={dp.tipIcon}>
                  <Ionicons name="bulb-outline" size={16} color="#FFD700" />
                </View>
                <View style={dp.tipInfo}>
                  <Text style={dp.tipTitle}>Consejo</Text>
                  <Text style={dp.tipText}>Mantén tu perfil actualizado para recibir más solicitudes. Los clientes confían en profesionales con fotos y descripción completa.</Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* ═══ FAB — Chat activo (verde) ═══ */}
        <Animated.View style={[dp.fabChat, fabChatAnimStyle]} pointerEvents={activeService ? 'auto' : 'none'}>
          {tooltip === 'chatear' && <Tooltip text={activeService?.titulo ? `Chatear con ${activeService.titulo}` : 'Chat activo'} />}
          <TouchableOpacity onPress={handleOpenActiveChat} onLongPress={() => setTooltip('chatear')} onPressOut={() => setTooltip(null)} activeOpacity={0.82}>
            <LinearGradient colors={['#1A7741', '#27AE60']} style={dp.fabGrad}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
              <Text style={dp.fabLabel}>Chatear</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ═══ FAB — Mis Chats ═══ */}
        <Animated.View style={[dp.fab, fabAnimStyle]}>
          {tooltip === 'chats' && <Tooltip text={activeService ? 'Tienes un chat activo' : 'Ver conversaciones'} />}
          <TouchableOpacity onPress={handleOpenChats} onLongPress={() => setTooltip('chats')} onPressOut={() => setTooltip(null)} activeOpacity={0.82}>
            <LinearGradient colors={PROF.gradAccent} style={dp.fabGrad}>
              <Ionicons name="chatbubbles" size={22} color="#fff" />
              <Text style={dp.fabLabel}>{activeService ? 'Chat activo' : 'Mis chats'}</Text>
            </LinearGradient>
            {unreadTotal > 0 && <View style={dp.fabBadge}><Text style={dp.fabBadgeText}>{unreadTotal > 99 ? '99+' : unreadTotal}</Text></View>}
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </ScreenLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const dp = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1, borderBottomColor: PROF.border,
  },
  brandTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary, letterSpacing: 4 },
  menuBtn: { padding: SPACING.sm },
  bellBtn: { position: 'relative', padding: SPACING.sm },
  notifBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: PROF.accent, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  scroll: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },

  // Greeting
  greeting: { marginBottom: SPACING.md },
  greetingHola: { fontSize: TYPOGRAPHY.xxl, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary },
  greetingDate: { fontSize: TYPOGRAPHY.sm, color: PROF.textSecondary, textTransform: 'capitalize' },

  // Toggle
  toggleWrap: { ...SHADOWS.glowStrong, marginBottom: SPACING.md, borderRadius: BORDER_RADIUS.lg, shadowColor: PROF.accent },
  toggleInner: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg },
  toggleDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  toggleDotActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  toggleText: { flex: 1 },
  toggleTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold, color: '#fff' },
  toggleSub: { fontSize: TYPOGRAPHY.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Pending requests
  pendingCard: { marginBottom: SPACING.md },
  pendingRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  pendingIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  pendingInfo: { flex: 1 },
  pendingTitle: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.bold, color: '#fff' },
  pendingSub: { fontSize: TYPOGRAPHY.xs, color: 'rgba(255,255,255,0.8)', marginTop: 1 },

  // Main card (earnings + stats)
  mainCard: { marginBottom: SPACING.md },
  mainTop: { padding: SPACING.lg, gap: SPACING.md },
  mainInfo: {},
  mainLabel: { fontSize: TYPOGRAPHY.sm, color: PROF.textSecondary, marginBottom: 4 },
  mainAmount: { fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary, letterSpacing: -1 },
  mainDelta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  mainDeltaText: { fontSize: TYPOGRAPHY.xs, color: PROF.success },
  mainStats: { flexDirection: 'row', gap: SPACING.sm },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: PROF.border },
  statPillValue: { fontSize: 14, fontWeight: TYPOGRAPHY.bold, color: PROF.textPrimary },
  statPillLabel: { fontSize: 10, color: PROF.textMuted },

  // Progress
  progressCard: { marginBottom: SPACING.md },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  progressBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: PROF.accentDim, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BORDER_RADIUS.full },
  progressBadgeText: { marginLeft: 6, color: PROF.accent, fontWeight: TYPOGRAPHY.semibold, fontSize: TYPOGRAPHY.xs },
  progressPct: { fontSize: TYPOGRAPHY.lg, color: PROF.accent, fontWeight: TYPOGRAPHY.bold },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, marginHorizontal: SPACING.md, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  progressHint: { fontSize: TYPOGRAPHY.xs, color: PROF.textSecondary, marginHorizontal: SPACING.md, marginTop: SPACING.sm, fontWeight: TYPOGRAPHY.medium },
  progressQuarter: { fontSize: 10, color: PROF.textMuted, marginHorizontal: SPACING.md, marginTop: 4, marginBottom: SPACING.xs, fontStyle: 'italic' },
  motivoRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: SPACING.md, marginTop: 6, marginBottom: SPACING.md, backgroundColor: 'rgba(255,215,0,0.07)', borderRadius: 8, padding: 8 },
  motivoText:   { flex: 1, fontSize: 10, color: PROF.textSecondary, lineHeight: 14 },

  // Quick circles
  sectionLabel: { fontSize: 10, fontWeight: '700', color: PROF.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: SPACING.sm, marginTop: 4 },
  qcRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.md },
  qcWrap: { alignItems: 'center', gap: 8 },
  qcGrad: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', ...SHADOWS.glow, shadowColor: PROF.accent },
  qcLabel: { fontSize: 11, fontWeight: '600', color: PROF.textSecondary },

  // Activity
  actHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  actTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.semibold, color: PROF.textPrimary },
  actLink: { fontSize: 12, color: PROF.accent, fontWeight: '600' },
  actCard: { marginBottom: SPACING.md },
  actRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm + 2, gap: 10 },
  actIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: `${PROF.accent}18`, justifyContent: 'center', alignItems: 'center' },
  actInfo: { flex: 1 },
  actType: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold, color: PROF.textPrimary },
  actAddr: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, marginTop: 1 },
  actAmount: { fontSize: TYPOGRAPHY.sm, color: PROF.accent, fontWeight: TYPOGRAPHY.bold },
  actSep: { height: 1, backgroundColor: PROF.border, marginLeft: 40 },

  // Tip card
  tipCard: { marginBottom: SPACING.md },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.md, gap: SPACING.md },
  tipIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,215,0,0.15)', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  tipInfo: { flex: 1 },
  tipTitle: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.bold, color: '#FFD700', marginBottom: 4 },
  tipText: { fontSize: TYPOGRAPHY.xs, color: PROF.textSecondary, lineHeight: 18 },

  // FABs
  fab: { position: 'absolute', bottom: SPACING.xl, right: SPACING.lg, zIndex: 99, ...SHADOWS.glowStrong, shadowColor: PROF.accent, shadowOpacity: 0.7, shadowRadius: 18, elevation: 14 },
  fabChat: { position: 'absolute', bottom: SPACING.xl + 64, right: SPACING.lg, zIndex: 99, ...SHADOWS.glowStrong, shadowColor: '#27AE60', shadowOpacity: 0.65, shadowRadius: 16, elevation: 12 },
  fabGrad: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.full, gap: SPACING.sm },
  fabLabel: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.bold, color: '#fff', letterSpacing: 0.5 },
  fabBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FF3B5C', minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: PROF.background },
  fabBadgeText: { fontSize: 10, color: '#fff', fontWeight: '800' },
});
