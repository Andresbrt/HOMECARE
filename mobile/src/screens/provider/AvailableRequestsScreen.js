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
import { useLocation } from '../../context/LocationContext';
import apiClient from '../../services/apiClient';
import { SEARCH_RADIUS_KM } from '../../config/api';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

const TIPO_ICONS = {
  BASICA: 'sparkles-outline',
  PROFUNDA: 'water-outline',
  OFICINA: 'business-outline',
  POST_CONSTRUCCION: 'construct-outline',
  MUDANZA: 'cube-outline',
  DESINFECCION: 'shield-checkmark-outline',
};

function RequestCard({ request, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(request)} activeOpacity={0.7}>
      <View style={styles.cardTop}>
        <View style={styles.tipoChip}>
          <Ionicons name={TIPO_ICONS[request.tipoLimpieza] || 'help-outline'} size={16} color={COLORS.accent} />
          <Text style={styles.tipoText}>{request.tipoLimpieza?.replace('_', ' ')}</Text>
        </View>
        {request.distanciaKm != null && (
          <Text style={styles.distanceText}>{request.distanciaKm.toFixed(1)} km</Text>
        )}
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>{request.titulo}</Text>
      <Text style={styles.cardAddress} numberOfLines={1}>
        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} /> {request.direccion}
      </Text>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{request.fechaServicio}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{request.horaInicio?.substring(0, 5)}</Text>
        </View>
        {request.cantidadOfertas > 0 && (
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={COLORS.warning} />
            <Text style={[styles.metaText, { color: COLORS.warning }]}>{request.cantidadOfertas} ofertas</Text>
          </View>
        )}
      </View>

      {request.precioMaximo && (
        <Text style={styles.maxPrice}>Presupuesto máx: ${Number(request.precioMaximo).toLocaleString()}</Text>
      )}

      <View style={styles.offerRow}>
        <Text style={styles.offerCta}>Enviar oferta</Text>
        <Ionicons name="arrow-forward" size={16} color={COLORS.accent} />
      </View>
    </TouchableOpacity>
  );
}

export default function AvailableRequestsScreen({ navigation }) {
  const { location } = useLocation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchRequests = useCallback(async (pageNum = 0, append = false) => {
    try {
      const lat = location?.coords?.latitude || 4.6097;
      const lng = location?.coords?.longitude || -74.0817;
      const { data } = await apiClient.get('/solicitudes/cercanas', {
        params: { latitud: lat, longitud: lng, radioKm: SEARCH_RADIUS_KM, page: pageNum, size: 15 },
      });
      const content = data.content || data;
      if (append) {
        setRequests(prev => [...prev, ...content]);
      } else {
        setRequests(content);
      }
      setHasMore(data.last === false);
      setPage(pageNum);
    } catch (error) {
      if (!append) Alert.alert('Error', 'No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleRefresh = () => { setRefreshing(true); fetchRequests(0); };
  const handleLoadMore = () => { if (hasMore && !loading) fetchRequests(page + 1, true); };

  const handlePress = (request) => {
    navigation.navigate('SendOffer', { solicitud: request });
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
      <FlatList
        data={requests}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <RequestCard request={item} onPress={handlePress} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <Text style={styles.listTitle}>Solicitudes cercanas</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={COLORS.textDisabled} />
            <Text style={styles.emptyTitle}>Sin solicitudes cercanas</Text>
            <Text style={styles.emptyDesc}>No hay solicitudes abiertas en tu zona. Intenta más tarde.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  listContent: { padding: SPACING.lg, gap: SPACING.md },
  listTitle: { fontSize: TYPOGRAPHY.xxl, fontWeight: TYPOGRAPHY.bold, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  card: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, ...SHADOWS.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  tipoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.backgroundSecondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
  tipoText: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary, textTransform: 'capitalize' },
  distanceText: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold, color: COLORS.accent },
  cardTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.semibold, color: COLORS.textPrimary },
  cardAddress: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, marginTop: 4 },
  cardMeta: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary },
  maxPrice: { fontSize: TYPOGRAPHY.sm, color: COLORS.accent, fontWeight: TYPOGRAPHY.semibold, marginTop: SPACING.sm },
  offerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  offerCta: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.bold, color: COLORS.accent },
  emptyState: { alignItems: 'center', paddingTop: SPACING.xxl * 2 },
  emptyTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.semibold, color: COLORS.textPrimary, marginTop: SPACING.md },
  emptyDesc: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs, paddingHorizontal: SPACING.xl },
});
