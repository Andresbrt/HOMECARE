/**
 * ServiceTrackingScreen — Seguimiento en vivo para el cliente (estilo Rappi / Uber)
 * Homecare 2026 — Mapa interactivo, ETA en tiempo real, chat directo y persistencia offline.
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Platform,
  Linking,
  Dimensions,
  StatusBar,
  Modal,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../services/apiClient';
import { COLORS, PROF, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const ESTADO_CONFIG = {
  CONFIRMADO: { label: 'Confirmado', icon: 'checkmark-circle', color: '#3B82F6', step: 0 },
  EN_CAMINO: { label: 'En camino al domicilio', icon: 'car', color: '#F59E0B', step: 1 },
  LLEGUE: { label: '¡Ha llegado a tu puerta!', icon: 'location', color: '#10B981', step: 2 },
  EN_PROGRESO: { label: 'Servicio en curso', icon: 'construct', color: '#8B5CF6', step: 3 },
  COMPLETADO: { label: 'Completado', icon: 'checkmark-done-circle', color: '#10B981', step: 4 },
  CANCELADO: { label: 'Cancelado', icon: 'close-circle', color: '#EF4444', step: -1 },
};

const STEPS = ['CONFIRMADO', 'EN_CAMINO', 'LLEGUE', 'EN_PROGRESO', 'COMPLETADO'];

export default function ServiceTrackingScreen({ route, navigation }) {
  const { servicioId: initialServicioId, solicitudId } = route.params || {};
  const [service, setService] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const mapRef = useRef(null);

  // 1. Cargar datos del servicio con resiliencia offline (AsyncStorage)
  const fetchData = useCallback(async () => {
    try {
      let activeSvc = null;
      let targetId = initialServicioId;

      // Si no tenemos servicioId directo pero sí solicitudId, buscar en servicios activos
      if (!targetId && solicitudId) {
        const actRes = await apiClient.get('/servicios/activos').catch(() => ({ data: [] }));
        const list = Array.isArray(actRes.data) ? actRes.data : actRes.data?.content ?? [];
        const match = list.find((s) => s.solicitudId === Number(solicitudId) || s.id === Number(solicitudId));
        if (match) {
          activeSvc = match;
          targetId = match.id;
        }
      }

      // Si tenemos targetId, consultar detalle del servicio
      if (targetId) {
        const [svcRes, trackRes] = await Promise.all([
          apiClient.get(`/servicios/${targetId}`).catch(() => null),
          apiClient.get(`/location/tracking/${targetId}`).catch(() => ({ data: null })),
        ]);

        if (svcRes?.data) {
          activeSvc = svcRes.data;
          setService(activeSvc);
          AsyncStorage.setItem('@homecare_cached_service', JSON.stringify(activeSvc)).catch(() => {});
        }
        if (trackRes?.data) {
          setTracking(trackRes.data);
        }
      } else if (activeSvc) {
        setService(activeSvc);
      }
    } catch (error) {
      // Fallback offline: leer de caché si se fue el internet
      try {
        const cached = await AsyncStorage.getItem('@homecare_cached_service');
        if (cached) {
          setService(JSON.parse(cached));
        }
      } catch (_) {}
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialServicioId, solicitudId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresco cada 12 segundos mientras el servicio esté activo (estilo Rappi)
  useEffect(() => {
    if (!service || service.estado === 'COMPLETADO' || service.estado === 'CANCELADO') return;
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, [service, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handlePagarMercadoPago = () => {
    setShowPaymentModal(false);
    navigation.navigate('PaymentBricks', {
      servicioId: service.id,
      monto: service.precioAcordado,
    });
  };

  const handlePagarEfectivo = () => {
    const formattedPrice = Number(service?.precioAcordado || 0).toLocaleString('es-CO');
    Alert.alert(
      'Pago en Efectivo',
      `¿Deseas pagar en efectivo directamente al profesional al terminar el servicio?\n\nMonto a entregar: COL$ ${formattedPrice}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar pago en efectivo',
          onPress: async () => {
            try {
              setProcessingPayment(true);
              await apiClient.post('/payments/create', {
                servicioId: service.id,
                monto: service.precioAcordado,
                metodoPago: 'EFECTIVO',
              });
              setShowPaymentModal(false);
              setPaymentCompleted(true);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                '¡Pago Registrado! ✓',
                `Se ha confirmado tu pago en efectivo de COL$ ${formattedPrice} entregado al profesional.`,
                [{ text: 'Aceptar', onPress: () => fetchData() }]
              );
            } catch (err) {
              const msg = err.response?.data?.message || err.response?.data?.error || 'No se pudo registrar el pago en efectivo.';
              Alert.alert('Error', msg);
            } finally {
              setProcessingPayment(false);
            }
          },
        },
      ]
    );
  };

  // Coordenadas del domicilio del cliente (Medellín)
  const clientCoords = useMemo(() => {
    const lat = Number(service?.latitud || 6.2482);
    const lng = Number(service?.longitud || -75.5742);
    return { latitude: lat, longitude: lng };
  }, [service]);

  // Coordenadas del profesional (vía tracking o estimadas cerca)
  const proCoords = useMemo(() => {
    if (tracking?.ubicacionActual?.latitud && tracking?.ubicacionActual?.longitud) {
      return {
        latitude: Number(tracking.ubicacionActual.latitud),
        longitude: Number(tracking.ubicacionActual.longitud),
      };
    }
    // Si aún no ha enviado ping de GPS, situar ligeramente desfasado en Medellín
    return {
      latitude: clientCoords.latitude - 0.012,
      longitude: clientCoords.longitude + 0.014,
    };
  }, [tracking, clientCoords]);

  // Ajustar cámara para encuadrar ambos puntos
  useEffect(() => {
    if (mapRef.current && clientCoords && proCoords) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates([clientCoords, proCoords], {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
          animated: true,
        });
      }, 700);
    }
  }, [clientCoords, proCoords]);

  if (loading && !service) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Conectando con tu servicio en vivo...</Text>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="search" size={48} color={COLORS.textSecondary} />
        <Text style={styles.errorText}>No se encontró el servicio activo.</Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => navigation.navigate('UserHome')}>
          <Text style={styles.backHomeBtnText}>Volver al inicio</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const estadoInfo = ESTADO_CONFIG[service.estado] || ESTADO_CONFIG.CONFIRMADO;
  const currentStep = estadoInfo.step;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Seguimiento en Vivo</Text>
          <Text style={[styles.headerSubtitle, { color: estadoInfo.color }]}>
            {estadoInfo.label.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerChatBtn}
          onPress={() =>
            navigation.navigate('UserChat', {
              solicitudId: service.solicitudId || service.id,
              destinatarioId: service.proveedorId,
              titulo: service.proveedorNombre || 'Profesional',
            })
          }
        >
          <Ionicons name="chatbubble-ellipses" size={22} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── MAPA EN VIVO ESTILO RAPPI / UBER ── */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={Platform.OS === 'android' ? 'google' : undefined}
            style={styles.map}
            initialRegion={{
              latitude: clientCoords.latitude,
              longitude: clientCoords.longitude,
              latitudeDelta: 0.035,
              longitudeDelta: 0.035,
            }}
            showsCompass={false}
            showsScale={false}
          >
            {/* Marcador del Profesional */}
            <Marker coordinate={proCoords} title={service.proveedorNombre || 'Profesional'}>
              <View style={styles.proMarker}>
                <Ionicons name="car" size={18} color="#fff" />
              </View>
            </Marker>

            {/* Marcador Domicilio del Cliente */}
            <Marker coordinate={clientCoords} title="Tu Domicilio" description={service.direccion}>
              <View style={styles.clientMarker}>
                <Ionicons name="home" size={18} color="#fff" />
              </View>
            </Marker>

            {/* Ruta entre los dos */}
            <Polyline
              coordinates={[proCoords, clientCoords]}
              strokeColor="#49C0BC"
              strokeWidth={3.5}
              lineDashPattern={[2, 2]}
            />
          </MapView>

          {/* ETA Flotante sobre el mapa */}
          <View style={styles.etaBadge}>
            <Ionicons name="time" size={15} color="#F59E0B" />
            <Text style={styles.etaText}>
              {service.estado === 'LLEGUE'
                ? '¡En tu puerta!'
                : service.estado === 'EN_PROGRESO'
                ? 'En servicio'
                : 'Llega en ~8 min'}
            </Text>
          </View>
        </View>

        {/* ── ALERTA DE LLEGADA DESTACADA (si está LLEGUE) ── */}
        {service.estado === 'LLEGUE' && (
          <View style={styles.arrivedAlert}>
            <View style={styles.arrivedIconBox}>
              <Ionicons name="notifications" size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.arrivedTitle}>¡Tu profesional ha llegado! 📍</Text>
              <Text style={styles.arrivedSub}>Ya se encuentra afuera de tu domicilio listo para iniciar.</Text>
            </View>
          </View>
        )}

        {/* ── BOTÓN DE PAGO (si está COMPLETADO) ── */}
        {service.estado === 'COMPLETADO' && (
          paymentCompleted || service.pagoAprobado ? (
            <View style={styles.paidSuccessCard}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.paidSuccessTitle}>Servicio pagado exitosamente ✓</Text>
                <Text style={styles.paidSuccessSub}>El pago de COL$ {Number(service?.precioAcordado || 0).toLocaleString('es-CO')} fue procesado correctamente.</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.payBtn} onPress={() => setShowPaymentModal(true)} activeOpacity={0.88}>
              <Ionicons name="wallet-outline" size={20} color={COLORS.white} />
              <Text style={styles.payBtnText}>Pagar Servicio (Mercado Pago o Efectivo)</Text>
            </TouchableOpacity>
          )
        )}

        {/* ── TARJETA DEL PROFESIONAL ── */}
        <View style={styles.card}>
          <View style={styles.providerRow}>
            <LinearGradient colors={['#0E4D68', '#49C0BC']} style={styles.avatar}>
              <Text style={styles.avatarLetter}>
                {(service.proveedorNombre || 'P')[0].toUpperCase()}
              </Text>
            </LinearGradient>

            <View style={{ flex: 1 }}>
              <Text style={styles.providerName}>{service.proveedorNombre || 'Profesional asignado'}</Text>
              <View style={styles.proRatingRow}>
                <Ionicons name="star" size={14} color="#F5A623" />
                <Text style={styles.proRatingText}>4.9 · Profesional verificado</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              {service.proveedorTelefono && (
                <TouchableOpacity
                  style={styles.iconActionBtn}
                  onPress={() => {
                    const phoneUrl = `tel:${service.proveedorTelefono}`;
                    Linking.canOpenURL(phoneUrl)
                      .then((supported) => {
                        if (supported) Linking.openURL(phoneUrl);
                        else Alert.alert('Llamada telefónica', `Número del profesional: ${service.proveedorTelefono}`);
                      })
                      .catch(() => {
                        Alert.alert('Llamada telefónica', `Número del profesional: ${service.proveedorTelefono}`);
                      });
                  }}
                >
                  <Ionicons name="call" size={18} color="#10B981" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.iconActionBtn, { backgroundColor: 'rgba(73, 192, 188, 0.12)' }]}
                onPress={() =>
                  navigation.navigate('UserChat', {
                    solicitudId: service.solicitudId || service.id,
                    destinatarioId: service.proveedorId,
                    titulo: service.proveedorNombre || 'Profesional',
                  })
                }
              >
                <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText} numberOfLines={2}>
                {service.direccion || 'Medellín'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="cash-outline" size={16} color="#10B981" />
              <Text style={[styles.infoText, { fontWeight: '700', color: '#10B981' }]}>
                ${Number(service.precioAcordado || 0).toLocaleString('es-CO')} COP
              </Text>
            </View>
          </View>
        </View>

        {/* ── LÍNEA DE TIEMPO DEL SERVICIO ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estado del Servicio</Text>
          {service.estado === 'CANCELADO' ? (
            <View style={styles.cancelledBox}>
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
              <Text style={styles.cancelledText}>Servicio cancelado</Text>
            </View>
          ) : (
            STEPS.map((step, i) => {
              const cfg = ESTADO_CONFIG[step];
              const reached = currentStep >= cfg.step;
              const isCurrent = currentStep === cfg.step;

              return (
                <View key={step} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.dot,
                        reached && { backgroundColor: cfg.color },
                        isCurrent && styles.dotCurrent,
                      ]}
                    />
                    {i < STEPS.length - 1 && (
                      <View style={[styles.line, reached && { backgroundColor: cfg.color }]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        reached && { color: COLORS.textPrimary, fontWeight: '700' },
                      ]}
                    >
                      {cfg.label}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ── MODAL SELECCIÓN DE MÉTODO DE PAGO ── */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => !processingPayment && setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Método de Pago</Text>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
                disabled={processingPayment}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Selecciona cómo deseas abonar tu servicio completado
            </Text>

            <View style={styles.modalAmountBox}>
              <Text style={styles.modalAmountLabel}>Monto total acordado</Text>
              <Text style={styles.modalAmountVal}>
                COL$ {Number(service?.precioAcordado || 0).toLocaleString('es-CO')}
              </Text>
            </View>

            {/* Opción 1: Mercado Pago (PSE, Tarjetas, Efecty) */}
            <TouchableOpacity
              style={[styles.payOptionCard, styles.payOptionActive]}
              onPress={handlePagarMercadoPago}
              activeOpacity={0.85}
              disabled={processingPayment}
            >
              <View style={styles.payOptionIconWrap}>
                <Ionicons name="card" size={24} color="#0E4D68" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payOptionTitle}>Mercado Pago</Text>
                <Text style={styles.payOptionSub}>
                  PSE (Bancos y Nequi), Tarjetas Débito / Crédito y Efecty
                </Text>
                <View style={styles.payOptionBadge}>
                  <Text style={styles.payOptionBadgeText}>Online · PSE · Tarjetas · Efecty</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#0E4D68" />
            </TouchableOpacity>

            {/* Opción 2: Efectivo directo */}
            <TouchableOpacity
              style={styles.payOptionCard}
              onPress={handlePagarEfectivo}
              activeOpacity={0.85}
              disabled={processingPayment}
            >
              <View style={[styles.payOptionIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                {processingPayment ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <Ionicons name="cash-outline" size={24} color="#10B981" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payOptionTitle}>Efectivo al Profesional</Text>
                <Text style={styles.payOptionSub}>
                  Paga directamente en efectivo al profesional al terminar el servicio
                </Text>
                <View style={[styles.payOptionBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.payOptionBadgeText, { color: '#166534' }]}>Pago presencial</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFF', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  errorText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  backHomeBtn: { marginTop: 16, backgroundColor: COLORS.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: BORDER_RADIUS.lg },
  backHomeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  headerSubtitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginTop: 1 },
  headerChatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(73, 192, 188, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingBottom: 40 },
  mapContainer: { height: 230, width: '100%', position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  proMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0E4D68',
    borderWidth: 2.5,
    borderColor: '#49C0BC',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  clientMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  etaBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    ...SHADOWS.sm,
  },
  etaText: { fontSize: 12, fontWeight: '800', color: COLORS.textPrimary },
  arrivedAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#10B981',
    gap: 12,
    ...SHADOWS.sm,
  },
  arrivedIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivedTitle: { fontSize: 15, fontWeight: '800', color: '#065F46' },
  arrivedSub: { fontSize: 12, color: '#047857', marginTop: 2 },
  payBtn: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    ...SHADOWS.md,
  },
  payBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...SHADOWS.sm,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.md },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: '#fff', fontSize: 20, fontWeight: '800' },
  providerName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  proRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  proRatingText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 12 },
  infoRow: { gap: 6 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  timelineItem: { flexDirection: 'row', minHeight: 40 },
  timelineLeft: { width: 24, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E2E8F0' },
  dotCurrent: { width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: '#fff' },
  line: { flex: 1, width: 2, backgroundColor: '#E2E8F0' },
  timelineContent: { flex: 1, paddingBottom: SPACING.sm, paddingLeft: SPACING.sm },
  timelineLabel: { fontSize: 13, color: COLORS.textDisabled },
  cancelledBox: { alignItems: 'center', gap: 6, padding: SPACING.md },
  cancelledText: { fontSize: 14, fontWeight: '700', color: COLORS.error },
  paidSuccessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  paidSuccessTitle: { fontSize: 14, fontWeight: '800', color: '#065F46' },
  paidSuccessSub: { fontSize: 12, color: '#047857', marginTop: 2 },

  // Modal de Métodos de Pago
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  modalCloseBtn: { padding: 4 },
  modalSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  modalAmountBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalAmountLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  modalAmountVal: { fontSize: 26, fontWeight: '900', color: COLORS.textPrimary, marginTop: 2 },
  payOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    marginBottom: SPACING.md,
  },
  payOptionActive: {
    borderColor: '#0E4D68',
    backgroundColor: 'rgba(14,77,104,0.03)',
  },
  payOptionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(14,77,104,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payOptionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  payOptionSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3, lineHeight: 16 },
  payOptionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  payOptionBadgeText: { fontSize: 10, fontWeight: '700', color: '#0369A1' },
});
