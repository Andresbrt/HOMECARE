/**
 * DashboardScreen — Centro de Control Profesional Homecare 2026
 * Rediseñado para ser claro, scannable y sin sobrecarga.
 * Un profesional en campo necesita ver TODO en un vistazo rápido.
 */
import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar, RefreshControl, useWindowDimensions, Alert, Linking,
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
import { useLocation } from '../../context/LocationContext';
import { useFocusEffect } from '@react-navigation/native';
import useActiveServiceStore from '../../store/activeServiceStore';
import useChatStore from '../../store/chatStore';
import { listarSolicitudesAbiertas } from '../../services/solicitudesService';
import { apiFetch } from '../../config/api';
import apiClient from '../../services/apiClient';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import ScreenLayout from '../../components/shared/ScreenLayout';
import { computeLevel, getQuarterLabel, MOTIVATIONAL_TEXT } from '../../utils/levelUtils';

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
  const { location } = useLocation();
  const { activeService: liveService, fetchActiveService } = useActiveServiceStore();
  const chatActiveService = useChatStore((s) => s.activeService);
  const activeService = liveService || chatActiveService;
  const unreadTotal = useChatStore((s) => s.unreadTotal ?? 0);
  const [isAvailable, setIsAvailable] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Para cuentas demo o nuevas, mostrar métricas estimadas si aún no hay historial en BD
  const weeklyServices = user?.serviciosCompletados ?? (user?.email?.includes('demo') || user?.email === 'profesional@test.com' ? 24 : 0);
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

  const fetchPendingCount = useCallback(async () => {
    try {
      const lat = location?.coords?.latitude ?? location?.latitude ?? 6.2442;
      const lng = location?.coords?.longitude ?? location?.longitude ?? -75.5812;
      const res = await apiFetch(`/solicitudes/cercanas?latitud=${lat}&longitud=${lng}&radioKm=25`);
      if (res && res.ok) {
        const list = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
        setPendingCount(list.length);
      }
    } catch (_) {
      // No bloquear la UI si falla la carga de solicitudes
    }
  }, [location]);

  const fetchRecentActivity = useCallback(async () => {
    try {
      const res = await apiFetch('/payments/me');
      let list = [];
      if (res && res.ok) {
        list = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
      }
      if (list.length === 0) {
        // Datos de respaldo para enriquecer la experiencia en demos
        list = [
          { concepto: 'Colorimetría y Balayage Premium', direccion: 'Calle 93 #14-20, Chicó', monto: 180000 },
          { concepto: 'Limpieza Profunda y Desinfección', direccion: 'Cra 11 #82-45, El Retiro', monto: 120000 },
          { concepto: 'Estilismo e Hidratación Capilar', direccion: 'Calle 109 #18-12, Sta Bárbara', monto: 95000 },
        ];
      }
      const mapped = list.slice(0, 3).map((p) => ({
        type: p.concepto ?? p.descripcion ?? 'Servicio',
        address: p.direccion ?? p.zona ?? '',
        amount: `COL$ ${Number(p.monto ?? p.amount ?? 0).toLocaleString('es-CO')}`,
      }));
      setRecentActivity(mapped);
    } catch (_) {
      // No bloquear la UI si falla
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/notificaciones');
      const list = Array.isArray(data) ? data : (data?.content ?? []);
      setUnreadNotifCount(list.filter((n) => !n.leida && !n.read).length);
    } catch (_) {
      // No bloquear la UI
    }
  }, []);

  useEffect(() => {
    progressAnim.value = withTiming(progressPct, { duration: 1200, easing: Easing.out(Easing.cubic) });
    fabScale.value = withSpring(1, { damping: 14, stiffness: 160, mass: 0.8 });
    fetchPendingCount();
    fetchRecentActivity();
    fetchUnreadCount();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

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

  useFocusEffect(
    useCallback(() => {
      fetchActiveService();
      fetchPendingCount();
      fetchUnreadCount();
    }, [fetchActiveService, fetchPendingCount, fetchUnreadCount])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchActiveService(), fetchPendingCount(), fetchRecentActivity(), fetchUnreadCount()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchActiveService, fetchPendingCount, fetchRecentActivity, fetchUnreadCount]);

  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

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
            {unreadNotifCount > 0 && (
              <View style={dp.notifBadge}>
                <Text style={dp.notifBadgeText}>{unreadNotifCount > 9 ? '9+' : unreadNotifCount}</Text>
              </View>
            )}
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
          <View style={dp.toggleWrap}>
            <Animated.View style={[toggleStyle, { borderRadius: BORDER_RADIUS.lg }]}>
              <TouchableOpacity onPress={handleToggle} activeOpacity={0.9}>
                <LinearGradient
                  colors={isAvailable ? ['#0E4D68', '#002B49'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                  style={dp.toggleInner}
                >
                  <View style={[dp.toggleDot, isAvailable ? dp.toggleDotActive : dp.toggleDotInactive]}>
                    <Ionicons name={isAvailable ? 'radio-button-on' : 'radio-button-off'} size={18} color="#fff" />
                  </View>
                  <View style={dp.toggleText}>
                    <Text style={dp.toggleTitle}>{isAvailable ? 'Disponible para servicios' : 'Modo desconectado'}</Text>
                    <Text style={dp.toggleSub}>{isAvailable ? 'Recibiendo solicitudes en Medellín' : 'Toca para activarte y recibir ofertas'}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* ═══ SERVICIO ACTIVO EN CURSO (PERSISTENTE) ═══ */}
          {activeService && (
            <Animated.View entering={FadeInDown.duration(350)} style={{ marginBottom: SPACING.md }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ActiveServiceTracking', { service: activeService })}
                activeOpacity={0.88}
              >
                <GlassCard variant="elevated" style={dp.activeServiceCard}>
                  <View style={dp.activeServiceHeader}>
                    <View style={dp.activeBadgeRow}>
                      <View style={dp.activePulsingDot} />
                      <Text style={dp.activeBadgeText}>
                        {activeService.estado === 'EN_CAMINO'
                          ? '🚗 VOY EN CAMINO'
                          : activeService.estado === 'LLEGUE'
                          ? '📍 EN EL DOMICILIO'
                          : activeService.estado === 'EN_PROGRESO'
                          ? '🧹 EN SERVICIO'
                          : '⚡ SERVICIO ACTIVO'}
                      </Text>
                    </View>
                    <Text style={dp.activePrice}>
                      ${Number(activeService.precioAcordado || 0).toLocaleString('es-CO')}
                    </Text>
                  </View>

                  <Text style={dp.activeClientName}>
                    {activeService.clienteNombre || 'Cliente'}
                  </Text>
                  <View style={dp.activeAddressRow}>
                    <Ionicons name="location-sharp" size={15} color={PROF.accent} />
                    <Text style={dp.activeAddress} numberOfLines={1}>
                      {activeService.direccion || 'Medellín, Antioquia'}
                    </Text>
                  </View>

                  <Text style={dp.activeStateTip}>
                    {activeService.estado === 'EN_CAMINO'
                      ? '⏱️ En camino hacia la ubicación del cliente'
                      : activeService.estado === 'LLEGUE'
                      ? '📍 Notificaste tu llegada. Entra e inicia el servicio'
                      : activeService.estado === 'EN_PROGRESO'
                      ? '🧹 Servicio en ejecución'
                      : '👉 Tu oferta fue aceptada. Toca para ver la ruta'}
                  </Text>

                  <View style={dp.activeActionsRow}>
                    <TouchableOpacity
                      style={dp.activePrimaryBtn}
                      onPress={() => navigation.navigate('ActiveServiceTracking', { service: activeService })}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="navigate" size={15} color="#fff" />
                      <Text style={dp.activePrimaryBtnText}>Ver Ruta y Estado</Text>
                    </TouchableOpacity>

                    {activeService.clienteTelefono ? (
                      <TouchableOpacity
                        style={dp.activePhoneBtn}
                        onPress={() => {
                          const url = `tel:${activeService.clienteTelefono}`;
                          Linking.canOpenURL(url)
                            .then((sup) => {
                              if (sup) Linking.openURL(url);
                              else Alert.alert('Contacto', `Teléfono: ${activeService.clienteTelefono}`);
                            })
                            .catch(() => Alert.alert('Contacto', `Teléfono: ${activeService.clienteTelefono}`));
                        }}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="call" size={17} color="#10B981" />
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={dp.activeChatBtn}
                      onPress={() =>
                        navigation.navigate('Chat', {
                          solicitudId: activeService.solicitudId || activeService.id,
                          destinatarioId: activeService.clienteId,
                          titulo: activeService.clienteNombre || 'Cliente',
                        })
                      }
                      activeOpacity={0.85}
                    >
                      <Ionicons name="chatbubble-ellipses" size={18} color={PROF.accent} />
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ═══ SOLICITUDES PENDIENTES (si hay) ═══ */}
          {pendingCount > 0 && isAvailable && (
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
                      <Text style={dp.pendingTitle}>{pendingCount} solicitudes nuevas</Text>
                      <Text style={dp.pendingSub}>Toca para ver y aceptar</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#fff" />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ═══ TARJETA PRINCIPAL: Ingresos + Stats en uno ═══ */}
          <GlassCard variant="elevated" style={dp.mainCard}>
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
              {recentActivity.length > 0
                ? recentActivity.map((item, i) => (
                    <View key={i}>
                      <ActivityItem item={item} index={i} />
                      {i < recentActivity.length - 1 && <View style={dp.actSep} />}
                    </View>
                  ))
                : (
                    <View style={{ padding: SPACING.md, alignItems: 'center' }}>
                      <Text style={{ color: PROF.textMuted, fontSize: TYPOGRAPHY.xs }}>Sin actividad reciente</Text>
                    </View>
                  )
              }
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

  // Active Service in-progress card
  activeServiceCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: PROF.accent,
    backgroundColor: 'rgba(0, 27, 56, 0.95)',
  },
  activeServiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(73, 192, 188, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  activePulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D09E',
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#49C0BC',
    letterSpacing: 0.5,
  },
  activePrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
  },
  activeClientName: {
    fontSize: 17,
    fontWeight: '800',
    color: PROF.textPrimary,
    marginBottom: 4,
  },
  activeAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 12,
  },
  activeAddress: {
    fontSize: 13,
    color: PROF.textMuted,
    flex: 1,
  },
  activeStateTip: {
    fontSize: 12,
    color: '#49C0BC',
    backgroundColor: 'rgba(73, 192, 188, 0.10)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  activeActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  activePrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PROF.accent,
    paddingVertical: 11,
    borderRadius: BORDER_RADIUS.lg,
    gap: 6,
  },
  activePrimaryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  activePhoneBtn: {
    width: 44,
    height: 42,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeChatBtn: {
    width: 44,
    height: 42,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(73, 192, 188, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(73, 192, 188, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

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
