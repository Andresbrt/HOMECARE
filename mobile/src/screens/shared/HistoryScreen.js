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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import apiClient from '../../services/apiClient';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

const FILTERS = ['Todos', 'Completados', 'Cancelados'];
const FILTER_MAP = { Todos: undefined, Completados: 'COMPLETADO', Cancelados: 'CANCELADO' };

const ESTADO_CONFIG = {
  COMPLETADO: { label: 'Completado', color: COLORS.success, icon: 'checkmark-circle' },
  CANCELADO: { label: 'Cancelado', color: COLORS.error, icon: 'close-circle' },
};

function ServiceCard({ item, onRate, onPress }) {
  const estado = ESTADO_CONFIG[item.estado] || { label: item.estado, color: COLORS.textSecondary, icon: 'ellipse' };
  const date = new Date(item.completadoAt || item.canceladoAt || item.createdAt);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => onPress(item)}>
      <View style={styles.cardHeader}>
        <View style={[styles.estadoBadge, { backgroundColor: estado.color + '15' }]}>
          <Ionicons name={estado.icon} size={14} color={estado.color} />
          <Text style={[styles.estadoText, { color: estado.color }]}>{estado.label}</Text>
        </View>
        <Text style={styles.cardDate}>{date.toLocaleDateString()}</Text>
      </View>

      <View style={styles.personRow}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={COLORS.textDisabled} />
        </View>
        <View style={styles.personInfo}>
          <Text style={styles.personName} numberOfLines={1}>
            {item.proveedorNombre || item.clienteNombre || 'Usuario'}
          </Text>
          <Text style={styles.personRole}>
            {item.proveedorNombre ? 'Proveedor' : 'Cliente'}
          </Text>
        </View>
        <Text style={styles.price}>
          ${item.precioAcordado?.toLocaleString() || '—'}
        </Text>
      </View>

      {item.direccion && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>{item.direccion}</Text>
        </View>
      )}

      {item.estado === 'COMPLETADO' && !item.calificado && (
        <TouchableOpacity style={styles.rateButton} onPress={() => onRate(item)}>
          <Ionicons name="star-outline" size={16} color={COLORS.accent} />
          <Text style={styles.rateText}>Calificar servicio</Text>
        </TouchableOpacity>
      )}

      {item.estado === 'CANCELADO' && item.motivoCancelacion && (
        <View style={styles.cancelReasonRow}>
          <Text style={styles.cancelLabel}>Motivo:</Text>
          <Text style={styles.cancelReason} numberOfLines={1}>{item.motivoCancelacion}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HistoryScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Todos');

  const fetchHistory = useCallback(async (filterKey) => {
    try {
      const estado = FILTER_MAP[filterKey || activeFilter];
      const params = estado ? { estado } : {};
      const { data } = await apiClient.get('/servicios/historial', { params });
      setServices(data);
    } catch (error) {
      // ignore
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

  const handleRate = (service) => {
    Alert.prompt
      ? showRatingAlert(service)
      : navigation.navigate('RateService', { servicioId: service.id });
  };

  const showRatingAlert = (service) => {
    Alert.alert(
      'Calificar servicio',
      '¿Cómo calificarías este servicio? (1-5)',
      [
        { text: 'Cancelar', style: 'cancel' },
        ...([1, 2, 3, 4, 5].map(n => ({
          text: '⭐'.repeat(n),
          onPress: () => submitRating(service, n),
        }))),
      ]
    );
  };

  const submitRating = async (service, puntuacion) => {
    try {
      const calificadoId = service.proveedorId || service.clienteId;
      await apiClient.post('/calificaciones', {
        servicioId: service.id,
        calificadoId,
        puntuacion,
        comentario: '',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, calificado: true } : s));
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la calificación.');
    }
  };

  const handlePress = (service) => {
    navigation.navigate('ServiceTracking', { servicioId: service.id });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial</Text>
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

      <FlatList
        data={services}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <ServiceCard item={item} onRate={handleRate} onPress={handlePress} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color={COLORS.textDisabled} />
            <Text style={styles.emptyTitle}>Sin historial</Text>
            <Text style={styles.emptyDesc}>
              {activeFilter === 'Todos'
                ? 'Cuando completes o canceles un servicio aparecerá aquí.'
                : `No hay servicios ${activeFilter.toLowerCase()}.`}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.sm },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: TYPOGRAPHY.xxl, fontWeight: TYPOGRAPHY.bold, color: COLORS.textPrimary },
  filtersRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surface },
  filterChipActive: { backgroundColor: COLORS.accent },
  filterText: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.medium, color: COLORS.textSecondary },
  filterTextActive: { color: '#FFFFFF' },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.md },
  card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  estadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  estadoText: { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.semibold },
  cardDate: { fontSize: TYPOGRAPHY.xs, color: COLORS.textDisabled },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  personInfo: { flex: 1 },
  personName: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.semibold, color: COLORS.textPrimary },
  personRole: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary },
  price: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold, color: COLORS.accent },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.xs },
  infoText: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, flex: 1 },
  rateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.accent },
  rateText: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold, color: COLORS.accent },
  cancelReasonRow: { flexDirection: 'row', gap: 4, marginTop: SPACING.xs },
  cancelLabel: { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.semibold, color: COLORS.error },
  cancelReason: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary, flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: SPACING.xxl * 2 },
  emptyTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.semibold, color: COLORS.textPrimary, marginTop: SPACING.md },
  emptyDesc: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs, paddingHorizontal: SPACING.xl },
});
