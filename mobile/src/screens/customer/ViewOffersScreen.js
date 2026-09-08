import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import apiClient from '../../services/apiClient';
import { activarChat } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import SkeletonLoader from '../../components/shared/SkeletonLoader';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

function StarRating({ value }) {
  const stars = Math.round(value || 0);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons key={s} name={s <= stars ? 'star' : 'star-outline'} size={12} color="#F5A623" />
      ))}
    </View>
  );
}

const OfferCard = React.memo(({ offer, index, onAccept }) => {
  const isPending = offer.estado === 'PENDIENTE';
  const isAccepted = offer.estado === 'ACEPTADA';
  const scale = useSharedValue(1);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 250 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 250 });
  };

  return (
    <Animated.View entering={FadeInDown.duration(200)} style={cardAnimStyle}>
      <View 
        style={[styles.card, isAccepted && styles.cardAccepted]}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        onTouchCancel={handlePressOut}
      >
        {/* Badge aceptada */}
        {isAccepted && (
          <View style={styles.acceptedBanner}>
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
            <Text style={styles.acceptedBannerText}>Oferta aceptada</Text>
          </View>
        )}

        {/* Header: profesional + precio */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={['#0E4D68', '#49C0BC']} style={styles.avatar}>
              <Text style={styles.avatarLetter}>
                {(offer.proveedorNombre || 'P')[0].toUpperCase()}
              </Text>
            </LinearGradient>
            {/* Dot de reputación */}
            <View style={[styles.repDot, { backgroundColor: offer.proveedorCalificacion >= 4 ? '#4CAF50' : '#F5A623' }]} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.providerName}>{offer.proveedorNombre || 'Profesional'}</Text>
            <View style={styles.ratingRow}>
              <StarRating value={offer.proveedorCalificacion} />
              <Text style={styles.ratingLabel}>
                {offer.proveedorCalificacion?.toFixed(1) ?? 'Nuevo'}
              </Text>
              <Text style={styles.ratingDot}>·</Text>
              <Text style={styles.ratingLabel}>
                {offer.proveedorServiciosCompletados ?? 0} servicios
              </Text>
            </View>
          </View>

          {/* Precio destacado */}
          <View style={styles.priceBox}>
            <Text style={styles.priceAmt}>
              ${Number(offer.precioOfrecido || 0).toLocaleString()}
            </Text>
            <Text style={styles.priceLbl}>COP</Text>
          </View>
        </View>

        {/* Mensaje del profesional */}
        {!!offer.mensajeOferta && (
          <View style={styles.messageBox}>
            <Ionicons name="chatbubble-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.messageText}>{offer.mensajeOferta}</Text>
          </View>
        )}

        {/* Chips de detalles */}
        <View style={styles.chipsRow}>
          {!!offer.tiempoLlegadaMinutos && (
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={13} color={COLORS.secondary} />
              <Text style={styles.chipText}>{offer.tiempoLlegadaMinutos} min</Text>
            </View>
          )}
          {offer.materialesIncluidos && (
            <View style={[styles.chip, styles.chipGreen]}>
              <Ionicons name="checkmark-circle" size={13} color="#4CAF50" />
              <Text style={[styles.chipText, { color: '#4CAF50' }]}>Materiales incl.</Text>
            </View>
          )}
          {!!offer.distanciaKm && (
            <View style={styles.chip}>
              <Ionicons name="navigate-outline" size={13} color={COLORS.secondary} />
              <Text style={styles.chipText}>{offer.distanciaKm.toFixed(1)} km</Text>
            </View>
          )}
        </View>

        {/* Botón aceptar */}
        {isPending && (
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onAccept(offer); }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#49C0BC', '#2a9d99']}
              style={styles.acceptBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.acceptBtnText}>Aceptar esta oferta</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
});

export default function ViewOffersScreen({ route, navigation }) {
  const { solicitudId } = route.params || {};
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const fetchOffers = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/ofertas/solicitud/${solicitudId}`);
      setOffers(Array.isArray(data) ? data : data?.content ?? []);
    } catch {
      if (!refreshing) Alert.alert('Error', 'No se pudieron cargar las ofertas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [solicitudId, refreshing]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const pendingCount = offers.filter((o) => o.estado === 'PENDIENTE').length;

  const handleAccept = (offer) => {
    Alert.alert(
      'Confirmar selección',
      `¿Contratar a ${offer.proveedorNombre} por $${Number(offer.precioOfrecido).toLocaleString()} COP?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, contratar',
          onPress: async () => {
            setAccepting(true);
            try {
              const res = await apiClient.post('/ofertas/aceptar', { ofertaId: offer.id });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              await activarChat({
                solicitudId,
                profesionalId: offer.proveedorId,
                profesionalNombre: offer.proveedorNombre,
                usuarioId: user?.id,
                usuarioPushToken: offer.proveedorPushToken ?? null,
              });

              navigation.replace('ServiceTracking', {
                servicioId: res?.data?.solicitudId || solicitudId,
                solicitudId,
                proveedorNombre: offer.proveedorNombre,
              });
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'No se pudo aceptar la oferta.');
            } finally {
              setAccepting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFF' }}>
      {/* Header */}
      <LinearGradient
        colors={['#001B38', '#0E4D68']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Animated.View entering={FadeIn.duration(400)} style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Ofertas recibidas</Text>
            {pendingCount > 0 && (
              <Text style={styles.headerSub}>{pendingCount} disponible{pendingCount !== 1 ? 's' : ''} para aceptar</Text>
            )}
          </View>
          {offers.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{offers.length}</Text>
            </View>
          )}
        </Animated.View>
      </LinearGradient>

      {/* Overlay de carga al aceptar */}
      {accepting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>Confirmando...</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.list}>
          {[1, 2, 3].map((k) => (
            <View key={k} style={[styles.card, { marginBottom: 12 }]}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <SkeletonLoader width={48} height={48} borderRadius={24} />
                <View style={{ flex: 1, gap: 6 }}>
                  <SkeletonLoader width="60%" height={16} />
                  <SkeletonLoader width="40%" height={12} />
                </View>
                <SkeletonLoader width={70} height={24} borderRadius={8} />
              </View>
              <SkeletonLoader width="100%" height={36} borderRadius={8} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => <OfferCard offer={item} index={index} onAccept={handleAccept} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOffers(); }} tintColor={COLORS.accent} />}
          ListEmptyComponent={
            <Animated.View entering={FadeInDown.duration(200)} style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="hourglass-outline" size={48} color={COLORS.textDisabled} />
              </View>
              <Text style={styles.emptyTitle}>Aún no hay ofertas</Text>
              <Text style={styles.emptyDesc}>
                Los profesionales cercanos verán tu solicitud y enviarán sus propuestas. ¡Pronto recibirás opciones!
              </Text>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={() => { setRefreshing(true); fetchOffers(); }}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={16} color={COLORS.accent} />
                <Text style={styles.refreshBtnText}>Actualizar</Text>
              </TouchableOpacity>
            </Animated.View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    color: '#fff',
  },
  headerSub: {
    fontSize: TYPOGRAPHY.xs,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#49C0BC',
    borderRadius: BORDER_RADIUS.full,
    minWidth: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
  },

  list: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardAccepted: {
    borderWidth: 2,
    borderColor: '#49C0BC',
  },
  acceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#49C0BC',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  acceptedBannerText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.md,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    color: '#fff',
  },
  repDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  providerName: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
  },
  ratingDot: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  priceAmt: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
    color: COLORS.accent,
    lineHeight: 28,
  },
  priceLbl: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Message
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFF',
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm + 4,
    marginBottom: SPACING.sm,
  },
  messageText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 19,
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2F7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  chipGreen: {
    backgroundColor: 'rgba(76,175,80,0.08)',
  },
  chipText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.secondary,
    fontWeight: '500',
  },

  // Accept button
  acceptBtn: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#49C0BC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  acceptBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
  },
  acceptBtnText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // Empty state
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EEF2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyDesc: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: SPACING.lg,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  refreshBtnText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    color: COLORS.accent,
  },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
