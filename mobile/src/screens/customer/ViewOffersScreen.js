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
import * as Haptics from 'expo-haptics';
import apiClient from '../../services/apiClient';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

const OfferCard = React.memo(({ offer, onAccept }) => {
  return (
    <View style={styles.offerCard}>
      <View style={styles.offerHeader}>
        <View style={styles.providerInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={COLORS.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.providerName}>{offer.proveedorNombre}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={COLORS.warning} />
              <Text style={styles.ratingText}>
                {offer.proveedorCalificacion?.toFixed(1) || 'Nuevo'} · {offer.proveedorServiciosCompletados || 0} servicios
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Oferta</Text>
          <Text style={styles.priceValue}>${Number(offer.precioOfrecido).toLocaleString()}</Text>
        </View>
      </View>

      {offer.mensajeOferta ? <Text style={styles.offerMessage}>{offer.mensajeOferta}</Text> : null}

      <View style={styles.offerDetails}>
        {offer.tiempoLlegadaMinutos ? (
          <View style={styles.detailChip}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{offer.tiempoLlegadaMinutos} min</Text>
          </View>
        ) : null}
        {offer.materialesIncluidos ? (
          <View style={styles.detailChip}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.detailText}>Materiales incluidos</Text>
          </View>
        ) : null}
        {offer.distanciaKm ? (
          <View style={styles.detailChip}>
            <Ionicons name="navigate-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{offer.distanciaKm.toFixed(1)} km</Text>
          </View>
        ) : null}
      </View>

      {offer.estado === 'PENDIENTE' && (
        <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(offer)} activeOpacity={0.8}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
          <Text style={styles.acceptText}>Aceptar oferta</Text>
        </TouchableOpacity>
      )}
      {offer.estado === 'ACEPTADA' && (
        <View style={[styles.statusBadge, { backgroundColor: COLORS.success }]}>
          <Text style={styles.statusText}>Aceptada</Text>
        </View>
      )}
    </View>
  );
});

export default function ViewOffersScreen({ route, navigation }) {
  const { solicitudId } = route.params || {};
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const fetchOffers = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/ofertas/solicitud/${solicitudId}`);
      setOffers(data);
    } catch (error) {
      if (!refreshing) Alert.alert('Error', 'No se pudieron cargar las ofertas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [solicitudId, refreshing]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const handleRefresh = () => { setRefreshing(true); fetchOffers(); };

  const handleAccept = async (offer) => {
    Alert.alert(
      'Aceptar oferta',
      `¿Aceptar la oferta de ${offer.proveedorNombre} por $${Number(offer.precioOfrecido).toLocaleString()}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            setAccepting(true);
            try {
              await apiClient.post('/ofertas/aceptar', { ofertaId: offer.id });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('¡Oferta aceptada!', `${offer.proveedorNombre} realizará tu servicio.`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'No se pudo aceptar la oferta.');
            } finally {
              setAccepting(false);
            }
          },
        },
      ]
    );
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ofertas recibidas</Text>
        <Text style={styles.countBadge}>{offers.length}</Text>
      </View>

      {accepting && (
        <View style={styles.acceptingOverlay}>
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      )}

      <FlatList
        data={offers}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <OfferCard offer={item} onAccept={handleAccept} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="hourglass-outline" size={48} color={COLORS.textDisabled} />
            <Text style={styles.emptyTitle}>Aún no hay ofertas</Text>
            <Text style={styles.emptyDesc}>Los profesionales verán tu solicitud y enviarán sus propuestas.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  headerTitle: { flex: 1, fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.bold, color: COLORS.textPrimary },
  countBadge: { backgroundColor: COLORS.accent, color: COLORS.white, fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.bold, paddingHorizontal: 10, paddingVertical: 2, borderRadius: BORDER_RADIUS.full, overflow: 'hidden' },
  listContent: { padding: SPACING.lg, paddingTop: 0, gap: SPACING.md },
  offerCard: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  offerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  providerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACING.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  providerName: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.semibold, color: COLORS.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary },
  priceBox: { alignItems: 'flex-end' },
  priceLabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary },
  priceValue: { fontSize: TYPOGRAPHY.xxl, fontWeight: TYPOGRAPHY.bold, color: COLORS.accent },
  offerMessage: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, marginTop: SPACING.sm, fontStyle: 'italic' },
  offerDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.backgroundSecondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
  detailText: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.accent, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginTop: SPACING.md },
  acceptText: { color: COLORS.white, fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, marginTop: SPACING.sm },
  statusText: { color: COLORS.white, fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.bold },
  acceptingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.overlay, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  emptyState: { alignItems: 'center', paddingTop: SPACING.xxl * 2 },
  emptyTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.semibold, color: COLORS.textPrimary, marginTop: SPACING.md },
  emptyDesc: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs, paddingHorizontal: SPACING.xl },
});
