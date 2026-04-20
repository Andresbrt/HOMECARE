import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import apiClient from '../../services/apiClient';
import useModeStore from '../../store/modeStore';
import { COLORS, PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

const FILTERS = ['Todos', 'Completados', 'Cancelados'];
const FILTER_MAP = { Todos: undefined, Completados: 'COMPLETADO', Cancelados: 'CANCELADO' };

const ESTADO_CONFIG = {
  COMPLETADO: { label: 'Completado', color: '#49C0BC', icon: 'checkmark-circle' },
  CANCELADO:  { label: 'Cancelado',  color: '#FF5B5B', icon: 'close-circle'    },
};

function ServiceCard({ item, onRate, onPress, isProfessional }) {
  const estado = ESTADO_CONFIG[item.estado] ?? { label: item.estado, color: PROF.textMuted, icon: 'ellipse' };
  const date = new Date(item.completadoAt ?? item.canceladoAt ?? item.createdAt ?? 0);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => onPress(item)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.estadoBadge, { backgroundColor: estado.color + '20' }]}>
          <Ionicons name={estado.icon} size={13} color={estado.color} />
          <Text style={[styles.estadoText, { color: estado.color }]}>{estado.label}</Text>
        </View>
        <Text style={styles.cardDate}>
          {date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
      </View>

      <View style={styles.personRow}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={18} color={PROF.textMuted} />
        </View>
        <View style={styles.personInfo}>
          <Text style={styles.personName} numberOfLines={1}>
            {item.proveedorNombre ?? item.clienteNombre ?? 'Usuario'}
          </Text>
          <Text style={styles.personRole}>
            {item.proveedorNombre ? 'Profesional' : 'Cliente'}
          </Text>
        </View>
        <Text style={styles.price}>
          COL$ {item.precioAcordado != null ? Number(item.precioAcordado).toLocaleString('es-CO') : 'â€”'}
        </Text>
      </View>

      {item.direccion ? (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={13} color={PROF.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>{item.direccion}</Text>
        </View>
      ) : null}

      {item.estado === 'COMPLETADO' && !item.calificado && (
        <TouchableOpacity style={styles.rateButton} onPress={() => onRate(item)}>
          <Ionicons name="star-outline" size={15} color={PROF.accent} />
          <Text style={styles.rateText}>Calificar servicio</Text>
        </TouchableOpacity>
      )}

      {item.estado === 'CANCELADO' && item.motivoCancelacion ? (
        <View style={styles.cancelReasonRow}>
          <Text style={styles.cancelLabel}>Motivo:</Text>
          <Text style={styles.cancelReason} numberOfLines={1}>{item.motivoCancelacion}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export default function HistoryScreen({ navigation }) {
  const { mode } = useModeStore();
  const isProfessional = mode === 'profesional';
  const [services, setServices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Todos');

  const fetchHistory = useCallback(async (filterKey) => {
    try {
      const estado = FILTER_MAP[filterKey ?? activeFilter];
      const params = estado ? { estado } : {};
      const { data } = await apiClient.get('/servicios/historial', { params });
      setServices(Array.isArray(data) ? data : []);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleRefresh = () => { setRefreshing(true); fetchHistory(); };

  const handleFilterChange = (filter) => {
    if (filter === activeFilter) return;
    Haptics.selectionAsync();
    setActiveFilter(filter);
    setLoading(true);
    fetchHistory(filter);
  };

  const showRatingAlert = (service) => {
    Alert.alert(
      'Calificar servicio',
      'Â¿CÃ³mo calificarÃ­as este servicio? (1-5)',
      [
        { text: 'Cancelar', style: 'cancel' },
        ...[1, 2, 3, 4, 5].map(n => ({
          text: 'â­'.repeat(n),
          onPress: () => submitRating(service, n),
        })),
      ]
    );
  };

  const submitRating = async (service, puntuacion) => {
    try {
      const calificadoId = service.proveedorId ?? service.clienteId;
      await apiClient.post('/calificaciones', {
        servicioId: service.id,
        calificadoId,
        puntuacion,
        comentario: '',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, calificado: true } : s));
    } catch {
      Alert.alert('Error', 'No se pudo enviar la calificaciÃ³n. Intenta de nuevo.');
    }
  };

  const handlePress = (service) => {
    if (!isProfessional) {
      navigation.navigate('ServiceTracking', { servicioId: service.id });
    }
  };

  return (
    <LinearGradient colors={PROF.gradMain} style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#000F22" />
      <SafeAreaView style={styles.safe}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={PROF.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historial</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.filtersRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => handleFilterChange(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={PROF.accent} />
          </View>
        ) : (
          <FlatList
            data={services}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <ServiceCard
                item={item}
                onRate={showRatingAlert}
                onPress={handlePress}
                isProfessional={isProfessional}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={PROF.accent}
                colors={[PROF.accent]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={52} color={PROF.textMuted} />
                <Text style={styles.emptyTitle}>Sin historial</Text>
                <Text style={styles.emptyDesc}>
                  {activeFilter === 'Todos'
                    ? 'Cuando completes o canceles un servicio aparecerÃ¡ aquÃ­.'
                    : `No hay servicios ${activeFilter.toLowerCase()}.`}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe:   { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: PROF.border,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: PROF.textPrimary,
    letterSpacing: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: PROF.glass,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
  },
  filterChipActive: {
    backgroundColor: PROF.accent,
    borderColor: PROF.accent,
  },
  filterText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: PROF.textSecondary,
  },
  filterTextActive: { color: '#FFFFFF' },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  card: {
    backgroundColor: PROF.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  estadoText: { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.semibold },
  cardDate:   { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted },
  personRow:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: PROF.bgElevated,
    justifyContent: 'center', alignItems: 'center',
  },
  personInfo: { flex: 1 },
  personName: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: PROF.textPrimary,
  },
  personRole: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, marginTop: 2 },
  price: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold,
    color: PROF.accent,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  infoText: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, flex: 1 },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: PROF.accentGlow,
  },
  rateText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: PROF.accent,
  },
  cancelReasonRow: { flexDirection: 'row', gap: 4, marginTop: SPACING.xs },
  cancelLabel:  { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.semibold, color: PROF.error },
  cancelReason: { fontSize: TYPOGRAPHY.xs, color: PROF.textMuted, flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: PROF.textPrimary,
    marginTop: SPACING.md,
  },
  emptyDesc: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xl,
    lineHeight: 20,
  },
});
