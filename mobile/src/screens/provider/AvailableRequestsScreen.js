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
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocation } from '../../context/LocationContext';
import apiClient from '../../services/apiClient';
import { SEARCH_RADIUS_KM } from '../../config/api';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

const TIPO_CONFIG = {
  BASICA: { icon: 'home-outline', label: 'Limpieza General', color: '#49C0BC' },
  PROFUNDA: { icon: 'sparkles-outline', label: 'Limpieza Profunda', color: '#9B59B6' },
  OFICINA: { icon: 'business-outline', label: 'Oficinas', color: '#3498DB' },
  POST_CONSTRUCCION: { icon: 'construct-outline', label: 'Post-Construcción', color: '#E67E22' },
  MUDANZA: { icon: 'cube-outline', label: 'Mudanza', color: '#1ABC9C' },
  DESINFECCION: { icon: 'shield-checkmark-outline', label: 'Desinfección', color: '#2ECC71' },
  HORAS: { icon: 'time-outline', label: 'Por Horas', color: '#F5A623' },
};

function RequestCard({ request, index, onPress }) {
  const tipo = TIPO_CONFIG[request.tipoLimpieza] || { icon: 'brush-outline', label: request.tipoLimpieza, color: '#49C0BC' };
  const offersCount = request.cantidadOfertas ?? 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    } catch { return dateStr; }
  };

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 50).springify()}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(request); }}
        activeOpacity={0.85}
      >
        {/* Top: tipo + distancia */}
        <View style={styles.cardTop}>
          <View style={[styles.tipoChip, { backgroundColor: `${tipo.color}18` }]}>
            <Ionicons name={tipo.icon} size={14} color={tipo.color} />
            <Text style={[styles.tipoText, { color: tipo.color }]}>{tipo.label}</Text>
          </View>
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate" size={12} color={PROF.accent} />
            <Text style={styles.distanceText}>
              {request.distanciaKm != null ? `${request.distanciaKm.toFixed(1)} km` : '—'}
            </Text>
          </View>
        </View>

        {/* Título */}
        <Text style={styles.cardTitle} numberOfLines={2}>{request.titulo || 'Solicitud de limpieza'}</Text>

        {/* Dirección */}
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={13} color={PROF.textMuted} />
          <Text style={styles.addressText} numberOfLines={1}>{request.direccion || 'Sin dirección'}</Text>
        </View>

        {/* Separator */}
        <View style={styles.sep} />

        {/* Meta row */}
        <View style={styles.metaRow}>
          {request.fechaServicio ? (
            <View style={styles.metaChip}>
              <Ionicons name="calendar-outline" size={12} color={PROF.textMuted} />
              <Text style={styles.metaText}>{formatDate(request.fechaServicio)}</Text>
            </View>
          ) : null}
          {request.horaInicio ? (
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={12} color={PROF.textMuted} />
              <Text style={styles.metaText}>{request.horaInicio.substring(0, 5)}</Text>
            </View>
          ) : null}
          {offersCount > 0 && (
            <View style={[styles.metaChip, styles.metaChipWarning]}>
              <Ionicons name="people-outline" size={12} color={PROF.warning} />
              <Text style={[styles.metaText, { color: PROF.warning }]}>{offersCount} ofertas</Text>
            </View>
          )}
        </View>

        {/* Footer: precio + CTA */}
        <View style={styles.cardFooter}>
          <View>
            {request.precioMaximo ? (
              <>
                <Text style={styles.priceLabel}>Presupuesto máx.</Text>
                <Text style={styles.priceValue}>${Number(request.precioMaximo).toLocaleString()}</Text>
              </>
            ) : (
              <Text style={styles.priceLabel}>Precio libre</Text>
            )}
          </View>
          <LinearGradient
            colors={[PROF.accent, '#2a9d99']}
            style={styles.ctaBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.ctaText}>Ofertar</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AvailableRequestsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { location, getCurrentLocation } = useLocation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchRequests = useCallback(async (pageNum = 0, append = false) => {
    try {
      let activeLocation = location;
      if (!activeLocation?.coords?.latitude && getCurrentLocation) {
        const fresh = await getCurrentLocation();
        if (fresh) activeLocation = { coords: fresh };
      }

      let lat = activeLocation?.coords?.latitude ?? activeLocation?.latitude ?? 6.2442;
      let lng = activeLocation?.coords?.longitude ?? activeLocation?.longitude ?? -75.5812;

      // Si las coordenadas quedaron por error en Bogotá (lat < 5.5), reubicar en Medellín
      if (lat < 5.5) {
        lat = 6.2442;
        lng = -75.5812;
      }

      if (__DEV__) {
        console.log(`📡 [AvailableRequests] Consultando radar ${SEARCH_RADIUS_KM}km en Medellín:`, lat, lng);
      }

      const { data } = await apiClient.get('/solicitudes/cercanas', {
        params: { latitud: lat, longitud: lng, radioKm: SEARCH_RADIUS_KM, page: pageNum, size: 20 },
      });
      const content = Array.isArray(data) ? data : data?.content ?? [];

      setRequests(append ? (prev) => [...prev, ...content] : content);
      setHasMore(data.last === false);
      setPage(pageNum);
    } catch {
      if (!append) Alert.alert('Error', 'No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location, getCurrentLocation]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  return (
    <LinearGradient colors={['#000F22', '#001B38']} style={{ flex: 1 }}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Solicitudes cercanas</Text>
          <Text style={styles.headerSub}>
            {loading ? 'Buscando...' : `${requests.length} disponible${requests.length !== 1 ? 's' : ''} · ${SEARCH_RADIUS_KM} km`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => { setRefreshing(true); fetchRequests(0); }}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={20} color={PROF.accent} />
        </TouchableOpacity>
      </Animated.View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PROF.accent} />
          <Text style={styles.loadingText}>Buscando solicitudes cercanas...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <RequestCard
              request={item}
              index={index}
              onPress={(r) => navigation.navigate('SendOffer', { solicitud: r })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchRequests(0); }}
              tintColor={PROF.accent}
            />
          }
          onEndReached={() => { if (hasMore && !loading) fetchRequests(page + 1, true); }}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="navigate-outline" size={40} color={PROF.accent} />
              </View>
              <Text style={styles.emptyTitle}>Sin solicitudes a {SEARCH_RADIUS_KM} km</Text>
              <Text style={styles.emptyDesc}>
                {location?.coords?.latitude
                  ? `Tu GPS: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}\n\nCuando el cliente cree una solicitud desde su celular en esta zona, aparecerá aquí inmediatamente.`
                  : `Buscando solicitudes en un radio de ${SEARCH_RADIUS_KM} km...`}
              </Text>
              <TouchableOpacity
                style={styles.gpsSyncBtn}
                onPress={async () => {
                  setRefreshing(true);
                  if (getCurrentLocation) await getCurrentLocation();
                  fetchRequests(0);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={16} color="#001B38" />
                <Text style={styles.gpsSyncText}>Actualizar mi GPS</Text>
              </TouchableOpacity>
            </Animated.View>
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: PROF.glassBorder,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
    color: PROF.textPrimary,
  },
  headerSub: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textMuted,
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PROF.glass,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },

  // Card
  card: {
    backgroundColor: PROF.glass,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: 0,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tipoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  tipoText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(73,192,188,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  distanceText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    color: PROF.accent,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
    color: PROF.textPrimary,
    marginBottom: 5,
    lineHeight: 21,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addressText: {
    flex: 1,
    fontSize: TYPOGRAPHY.xs,
    color: PROF.textMuted,
  },
  sep: {
    height: 1,
    backgroundColor: PROF.glassBorder,
    marginVertical: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  metaChipWarning: {
    backgroundColor: 'rgba(245,166,35,0.1)',
  },
  metaText: {
    fontSize: 11,
    color: PROF.textMuted,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 10,
    color: PROF.textMuted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: PROF.accent,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.full,
  },
  ctaText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
    color: '#fff',
  },

  // Loading / empty
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: PROF.glass,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    color: PROF.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  gpsSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PROF.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 16,
  },
  gpsSyncText: {
    color: '#001B38',
    fontWeight: '700',
    fontSize: TYPOGRAPHY.sm,
  },
});
