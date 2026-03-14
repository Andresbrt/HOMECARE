import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../services/apiClient';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

const ESTADO_CONFIG = {
  CONFIRMADO: { label: 'Confirmado', icon: 'checkmark-circle', color: COLORS.info, step: 0 },
  EN_CAMINO: { label: 'En camino', icon: 'car', color: COLORS.warning, step: 1 },
  LLEGUE: { label: 'Llegó', icon: 'location', color: COLORS.accent, step: 2 },
  EN_PROGRESO: { label: 'En progreso', icon: 'construct', color: COLORS.accent, step: 3 },
  COMPLETADO: { label: 'Completado', icon: 'checkmark-done-circle', color: COLORS.success, step: 4 },
  CANCELADO: { label: 'Cancelado', icon: 'close-circle', color: COLORS.error, step: -1 },
};

const STEPS = ['CONFIRMADO', 'EN_CAMINO', 'LLEGUE', 'EN_PROGRESO', 'COMPLETADO'];

export default function ServiceTrackingScreen({ route, navigation }) {
  const { servicioId } = route.params || {};
  const [service, setService] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [svcRes, trackRes] = await Promise.all([
        apiClient.get(`/servicios/${servicioId}`),
        apiClient.get(`/location/tracking/${servicioId}`).catch(() => ({ data: null })),
      ]);
      setService(svcRes.data);
      setTracking(trackRes.data);
    } catch (error) {
      if (!refreshing) Alert.alert('Error', 'No se pudo cargar el seguimiento.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [servicioId, refreshing]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 15s for active services
  useEffect(() => {
    if (!service || service.estado === 'COMPLETADO' || service.estado === 'CANCELADO') return;
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [service, fetchData]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Servicio no encontrado</Text>
      </SafeAreaView>
    );
  }

  const estadoInfo = ESTADO_CONFIG[service.estado] || ESTADO_CONFIG.CONFIRMADO;
  const currentStep = estadoInfo.step;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seguimiento</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: estadoInfo.color }]}>
          <Ionicons name={estadoInfo.icon} size={28} color={COLORS.white} />
          <Text style={styles.statusLabel}>{estadoInfo.label}</Text>
        </View>

        {/* Provider card */}
        <View style={styles.card}>
          <View style={styles.providerRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={COLORS.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.providerName}>{service.proveedorNombre}</Text>
              {service.proveedorTelefono && (
                <Text style={styles.providerPhone}>{service.proveedorTelefono}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => navigation.navigate('Chat', { solicitudId: service.solicitudId })}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.accent} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText} numberOfLines={2}>{service.direccion}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="cash-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>${Number(service.precioAcordado).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Tracking info */}
        {tracking?.ubicacionActual && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ubicación del profesional</Text>
            <View style={styles.trackingInfo}>
              {tracking.ubicacionActual.distanciaDestinoKm != null && (
                <View style={styles.trackItem}>
                  <Ionicons name="navigate" size={20} color={COLORS.accent} />
                  <Text style={styles.trackValue}>{tracking.ubicacionActual.distanciaDestinoKm.toFixed(1)} km</Text>
                  <Text style={styles.trackLabel}>de distancia</Text>
                </View>
              )}
              {tracking.ubicacionActual.tiempoEstimadoMinutos != null && (
                <View style={styles.trackItem}>
                  <Ionicons name="time" size={20} color={COLORS.warning} />
                  <Text style={styles.trackValue}>{tracking.ubicacionActual.tiempoEstimadoMinutos} min</Text>
                  <Text style={styles.trackLabel}>estimado</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progreso</Text>
          {service.estado === 'CANCELADO' ? (
            <View style={styles.cancelledBox}>
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
              <Text style={styles.cancelledText}>Servicio cancelado</Text>
              {service.motivoCancelacion && <Text style={styles.cancelReason}>{service.motivoCancelacion}</Text>}
            </View>
          ) : (
            STEPS.map((step, i) => {
              const cfg = ESTADO_CONFIG[step];
              const reached = currentStep >= cfg.step;
              const isCurrent = currentStep === cfg.step;
              const timestamp = step === 'CONFIRMADO' ? service.confirmadoAt
                : step === 'EN_CAMINO' ? service.enCaminoAt
                : step === 'LLEGUE' ? service.llegueAt
                : step === 'EN_PROGRESO' ? service.iniciadoAt
                : service.completadoAt;

              return (
                <View key={step} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.dot, reached && { backgroundColor: cfg.color }, isCurrent && styles.dotCurrent]} />
                    {i < STEPS.length - 1 && <View style={[styles.line, reached && { backgroundColor: cfg.color }]} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineLabel, reached && { color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.semibold }]}>
                      {cfg.label}
                    </Text>
                    {timestamp && <Text style={styles.timelineTime}>{new Date(timestamp).toLocaleTimeString()}</Text>}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  headerTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.bold, color: COLORS.textPrimary },
  errorText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.md },
  statusBanner: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  statusLabel: { color: COLORS.white, fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.bold },
  card: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.sm },
  cardTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  providerName: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.semibold, color: COLORS.textPrimary },
  providerPhone: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary },
  chatBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.backgroundSecondary, justifyContent: 'center', alignItems: 'center' },
  infoRow: { marginTop: SPACING.md, gap: SPACING.sm },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  infoText: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, flex: 1 },
  trackingInfo: { flexDirection: 'row', gap: SPACING.xl },
  trackItem: { alignItems: 'center', gap: 4 },
  trackValue: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.bold, color: COLORS.textPrimary },
  trackLabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary },
  timelineItem: { flexDirection: 'row', minHeight: 50 },
  timelineLeft: { width: 30, alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.border },
  dotCurrent: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: COLORS.white },
  line: { flex: 1, width: 2, backgroundColor: COLORS.border },
  timelineContent: { flex: 1, paddingBottom: SPACING.md, paddingLeft: SPACING.sm },
  timelineLabel: { fontSize: TYPOGRAPHY.sm, color: COLORS.textDisabled },
  timelineTime: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary, marginTop: 2 },
  cancelledBox: { alignItems: 'center', gap: SPACING.sm, padding: SPACING.md },
  cancelledText: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.semibold, color: COLORS.error },
  cancelReason: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, textAlign: 'center' },
});
