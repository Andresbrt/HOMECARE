import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { COLORS, PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

const SERVICE_ICONS = {
  BASICA: 'home-outline',
  PROFUNDA: 'sparkles-outline',
  HORAS: 'time-outline',
  OFICINA: 'business-outline',
  DEFAULT: 'brush-outline',
};

const SERVICE_LABELS = {
  BASICA: 'Limpieza General',
  PROFUNDA: 'Limpieza Profunda',
  HORAS: 'Por Horas',
  OFICINA: 'Oficinas',
};

const STATUS_CONFIG = {
  ABIERTA: { color: '#49C0BC', bg: 'rgba(73,192,188,0.12)', label: 'Abierta', icon: 'radio-button-on' },
  EN_PROCESO: { color: '#F5A623', bg: 'rgba(245,166,35,0.12)', label: 'En proceso', icon: 'timer-outline' },
  COMPLETADA: { color: '#4CAF50', bg: 'rgba(76,175,80,0.12)', label: 'Completada', icon: 'checkmark-circle' },
  CANCELADA: { color: '#EF5350', bg: 'rgba(239,83,80,0.12)', label: 'Cancelada', icon: 'close-circle' },
};

function getGreeting(nombre) {
  const h = new Date().getHours();
  const saludo = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';
  return `${saludo}, ${nombre?.split(' ')[0] || 'Usuario'} 👋`;
}

function RequestCard({ item, onViewOffers, onViewTracking }) {
  const status = STATUS_CONFIG[item.estado] || STATUS_CONFIG.ABIERTA;
  const icon = SERVICE_ICONS[item.tipoLimpieza] || SERVICE_ICONS.DEFAULT;
  const label = SERVICE_LABELS[item.tipoLimpieza] || item.tipoLimpieza;
  const offerCount = item.cantidadOfertas ?? 0;

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.requestCard}>
      {/* Header del card */}
      <View style={styles.requestCardHeader}>
        <View style={[styles.requestIconBox, { backgroundColor: 'rgba(73,192,188,0.12)' }]}>
          <Ionicons name={icon} size={20} color={COLORS.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.requestType}>{label}</Text>
          <Text style={styles.requestAddress} numberOfLines={1}>{item.direccion || 'Sin dirección'}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={11} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* Separador */}
      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.requestCardFooter}>
        {/* Precio */}
        <View style={styles.priceRow}>
          <Ionicons name="cash-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.priceText}>
            {item.precioMaximo ? `Máx. $${Number(item.precioMaximo).toLocaleString()}` : 'Precio libre'}
          </Text>
        </View>

        {/* Botón según estado */}
        {item.estado === 'ABIERTA' ? (
          <TouchableOpacity
            style={[styles.actionBtn, offerCount > 0 ? styles.actionBtnActive : styles.actionBtnWaiting]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onViewOffers(item); }}
            activeOpacity={0.8}
          >
            {offerCount > 0 ? (
              <>
                <View style={styles.offerBadge}><Text style={styles.offerBadgeText}>{offerCount}</Text></View>
                <Text style={styles.actionBtnText}>Ver ofertas</Text>
              </>
            ) : (
              <>
                <ActivityIndicator size={10} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.actionBtnText, { color: COLORS.textSecondary }]}>Esperando...</Text>
              </>
            )}
          </TouchableOpacity>
        ) : item.estado === 'EN_PROCESO' ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: 'rgba(245,166,35,0.15)', borderColor: 'rgba(245,166,35,0.3)' }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onViewTracking(item); }}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate-outline" size={13} color="#F5A623" />
            <Text style={[styles.actionBtnText, { color: '#F5A623' }]}>Ver seguimiento</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/solicitudes/mis-solicitudes');
      const arr = Array.isArray(data) ? data : data?.content ?? [];
      setRequests(arr.slice(0, 5));
    } catch {
      // silencioso - puede que el endpoint difiera
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const onRefresh = () => { setRefreshing(true); fetchRequests(); };

  const activeRequests = requests.filter((r) => r.estado === 'ABIERTA' || r.estado === 'EN_PROCESO');
  const completedCount = requests.filter((r) => r.estado === 'COMPLETADA').length;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFF' }}>
      {/* Floating AI button */}
      <TouchableOpacity
        style={styles.aiFab}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('AiAssistant'); }}
        activeOpacity={0.85}
      >
        <LinearGradient colors={['#0E4D68', '#49C0BC']} style={styles.aiFabGrad}>
          <Ionicons name="sparkles" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* ── Hero Header ── */}
        <LinearGradient
          colors={['#001B38', '#0E4D68', '#1a7a8a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 20 }]}
        >
          {/* Top row */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroGreeting}>{getGreeting(user?.nombre)}</Text>
              <Text style={styles.heroSub}>¿Qué necesitas hoy?</Text>
            </View>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate('UserNotifications')}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </Animated.View>

          {/* Stats row */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statNum}>{activeRequests.length}</Text>
              <Text style={styles.statLabel}>Activas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statChip}>
              <Text style={styles.statNum}>{completedCount}</Text>
              <Text style={styles.statLabel}>Completadas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statChip}>
              <Ionicons name="star" size={14} color="#F5A623" />
              <Text style={styles.statNum}>{user?.calificacionPromedio?.toFixed(1) ?? '—'}</Text>
              <Text style={styles.statLabel}>Calificación</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── CTA Principal ── */}
        <Animated.View entering={FadeInDown.duration(450).delay(80).springify()} style={styles.ctaWrapper}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('ServiceRequest');
            }}
          >
            <LinearGradient
              colors={['#49C0BC', '#2a9d99']}
              style={styles.ctaCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.ctaIconBox}>
                <Ionicons name="add-circle" size={36} color="rgba(255,255,255,0.95)" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaTitle}>Nueva solicitud</Text>
                <Text style={styles.ctaDesc}>Recibe ofertas de profesionales en minutos</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Acciones rápidas ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(140).springify()} style={styles.quickGrid}>
          {[
            { icon: 'time-outline', label: 'Historial', color: '#0E4D68', bg: 'rgba(14,77,104,0.1)', route: 'UserHistory' },
            { icon: 'chatbubbles-outline', label: 'Mis chats', color: '#49C0BC', bg: 'rgba(73,192,188,0.1)', route: 'UserChatList' },
            { icon: 'notifications-outline', label: 'Alertas', color: '#F5A623', bg: 'rgba(245,166,35,0.1)', route: 'UserNotifications' },
            { icon: 'person-outline', label: 'Perfil', color: '#001B38', bg: 'rgba(0,27,56,0.08)', route: 'UserProfile' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.quickItem}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate(item.route); }}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── Mis solicitudes activas ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(200).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis solicitudes activas</Text>
            <TouchableOpacity onPress={() => navigation.navigate('UserHistory')} activeOpacity={0.7}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={COLORS.accent} />
            </View>
          ) : activeRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="clipboard-outline" size={40} color={COLORS.textDisabled} />
              <Text style={styles.emptyTitle}>Sin solicitudes activas</Text>
              <Text style={styles.emptyDesc}>Crea una solicitud y empieza a recibir ofertas</Text>
            </View>
          ) : (
            activeRequests.map((item) => (
              <RequestCard
                key={item.id}
                item={item}
                onViewOffers={(r) => navigation.navigate('ViewOffers', { solicitudId: r.id })}
                onViewTracking={(r) => navigation.navigate('ServiceTracking', { solicitudId: r.id })}
              />
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Hero
  hero: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  heroGreeting: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  heroSub: {
    fontSize: TYPOGRAPHY.sm,
    color: 'rgba(255,255,255,0.65)',
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statNum: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },

  // CTA
  ctaWrapper: {
    marginHorizontal: SPACING.lg,
    marginTop: -SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#49C0BC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: BORDER_RADIUS.xl,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  ctaIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  ctaDesc: {
    fontSize: TYPOGRAPHY.xs,
    color: 'rgba(255,255,255,0.8)',
  },

  // Quick actions
  quickGrid: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Section
  section: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  seeAll: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    color: COLORS.accent,
  },

  // Request card
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  requestCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  requestIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestType: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  requestAddress: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F8',
    marginHorizontal: SPACING.md,
  },
  requestCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  priceText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  actionBtnActive: {
    backgroundColor: 'rgba(73,192,188,0.1)',
    borderColor: 'rgba(73,192,188,0.35)',
  },
  actionBtnWaiting: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  actionBtnText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    color: COLORS.accent,
  },
  offerBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  offerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  // Floating AI button
  aiFab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    zIndex: 99,
    borderRadius: 30,
    shadowColor: '#49C0BC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  aiFabGrad: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty / loading
  centered: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
