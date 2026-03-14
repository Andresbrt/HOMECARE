import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../services/apiClient';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

const ESTADO_CONFIG = {
  PENDIENTE: { label: 'Pendiente', color: COLORS.warning, icon: 'time-outline' },
  ACEPTADA: { label: 'Aceptada', color: COLORS.success, icon: 'checkmark-circle' },
  RECHAZADA: { label: 'Rechazada', color: COLORS.error, icon: 'close-circle' },
  RETIRADA: { label: 'Retirada', color: COLORS.textDisabled, icon: 'arrow-undo' },
};

const FILTERS = [
  { value: null, label: 'Todas' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'ACEPTADA', label: 'Aceptadas' },
];

function OfferCard({ offer }) {
  const estado = ESTADO_CONFIG[offer.estado] || ESTADO_CONFIG.PENDIENTE;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>Solicitud #{offer.solicitudId}</Text>
          <Text style={styles.cardDate}>{new Date(offer.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: estado.color }]}>
          <Ionicons name={estado.icon} size={12} color={COLORS.white} />
          <Text style={styles.estadoText}>{estado.label}</Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Tu oferta:</Text>
        <Text style={styles.priceValue}>${Number(offer.precioOfrecido).toLocaleString()}</Text>
      </View>

      {offer.mensajeOferta ? (
        <Text style={styles.message} numberOfLines={2}>{offer.mensajeOferta}</Text>
      ) : null}

      <View style={styles.cardFooter}>
        {offer.tiempoLlegadaMinutos ? (
          <View style={styles.footerChip}>
            <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.footerText}>{offer.tiempoLlegadaMinutos} min</Text>
          </View>
        ) : null}
        {offer.materialesIncluidos && (
          <View style={styles.footerChip}>
            <Ionicons name="checkmark" size={12} color={COLORS.success} />
            <Text style={styles.footerText}>Materiales</Text>
          </View>
        )}
        {offer.vistaPorCliente && (
          <View style={styles.footerChip}>
            <Ionicons name="eye" size={12} color={COLORS.info} />
            <Text style={styles.footerText}>Vista</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function MyOffersScreen({ navigation }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState(null);

  const fetchOffers = useCallback(async () => {
    try {
      const params = filter ? { estado: filter } : {};
      const { data } = await apiClient.get('/ofertas/mis-ofertas', { params });
      setOffers(data);
    } catch (error) {
      if (!refreshing) Alert.alert('Error', 'No se pudieron cargar tus ofertas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, refreshing]);

  useEffect(() => { setLoading(true); fetchOffers(); }, [fetchOffers]);

  const handleRefresh = () => { setRefreshing(true); fetchOffers(); };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.label}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={offers}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <OfferCard offer={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="pricetag-outline" size={48} color={COLORS.textDisabled} />
            <Text style={styles.emptyTitle}>Sin ofertas</Text>
            <Text style={styles.emptyDesc}>
              {filter ? 'No tienes ofertas con este filtro.' : 'Aún no has enviado ofertas. Busca solicitudes cercanas para comenzar.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.sm },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  filterText: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white, fontWeight: TYPOGRAPHY.semibold },
  listContent: { padding: SPACING.lg, gap: SPACING.md },
  card: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, ...SHADOWS.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.semibold, color: COLORS.textPrimary },
  cardDate: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary, marginTop: 2 },
  estadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: BORDER_RADIUS.full },
  estadoText: { color: COLORS.white, fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.bold },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  priceLabel: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary },
  priceValue: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.bold, color: COLORS.accent },
  message: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, marginTop: SPACING.xs, fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  footerChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.backgroundSecondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BORDER_RADIUS.full },
  footerText: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary },
  emptyState: { alignItems: 'center', paddingTop: SPACING.xxl * 2 },
  emptyTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.semibold, color: COLORS.textPrimary, marginTop: SPACING.md },
  emptyDesc: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs, paddingHorizontal: SPACING.xl },
});
