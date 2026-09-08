/**
 * ActiveServiceTrackingScreen — Pantalla de servicio activo y navegación para el profesional
 * Homecare 2026 — Monitoreo en vivo, control de estados (En camino -> Llegué -> En progreso -> Completado)
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';

import { PROF, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import GlassCard from '../../components/shared/GlassCard';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import useActiveServiceStore from '../../store/activeServiceStore';

const { width } = Dimensions.get('window');

// Configuración visual por estado
const ESTADOS = {
  CONFIRMADO: {
    label: 'Confirmado',
    badgeColor: '#3B82F6',
    icon: 'checkmark-circle-outline',
    nextAction: 'EN_CAMINO',
    actionLabel: '🚀 Iniciar viaje (Voy en camino)',
    actionColors: ['#0E4D68', '#49C0BC'],
    autoMsg: '🚗 ¡Hola! Ya voy en camino a tu dirección.',
    step: 0,
  },
  EN_CAMINO: {
    label: 'En camino al domicilio',
    badgeColor: '#F59E0B',
    icon: 'car-outline',
    nextAction: 'LLEGUE',
    actionLabel: '📍 ¡He llegado al domicilio!',
    actionColors: ['#49C0BC', '#00D09E'],
    autoMsg: '📍 ¡He llegado a tu dirección! Ya me encuentro afuera del domicilio.',
    step: 1,
  },
  LLEGUE: {
    label: 'En el domicilio',
    badgeColor: '#10B981',
    icon: 'location-outline',
    nextAction: 'EN_PROGRESO',
    actionLabel: '🧹 Iniciar labores del servicio',
    actionColors: ['#2563EB', '#1D4ED8'],
    autoMsg: '🧹 He comenzado las labores del servicio contratado.',
    step: 2,
  },
  EN_PROGRESO: {
    label: 'Servicio en progreso',
    badgeColor: '#8B5CF6',
    icon: 'construct-outline',
    nextAction: 'COMPLETADO',
    actionLabel: '✅ Finalizar servicio',
    actionColors: ['#10B981', '#059669'],
    autoMsg: '✨ He finalizado el servicio. ¡Muchas gracias por tu confianza!',
    step: 3,
  },
  COMPLETADO: {
    label: 'Completado',
    badgeColor: '#10B981',
    icon: 'checkmark-done-circle',
    step: 4,
  },
};

export default function ActiveServiceTrackingScreen({ route, navigation }) {
  const { user } = useAuth();
  const { location } = useLocation();
  const { activeService, updateEstado, clearActiveService, fetchActiveService } = useActiveServiceStore();

  const service = route.params?.service || activeService;
  const mapRef = useRef(null);

  const [currentStatus, setCurrentStatus] = useState(service?.estado || 'CONFIRMADO');
  const [updating, setUpdating] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Coordenadas actuales del profesional (con fallback a Medellín centro si GPS no está disponible)
  const proCoords = useMemo(() => {
    const lat = location?.coords?.latitude ?? location?.latitude ?? 6.2442;
    const lng = location?.coords?.longitude ?? location?.longitude ?? -75.5812;
    return { latitude: Number(lat), longitude: Number(lng) };
  }, [location]);

  // Coordenadas del cliente / destino
  const destCoords = useMemo(() => {
    const lat = Number(service?.latitud || 6.2482);
    const lng = Number(service?.longitud || -75.5742);
    return { latitude: lat, longitude: lng };
  }, [service]);

  // Calcular distancia euclidiana aproximada
  const distanceKm = useMemo(() => {
    const dLat = (destCoords.latitude - proCoords.latitude) * 111;
    const dLng = (destCoords.longitude - proCoords.longitude) * 111 * Math.cos((proCoords.latitude * Math.PI) / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    return Math.max(0.2, Number(dist.toFixed(1)));
  }, [proCoords, destCoords]);

  // Tiempo estimado en minutos (promedio urbano Medellín: ~3.5 min/km)
  const etaMinutes = useMemo(() => {
    return Math.max(2, Math.round(distanceKm * 3.5));
  }, [distanceKm]);

  // Animación de pulso para el botón "He llegado"
  const pulseAnim = useSharedValue(1);
  useEffect(() => {
    if (currentStatus === 'EN_CAMINO') {
      pulseAnim.value = withRepeat(
        withSequence(withTiming(1.04, { duration: 700 }), withTiming(1, { duration: 700 })),
        -1,
        true
      );
    } else {
      pulseAnim.value = withTiming(1);
    }
  }, [currentStatus]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  // Temporizador para estado EN_PROGRESO
  useEffect(() => {
    let interval = null;
    if (currentStatus === 'EN_PROGRESO') {
      interval = setInterval(() => {
        setTimerSeconds((sec) => sec + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStatus]);

  // Formato del cronómetro
  const formattedTimer = useMemo(() => {
    const hrs = Math.floor(timerSeconds / 3600);
    const mins = Math.floor((timerSeconds % 3600) / 60);
    const secs = timerSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timerSeconds]);

  // Ajustar la cámara del mapa al montar
  useEffect(() => {
    if (mapRef.current && proCoords && destCoords) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates([proCoords, destCoords], {
          edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
          animated: true,
        });
      }, 600);
    }
  }, [proCoords, destCoords]);

  // Enviar ubicación en tiempo real al backend si está en camino
  useEffect(() => {
    if (currentStatus !== 'EN_CAMINO' || !service?.id) return;

    const sendTrackingPing = async () => {
      try {
        await apiClient.post('/location/tracking/update', {
          servicioId: service.id,
          latitud: proCoords.latitude,
          longitud: proCoords.longitude,
        });
      } catch (_) {
        // Silencioso
      }
    };

    sendTrackingPing();
    const interval = setInterval(sendTrackingPing, 20000);
    return () => clearInterval(interval);
  }, [currentStatus, service?.id, proCoords]);

  // Sincronizar estado local con el store
  useEffect(() => {
    if (service?.estado) {
      setCurrentStatus(service.estado);
    }
  }, [service?.estado]);

  // Abrir GPS Externo (Google Maps / Waze)
  const handleOpenExternalGPS = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const label = encodeURIComponent(service?.direccion || 'Destino del cliente');
    const lat = destCoords.latitude;
    const lng = destCoords.longitude;

    Alert.alert('Selecciona tu app de navegación', '¿Cómo prefieres llegar?', [
      {
        text: 'Google Maps',
        onPress: () => {
          const url = Platform.select({
            ios: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
            android: `google.navigation:q=${lat},${lng}&mode=d`,
          });
          Linking.canOpenURL(url).then((supported) => {
            if (supported) Linking.openURL(url);
            else Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
          });
        },
      },
      {
        text: 'Waze',
        onPress: () => {
          const url = `waze://?ll=${lat},${lng}&navigate=yes`;
          Linking.canOpenURL(url).then((supported) => {
            if (supported) Linking.openURL(url);
            else Linking.openURL(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`);
          });
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  // Enviar mensaje automático al chat
  const sendAutoChatMessage = async (msgText) => {
    if (!service?.solicitudId && !service?.id) return;
    try {
      await apiClient.post('/mensajes', {
        solicitudId: service.solicitudId || service.id,
        destinatarioId: service.clienteId,
        contenido: msgText,
        tipoMensaje: 'TEXTO',
      });
    } catch (_) {
      // Ignorar si el chat no está disponible
    }
  };

  // Manejador del avance de estado
  const handleAdvanceStatus = async () => {
    const config = ESTADOS[currentStatus];
    if (!config?.nextAction) return;

    const nextState = config.nextAction;

    // Confirmación especial para finalizar
    if (nextState === 'COMPLETADO') {
      Alert.alert(
        '¿Finalizar el servicio?',
        'Confirma que has completado todas las labores acordadas para que el cliente pueda calificar y liberar el pago.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sí, finalizar servicio',
            style: 'destructive',
            onPress: () => executeStatusChange(nextState, config.autoMsg),
          },
        ]
      );
      return;
    }

    executeStatusChange(nextState, config.autoMsg);
  };

  const executeStatusChange = async (nextState, autoMessage) => {
    setUpdating(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const servicioId = service?.id || service?.solicitudId;
      const res = await updateEstado(servicioId, nextState);

      if (res.ok) {
        setCurrentStatus(nextState);

        // Enviar mensaje automático al cliente por chat
        if (autoMessage) {
          sendAutoChatMessage(autoMessage);
        }

        if (nextState === 'LLEGUE') {
          Alert.alert(
            '¡Llegada confirmada! 📍',
            'Se ha notificado al cliente que ya te encuentras en la puerta del domicilio.'
          );
        } else if (nextState === 'COMPLETADO') {
          Alert.alert(
            '¡Excelente trabajo! 🎉',
            'El servicio ha sido completado. El cliente procederá a calificar tu atención.',
            [
              {
                text: 'Volver al Inicio',
                onPress: () => {
                  clearActiveService();
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                  });
                },
              },
            ]
          );
        }
      } else {
        Alert.alert('Aviso', res.error || 'No se pudo actualizar el estado.');
      }
    } catch (err) {
      Alert.alert('Error', 'Hubo un inconveniente al actualizar el estado.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCallClient = () => {
    if (service?.clienteTelefono) {
      const phoneUrl = `tel:${service.clienteTelefono}`;
      Linking.canOpenURL(phoneUrl)
        .then((supported) => {
          if (supported) Linking.openURL(phoneUrl);
          else Alert.alert('Llamada telefónica', `Número del cliente: ${service.clienteTelefono}`);
        })
        .catch(() => {
          Alert.alert('Llamada telefónica', `Número del cliente: ${service.clienteTelefono}`);
        });
    } else {
      Alert.alert('Contacto', 'El número de teléfono del cliente no está visible.');
    }
  };

  const handleOpenChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Chat', {
      solicitudId: service?.solicitudId || service?.id,
      destinatarioId: service?.clienteId,
      titulo: service?.clienteNombre || 'Cliente',
    });
  };

  const currentCfg = ESTADOS[currentStatus] || ESTADOS.CONFIRMADO;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000F22" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color={PROF.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Seguimiento en Vivo</Text>
          <View style={styles.liveIndicatorRow}>
            <View style={[styles.pulseDot, { backgroundColor: currentCfg.badgeColor }]} />
            <Text style={[styles.headerSub, { color: currentCfg.badgeColor }]}>
              {currentCfg.label.toUpperCase()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerChatBtn}
          onPress={handleOpenChat}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chatbubble-ellipses" size={22} color={PROF.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── MAPA INTERACTIVO ── */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={Platform.OS === 'android' ? 'google' : undefined}
            style={styles.map}
            initialRegion={{
              latitude: proCoords.latitude,
              longitude: proCoords.longitude,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
            showsCompass={false}
            showsScale={false}
          >
            {/* Marcador Profesional */}
            <Marker coordinate={proCoords} title="Tu ubicación" pinColor="#49C0BC">
              <View style={styles.proMarker}>
                <Ionicons name="car" size={18} color="#fff" />
              </View>
            </Marker>

            {/* Marcador Destino / Cliente */}
            <Marker
              coordinate={destCoords}
              title={service?.clienteNombre || 'Cliente'}
              description={service?.direccion || 'Destino'}
            >
              <View style={styles.destMarker}>
                <Ionicons name="home" size={18} color="#fff" />
              </View>
            </Marker>

            {/* Línea de ruta */}
            <Polyline
              coordinates={[proCoords, destCoords]}
              strokeColor="#49C0BC"
              strokeWidth={3.5}
              lineDashPattern={[2, 2]}
            />
          </MapView>

          {/* Botón flotante para abrir en Waze / Google Maps */}
          <TouchableOpacity
            style={styles.floatingGpsBtn}
            onPress={handleOpenExternalGPS}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#0E4D68', '#001B38']}
              style={styles.floatingGpsGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="navigate" size={16} color={PROF.accent} />
              <Text style={styles.floatingGpsText}>Abrir GPS Externo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── BARRA DE MÉTRICAS DEL VIAJE ── */}
        <View style={styles.metricsBar}>
          <View style={styles.metricItem}>
            <Ionicons name="navigate-outline" size={18} color={PROF.accent} />
            <Text style={styles.metricVal}>{distanceKm} km</Text>
            <Text style={styles.metricLbl}>Distancia</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Ionicons name="time-outline" size={18} color="#F59E0B" />
            <Text style={styles.metricVal}>~{etaMinutes} min</Text>
            <Text style={styles.metricLbl}>Tiempo est.</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Ionicons name="cash-outline" size={18} color="#10B981" />
            <Text style={styles.metricVal}>
              ${Number(service?.precioAcordado || 0).toLocaleString('es-CO')}
            </Text>
            <Text style={styles.metricLbl}>Total acordado</Text>
          </View>
        </View>

        {/* ── CRONÓMETRO DE SERVICIO (si está EN_PROGRESO) ── */}
        {currentStatus === 'EN_PROGRESO' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.timerBanner}>
            <Ionicons name="stopwatch-outline" size={24} color="#8B5CF6" />
            <View style={{ flex: 1 }}>
              <Text style={styles.timerTitle}>Tiempo en servicio</Text>
              <Text style={styles.timerSubtitle}>Cronómetro activo en el domicilio</Text>
            </View>
            <Text style={styles.timerCount}>{formattedTimer}</Text>
          </Animated.View>
        )}

        {/* ── BOTÓN DE ACCIÓN PRINCIPAL TÁCTIL ── */}
        {currentCfg.actionLabel && (
          <Animated.View style={[styles.actionBtnWrap, currentStatus === 'EN_CAMINO' && pulseStyle]}>
            <TouchableOpacity
              onPress={handleAdvanceStatus}
              disabled={updating}
              activeOpacity={0.88}
              style={styles.actionBtn}
            >
              <LinearGradient
                colors={currentCfg.actionColors}
                style={styles.actionGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name={currentCfg.icon} size={22} color="#fff" />
                    <Text style={styles.actionText}>{currentCfg.actionLabel}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── TARJETA DEL CLIENTE Y DIRECCIÓN ── */}
        <GlassCard variant="elevated" style={styles.clientCard}>
          <View style={styles.clientHeader}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientAvatarLetter}>
                {(service?.clienteNombre || 'C')[0].toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{service?.clienteNombre || 'Cliente'}</Text>
              <Text style={styles.serviceTitle}>
                {service?.solicitudTitulo || 'Servicio de Limpieza'}
              </Text>
            </View>
          </View>

          <View style={styles.addressBox}>
            <Ionicons name="location" size={20} color={PROF.accent} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.addressText}>{service?.direccion || 'Dirección en Medellín'}</Text>
              {service?.barrio && (
                <Text style={styles.barrioText}>Barrio: {service.barrio}</Text>
              )}
            </View>
          </View>

          {/* Botones de contacto directo */}
          <View style={styles.contactRow}>
            <TouchableOpacity
              style={[styles.contactBtn, styles.callBtn]}
              onPress={handleCallClient}
              activeOpacity={0.85}
            >
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.contactBtnText}>Llamar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactBtn, styles.chatBtn]}
              onPress={handleOpenChat}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble" size={18} color="#fff" />
              <Text style={styles.contactBtnText}>Chatear</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* ── BARRA DE PROGRESO DE ESTADOS ── */}
        <View style={styles.stepperCard}>
          <Text style={styles.stepperTitle}>Flujo del Servicio</Text>
          <View style={styles.stepperRow}>
            {['Confirmado', 'En camino', 'Llegué', 'En servicio', 'Fin'].map((stepLabel, idx) => {
              const isActive = currentCfg.step >= idx;
              const isCurrent = currentCfg.step === idx;
              return (
                <View key={stepLabel} style={styles.stepCol}>
                  <View
                    style={[
                      styles.stepCircle,
                      isActive && styles.stepCircleActive,
                      isCurrent && styles.stepCircleCurrent,
                    ]}
                  >
                    {isActive ? (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    ) : (
                      <Text style={styles.stepNumber}>{idx + 1}</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      isActive && styles.stepLabelActive,
                      isCurrent && { color: PROF.accent },
                    ]}
                  >
                    {stepLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000F22',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: PROF.border,
    backgroundColor: PROF.bgElevated,
  },
  backBtn: {
    padding: 6,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold,
    color: PROF.textPrimary,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerChatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(73, 192, 188, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(73, 192, 188, 0.3)',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mapContainer: {
    height: 240,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  proMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0E4D68',
    borderWidth: 2,
    borderColor: '#49C0BC',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  destMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00D09E',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  floatingGpsBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  floatingGpsGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: PROF.border,
    borderRadius: BORDER_RADIUS.full,
  },
  floatingGpsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: PROF.bgElevated,
    marginHorizontal: SPACING.md,
    marginTop: -16,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: PROF.border,
    ...SHADOWS.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: PROF.textPrimary,
    marginTop: 3,
  },
  metricLbl: {
    fontSize: 11,
    color: PROF.textMuted,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: PROF.border,
  },
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    gap: 12,
  },
  timerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DDD6FE',
  },
  timerSubtitle: {
    fontSize: 11,
    color: '#A78BFA',
  },
  timerCount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F5F3FF',
    fontVariant: ['tabular-nums'],
  },
  actionBtnWrap: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  actionBtn: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  actionGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  actionText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  clientCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.md,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0E4D68',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: PROF.accent,
  },
  clientAvatarLetter: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '800',
    color: PROF.textPrimary,
  },
  serviceTitle: {
    fontSize: 13,
    color: PROF.textMuted,
    marginTop: 2,
  },
  addressBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(0, 27, 56, 0.5)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: PROF.border,
    marginBottom: SPACING.md,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '600',
    color: PROF.textPrimary,
  },
  barrioText: {
    fontSize: 12,
    color: PROF.accent,
    marginTop: 2,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
    gap: 8,
  },
  callBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  chatBtn: {
    backgroundColor: 'rgba(73, 192, 188, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(73, 192, 188, 0.4)',
  },
  contactBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepperCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    backgroundColor: PROF.bgElevated,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: PROF.border,
  },
  stepperTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PROF.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepCol: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: PROF.accent,
  },
  stepCircleCurrent: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  stepNumber: {
    fontSize: 11,
    color: PROF.textMuted,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 10,
    color: PROF.textMuted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: PROF.textPrimary,
    fontWeight: '700',
  },
});
