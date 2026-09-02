/**
 * AdminPanelScreen — Panel de administración (solo SUPER_ADMIN)
 * Protegido por rol + PIN de verificación en sesión.
 */
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
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, SPACING, BORDER_RADIUS } from '../../constants/theme';

// ─── PIN Input ───────────────────────────────────────────────────────────────
function PinScreen({ onVerified, onCancel }) {
  const [pin, setPin]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const shakeX = useSharedValue(0);

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(10, { duration: 55 }), withTiming(-10, { duration: 55 }),
      withTiming( 7, { duration: 55 }), withTiming( -7, { duration: 55 }),
      withTiming( 0, { duration: 55 }),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const handleDigit = (d) => {
    if (pin.length < 6) {
      const next = pin + d;
      setPin(next);
      setError('');
      if (next.length === 6) verifyPin(next);
    }
  };

  const verifyPin = async (p) => {
    setLoading(true);
    try {
      await adminService.verifyPin(p);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onVerified();
    } catch (err) {
      const msg = err.response?.status === 403
        ? 'PIN incorrecto'
        : err.response?.data?.message || 'Error de verificación';
      setError(msg);
      setPin('');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const DIGITS = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']];

  return (
    <View style={styles.pinScreen}>
      <LinearGradient colors={PROF.gradMain} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeInDown.duration(450).springify()} style={styles.pinCard}>
        <LinearGradient colors={PROF.gradAccent} style={styles.pinIconCircle}>
          <Ionicons name="shield-checkmark" size={32} color={PROF.bgDeep} />
        </LinearGradient>
        <Text style={styles.pinTitle}>Verificación de seguridad</Text>
        <Text style={styles.pinSubtitle}>Ingresa el PIN de administrador para continuar</Text>

        {/* Puntos PIN */}
        <Animated.View style={[styles.pinDotsRow, shakeStyle]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[styles.pinDot, i < pin.length && styles.pinDotFilled]} />
          ))}
        </Animated.View>

        {!!error && <Text style={styles.pinError}>{error}</Text>}
        {loading && <ActivityIndicator color={PROF.accent} style={{ marginTop: 8 }} />}

        {/* Teclado numérico */}
        {DIGITS.map((row, ri) => (
          <View key={ri} style={styles.pinRow}>
            {row.map((d, ci) => (
              <TouchableOpacity
                key={ci}
                style={[styles.pinKey, d === '' && styles.pinKeyHidden]}
                disabled={d === ''}
                onPress={() => {
                  if (d === '⌫') { setPin(p => p.slice(0, -1)); setError(''); }
                  else handleDigit(d);
                }}
              >
                <Text style={styles.pinKeyText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity onPress={onCancel} style={styles.pinCancel}>
          <Text style={styles.pinCancelText}>Cancelar</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Tarjeta de estadística ──────────────────────────────────────────────────
function StatCard({ icon, label, value, color, delay }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.statWrap}>
      <GlassCard variant="default" style={styles.statCard}>
        <View style={[styles.statIconWrap, { backgroundColor: `${color}22` }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.statValue}>{value ?? '--'}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Fila de usuario/profesional ────────────────────────────────────────────
function PersonRow({ item, type, onToggle, delay }) {
  const isBlocked  = item.bloqueado || item.activo === false;
  const isApproved = item.aprobado;
  const displayName = item.nombre || item.email || 'Sin nombre';
  const color = type === 'prof'
    ? (isApproved ? PROF.accent : PROF.warning)
    : (isBlocked  ? PROF.error  : PROF.accent);

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <TouchableOpacity style={styles.personRow} onPress={() => onToggle(item)} activeOpacity={0.8}>
        <View style={[styles.personAvatar, { backgroundColor: `${color}22` }]}>
          <Ionicons
            name={type === 'prof' ? 'briefcase-outline' : 'person-outline'}
            size={18}
            color={color}
          />
        </View>
        <View style={styles.personInfo}>
          <Text style={styles.personName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.personEmail} numberOfLines={1}>{item.email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${color}22` }]}>
          <Text style={[styles.statusText, { color }]}>
            {type === 'prof'
              ? (isApproved ? 'Aprobado' : 'Pendiente')
              : (isBlocked  ? 'Bloqueado' : 'Activo')
            }
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Pantalla principal del admin ────────────────────────────────────────────
export default function AdminPanelScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [pinVerified, setPinVerified]   = useState(false);
  const [activeTab, setActiveTab]       = useState('stats'); // stats | users | profs | requests
  const [stats, setStats]               = useState(null);
  const [users, setUsers]               = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);

  // ── Guardia de rol ──────────────────────────────────────────────────────
  // Solo el render-guard cubre esta lógica. El useEffect extra fue eliminado
  // para evitar el doble pop (flash visual + navigation.goBack() en paralelo).
  // ── Cargar datos tras verificar PIN ────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, p, r] = await Promise.allSettled([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getProfessionals(),
        adminService.getRecentRequests(),
      ]);
      if (s.status === 'fulfilled') setStats(s.value);
      if (u.status === 'fulfilled') setUsers(Array.isArray(u.value) ? u.value : u.value?.content ?? []);
      if (p.status === 'fulfilled') setProfessionals(Array.isArray(p.value) ? p.value : p.value?.content ?? []);
      if (r.status === 'fulfilled') setRecentRequests(Array.isArray(r.value) ? r.value : r.value?.content ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  useEffect(() => {
    if (pinVerified) loadAll();
  }, [pinVerified]);

  // ── Guardia de rol sin autenticar ───────────────────────────────────────
  if (!user || user.rol !== 'SUPER_ADMIN') {
    return (
      <View style={styles.screen}>
        <LinearGradient colors={PROF.gradMain} style={StyleSheet.absoluteFill} />
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color={PROF.error} />
          <Text style={styles.accessDeniedText}>Acceso restringido</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.goBackText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── PIN screen ──────────────────────────────────────────────────────────
  if (!pinVerified) {
    return (
      <PinScreen
        onVerified={() => setPinVerified(true)}
        onCancel={() => navigation.goBack()}
      />
    );
  }

  const TABS = [
    { id: 'stats',    icon: 'bar-chart-outline',    label: 'Stats'    },
    { id: 'users',    icon: 'people-outline',        label: 'Usuarios' },
    { id: 'profs',    icon: 'briefcase-outline',     label: 'Profesionales' },
    { id: 'requests', icon: 'receipt-outline',       label: 'Solicitudes' },
  ];

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
        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle}>Panel Admin</Text>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={10} color={PROF.bgDeep} />
            <Text style={styles.adminBadgeText}>SUPER_ADMIN</Text>
          </View>
        </View>
        <TouchableOpacity onPress={loadAll} style={styles.refreshBtn}>
          {loading
            ? <ActivityIndicator size="small" color={PROF.accent} />
            : <Ionicons name="refresh-outline" size={20} color={PROF.accent} />
          }
        </TouchableOpacity>
      </View>

      {/* ── Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroll}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabPill, activeTab === tab.id && styles.tabPillActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={14}
              color={activeTab === tab.id ? PROF.bgDeep : PROF.textMuted}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Contenido ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PROF.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        {activeTab === 'stats' && (
          <>
            <Animated.View entering={FadeIn.duration(400)} style={styles.statsGrid}>
              <StatCard icon="people"              label="Usuarios"       value={stats?.totalUsuarios}          color={PROF.accent}   delay={0}   />
              <StatCard icon="briefcase"           label="Profesionales"  value={stats?.totalProfesionales}     color="#7ED321"       delay={60}  />
              <StatCard icon="receipt"             label="Solicitudes"    value={stats?.totalSolicitudes}       color={PROF.warning}  delay={120} />
              <StatCard icon="checkmark-circle"    label="Completadas"    value={stats?.solicitudesCompletadas} color={PROF.accent}   delay={180} />
              <StatCard icon="hourglass-outline"   label="Pendientes"     value={stats?.solicitudesPendientes}  color="#FF8C00"       delay={240} />
              <StatCard icon="cash-outline"        label="Ingresos (mes)" value={stats?.ingresosMes ? `$${stats.ingresosMes}` : '--'} color="#FFD700" delay={300} />
            </Animated.View>

            {!stats && !loading && (
              <Animated.View entering={FadeInDown.delay(200)} style={styles.emptyState}>
                <Ionicons name="cloud-offline-outline" size={48} color={PROF.textMuted} />
                <Text style={styles.emptyText}>Sin datos disponibles</Text>
              </Animated.View>
            )}
          </>
        )}

        {/* Usuarios */}
        {activeTab === 'users' && (
          <GlassCard variant="default" style={styles.listCard}>
            {users.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={40} color={PROF.textMuted} />
                <Text style={styles.emptyText}>Sin usuarios para mostrar</Text>
              </View>
            )}
            {users.map((u, i) => (
              <PersonRow
                key={u.id ?? i}
                item={u}
                type="user"
                delay={i * 40}
                onToggle={async (item) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  await adminService.toggleUserBlock(item.id, !item.bloqueado).catch(() => {});
                  loadAll();
                }}
              />
            ))}
          </GlassCard>
        )}

        {/* Profesionales */}
        {activeTab === 'profs' && (
          <GlassCard variant="default" style={styles.listCard}>
            {professionals.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="briefcase-outline" size={40} color={PROF.textMuted} />
                <Text style={styles.emptyText}>Sin profesionales para mostrar</Text>
              </View>
            )}
            {professionals.map((p, i) => (
              <PersonRow
                key={p.id ?? i}
                item={p}
                type="prof"
                delay={i * 40}
                onToggle={async (item) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  await adminService.toggleProfessionalApproval(item.id, !item.aprobado).catch(() => {});
                  loadAll();
                }}
              />
            ))}
          </GlassCard>
        )}

        {/* Solicitudes */}
        {activeTab === 'requests' && (
          <GlassCard variant="default" style={styles.listCard}>
            {recentRequests.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={40} color={PROF.textMuted} />
                <Text style={styles.emptyText}>Sin solicitudes recientes</Text>
              </View>
            )}
            {recentRequests.map((req, i) => (
              <Animated.View
                key={req.id ?? i}
                entering={FadeInDown.delay(i * 40).springify()}
                style={styles.requestRow}
              >
                <View style={[styles.reqStatusDot, {
                  backgroundColor: req.estado === 'COMPLETADA' ? PROF.accent
                    : req.estado === 'PENDIENTE' ? PROF.warning
                    : PROF.error,
                }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reqTitle} numberOfLines={1}>
                    {req.tipoServicio || req.descripcion || 'Solicitud #' + (req.id ?? i + 1)}
                  </Text>
                  <Text style={styles.reqSub}>{req.estado ?? 'Sin estado'}</Text>
                </View>
                <Text style={styles.reqDate}>
                  {req.fechaCreacion ? new Date(req.fechaCreacion).toLocaleDateString('es') : ''}
                </Text>
              </Animated.View>
            ))}
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
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
  topTitleWrap: { flex: 1, gap: 2 },
  topTitle: { fontSize: 18, fontWeight: '700', color: PROF.textPrimary },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: PROF.accent, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start',
  },
  adminBadgeText: { fontSize: 9, fontWeight: '800', color: PROF.bgDeep, letterSpacing: 0.5 },
  refreshBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  // Tabs
  tabsScroll: { maxHeight: 50, flexGrow: 0 },
  tabsRow: { paddingHorizontal: SPACING.lg, gap: 8, alignItems: 'center', paddingBottom: 8 },
  tabPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: PROF.glassBorder,
  },
  tabPillActive: { backgroundColor: PROF.accent, borderColor: PROF.accent },
  tabLabel: { fontSize: 12, fontWeight: '600', color: PROF.textMuted },
  tabLabelActive: { color: PROF.bgDeep },

  // Content
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },

  // Stats grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: SPACING.sm, marginBottom: SPACING.lg,
  },
  statWrap: { width: '47%' },
  statCard: { alignItems: 'center', paddingVertical: SPACING.lg },
  statIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: PROF.textPrimary, marginBottom: 2 },
  statLabel: { fontSize: 11, color: PROF.textMuted, textAlign: 'center' },

  // List card
  listCard: { marginBottom: SPACING.lg },

  // Person row
  personRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  personAvatar: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  personInfo: { flex: 1 },
  personName: { fontSize: 14, fontWeight: '600', color: PROF.textPrimary },
  personEmail: { fontSize: 12, color: PROF.textMuted },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Request row
  requestRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  reqStatusDot: { width: 8, height: 8, borderRadius: 4 },
  reqTitle: { fontSize: 14, fontWeight: '600', color: PROF.textPrimary },
  reqSub:   { fontSize: 12, color: PROF.textMuted },
  reqDate:  { fontSize: 11, color: PROF.textMuted },

  // Empty state
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.xxl, gap: 12,
  },
  emptyText: {
    fontSize: 13, color: PROF.textMuted, textAlign: 'center', lineHeight: 18,
  },

  // Access denied
  accessDenied: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.lg },
  accessDeniedText: { fontSize: 20, fontWeight: '700', color: PROF.textPrimary },
  goBackText: { fontSize: 15, color: PROF.accent, fontWeight: '600' },

  // PIN screen
  pinScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pinCard: {
    width: '85%', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl,
  },
  pinIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  pinTitle: { fontSize: 20, fontWeight: '700', color: PROF.textPrimary, textAlign: 'center' },
  pinSubtitle: { fontSize: 13, color: PROF.textSecondary, textAlign: 'center', marginBottom: 4 },
  pinDotsRow: { flexDirection: 'row', gap: 14, marginVertical: SPACING.md },
  pinDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5, borderColor: PROF.glassBorder,
  },
  pinDotFilled: { backgroundColor: PROF.accent, borderColor: PROF.accent },
  pinError: { fontSize: 13, color: PROF.error, textAlign: 'center' },
  pinRow: { flexDirection: 'row', gap: 12 },
  pinKey: {
    width: 72, height: 52, borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: PROF.glassBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  pinKeyHidden: { opacity: 0 },
  pinKeyText: { fontSize: 20, fontWeight: '600', color: PROF.textPrimary },
  pinCancel: { marginTop: SPACING.sm },
  pinCancelText: { fontSize: 14, color: PROF.textMuted, fontWeight: '600' },
});
