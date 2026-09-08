import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import GoogleMapView from '../../components/shared/GoogleMapView';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, PROF } from '../../constants/theme';

// ── Helpers Geográficos ───────────────────────────────────────────────────────

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calcularTiempoLlegadaMinutos(distanciaKm) {
  if (!distanciaKm || distanciaKm <= 0.3) return 5;
  // Tráfico urbano en Colombia: ~18-20 km/h promedio + 5 min alistamiento
  return Math.max(5, Math.round(distanciaKm * 3.2 + 5));
}

export default function SendOfferScreen({ route, navigation }) {
  const { solicitud } = route.params || {};
  const { user } = useAuth();
  const { location } = useLocation();

  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [ofertaEnviada, setOfertaEnviada] = useState(false);
  const [ofertaAceptada, setOfertaAceptada] = useState(false);
  const [datosAceptacion, setDatosAceptacion] = useState(null);

  const pollTimerRef = useRef(null);
  const mapRef = useRef(null);

  // Coordenadas seguras del servicio y del profesional
  const solLat = Number(solicitud?.latitud) || 6.29358;
  const solLng = Number(solicitud?.longitud) || -75.57859;

  const proLat = Number(location?.coords?.latitude || location?.latitude) || 6.29358;
  const proLng = Number(location?.coords?.longitude || location?.longitude) || -75.57859;

  // Distancia y tiempo estimado calculados en vivo
  const distanciaCalculadaKm = useMemo(() => {
    return calcularDistanciaKm(proLat, proLng, solLat, solLng);
  }, [proLat, proLng, solLat, solLng]);

  const tiempoEstimadoMinutos = useMemo(() => {
    return calcularTiempoLlegadaMinutos(distanciaCalculadaKm);
  }, [distanciaCalculadaKm]);

  const [form, setForm] = useState({
    precioOfrecido: solicitud?.precioMaximo ? String(Math.round(solicitud.precioMaximo)) : '',
    mensajeOferta: '',
    tiempoLlegadaMinutos: String(tiempoEstimadoMinutos),
    materialesIncluidos: false,
  });

  // Si cambia el cálculo del tiempo estimado y el usuario no lo ha editado manualmente, actualizar
  useEffect(() => {
    if (tiempoEstimadoMinutos && (!form.tiempoLlegadaMinutos || form.tiempoLlegadaMinutos === '20')) {
      setForm(prev => ({ ...prev, tiempoLlegadaMinutos: String(tiempoEstimadoMinutos) }));
    }
  }, [tiempoEstimadoMinutos]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // ── Polling para detección en tiempo real de aceptación ──────────────────────
  useEffect(() => {
    if (ofertaEnviada && !ofertaAceptada) {
      pollTimerRef.current = setInterval(async () => {
        await verificarEstadoSilencioso();
      }, 2500);

      return () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      };
    }
  }, [ofertaEnviada, ofertaAceptada]);

  const verificarEstadoSilencioso = async () => {
    try {
      const res = await consultarAceptacion();
      if (res?.aceptada) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setOfertaAceptada(true);
        setDatosAceptacion(res);
      }
    } catch {
      // silencioso en background
    }
  };

  const consultarAceptacion = async () => {
    if (!solicitud?.id) return { aceptada: false };

    // 1. Consultar /servicios/activos (se crea en BD de inmediato cuando el cliente acepta)
    try {
      const { data: serviciosActivos } = await apiClient.get('/servicios/activos');
      if (Array.isArray(serviciosActivos)) {
        const matching = serviciosActivos.find(s => s.solicitudId === Number(solicitud.id));
        if (matching) {
          return {
            aceptada: true,
            servicio: matching,
            clienteId: matching.clienteId || solicitud.clienteId,
            clienteNombre: matching.clienteNombre || solicitud.clienteNombre || 'Cliente',
            precioAcordado: matching.precioAcordado || form.precioOfrecido,
          };
        }
      }
    } catch (e) {
      // Continuar con fallback
    }

    // 2. Consultar directamente el detalle de la solicitud
    try {
      const { data: solData } = await apiClient.get(`/solicitudes/${solicitud.id}`);
      if (solData?.estado === 'ACEPTADA') {
        return {
          aceptada: true,
          solicitud: solData,
          clienteId: solData.clienteId || solicitud.clienteId,
          clienteNombre: solData.clienteNombre || solicitud.clienteNombre || 'Cliente',
          precioAcordado: form.precioOfrecido,
        };
      }
    } catch (e) {
      // Continuar con fallback
    }

    return { aceptada: false };
  };

  const handleVerificarManual = async () => {
    setVerificando(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await consultarAceptacion();
      if (res?.aceptada) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setOfertaAceptada(true);
        setDatosAceptacion(res);
        Alert.alert('🎉 ¡Oferta Aceptada!', `El cliente ${res.clienteNombre} ha aceptado tu oferta.`);
      } else {
        Alert.alert(
          'Aún en revisión',
          'El cliente está evaluando las ofertas recibidas. Te avisaremos en cuanto tome una decisión.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setVerificando(false);
    }
  };

  const handleSubmit = async () => {
    const precio = parseFloat(form.precioOfrecido);
    if (!precio || precio < 1) {
      Alert.alert('Precio requerido', 'Ingresa un precio válido para tu oferta.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      await apiClient.post('/ofertas', {
        solicitudId: solicitud.id,
        precioOfrecido: precio,
        mensajeOferta: form.mensajeOferta.trim() || null,
        tiempoLlegadaMinutos: form.tiempoLlegadaMinutos ? parseInt(form.tiempoLlegadaMinutos, 10) : tiempoEstimadoMinutos,
        materialesIncluidos: form.materialesIncluidos,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOfertaEnviada(true);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo enviar la oferta.');
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirChat = () => {
    const clienteId = datosAceptacion?.clienteId || solicitud?.clienteId;
    const clienteNombre = datosAceptacion?.clienteNombre || solicitud?.clienteNombre || 'Cliente';

    navigation.navigate('Chat', {
      solicitudId: solicitud.id,
      destinatarioId: clienteId,
      titulo: clienteNombre,
    });
  };

  const handleAbrirRutaGPS = () => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${proLat},${proLng}&destination=${solLat},${solLng}&travelmode=driving`;

    Linking.canOpenURL('comgooglemaps://').then(installed => {
      if (installed) {
        Linking.openURL(`comgooglemaps://?saddr=${proLat},${proLng}&daddr=${solLat},${solLng}&directionsmode=driving`);
      } else {
        Linking.openURL(googleMapsUrl);
      }
    }).catch(() => {
      Linking.openURL(googleMapsUrl);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Propuesta de Servicio</Text>
              <Text style={styles.headerSubtitle}>Modo Profesional</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>

          {/* MAPA GOOGLE MAPS INTERACTIVO DE UBICACIÓN */}
          <GoogleMapView
            origin={{
              latitude: proLat,
              longitude: proLng,
              title: 'Tu ubicación actual',
            }}
            destination={{
              latitude: solLat,
              longitude: solLng,
              title: solicitud?.titulo || 'Servicio solicitado',
              address: solicitud?.direccion || 'Medellín',
            }}
            distanceKm={distanciaCalculadaKm}
            travelTimeMin={tiempoEstimadoMinutos}
            height={240}
          />

          {/* Resumen del Servicio */}
          {solicitud && (
            <View style={styles.requestCard}>
              <View style={styles.requestCardHeader}>
                <View style={styles.serviceIconWrap}>
                  <Ionicons name="sparkles" size={18} color="#49C0BC" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestTitle}>{solicitud.titulo || 'Servicio de Limpieza'}</Text>
                  <Text style={styles.requestCategory}>{solicitud.tipoLimpieza || 'General'} · {solicitud.duracionEstimada || 60} min</Text>
                </View>
              </View>

              <View style={styles.requestMeta}>
                <View style={styles.metaRow}>
                  <Ionicons name="location" size={14} color="#49C0BC" />
                  <Text style={styles.requestMetaText} numberOfLines={2}>
                    {solicitud.direccion || 'Medellín'}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={14} color="#90A4AE" />
                  <Text style={styles.requestMetaText}>
                    {solicitud.fechaServicio} · {solicitud.horaInicio?.substring(0, 5) || 'Horario flexible'}
                  </Text>
                </View>
                {solicitud.precioMaximo ? (
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetLabel}>Presupuesto cliente:</Text>
                    <Text style={styles.budgetValue}>${Number(solicitud.precioMaximo).toLocaleString()} COP</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* PANTALLA POST-ENVÍO: ESTADO DE ACEPTACIÓN O FORMULARIO */}
          {ofertaAceptada ? (
            /* ─── ESTADO: ¡OFERTA ACEPTADA CON ÉXITO! ─── */
            <View style={styles.acceptedCard}>
              <LinearGradient colors={['rgba(73, 192, 188, 0.2)', 'rgba(0, 27, 56, 0.8)']} style={styles.acceptedGrad}>
                <View style={styles.celebrationIconWrap}>
                  <Ionicons name="checkmark-done-circle" size={54} color="#49C0BC" />
                </View>
                <Text style={styles.acceptedTitle}>¡OFERTA ACEPTADA! 🎉</Text>
                <Text style={styles.acceptedDesc}>
                  El cliente {datosAceptacion?.clienteNombre || solicitud?.clienteNombre || ''} ha seleccionado tu oferta para este servicio.
                </Text>

                <View style={styles.dealSummaryBox}>
                  <Text style={styles.dealSummaryLabel}>Precio acordado:</Text>
                  <Text style={styles.dealSummaryAmount}>${Number(form.precioOfrecido).toLocaleString()} COP</Text>
                </View>

                <TouchableOpacity style={styles.openChatBtn} onPress={handleAbrirChat} activeOpacity={0.85}>
                  <LinearGradient colors={['#49C0BC', '#2a9d99']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="chatbubbles" size={20} color="#001B38" />
                    <Text style={styles.openChatBtnText}>Abrir Chat con el Cliente</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.gpsRouteBtn} onPress={handleAbrirRutaGPS} activeOpacity={0.85}>
                  <Ionicons name="navigate" size={18} color="#49C0BC" />
                  <Text style={styles.gpsRouteBtnText}>Abrir ruta en Google Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.returnBtn} onPress={() => navigation.goBack()}>
                  <Text style={styles.returnBtnText}>Volver a Solicitudes Cercanas</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : ofertaEnviada ? (
            /* ─── ESTADO: ESPERANDO ACEPTACIÓN DEL CLIENTE (CON VERIFICACIÓN EN VIVO) ─── */
            <View style={styles.waitingCard}>
              <View style={styles.waitingIconWrap}>
                <ActivityIndicator size="small" color="#49C0BC" />
              </View>
              <Text style={styles.waitingTitle}>¡Oferta enviada al cliente!</Text>
              <Text style={styles.waitingDesc}>
                Tu propuesta de ${Number(form.precioOfrecido).toLocaleString()} COP ya está en el móvil del cliente.
                {'\n'}Estamos escuchando en tiempo real cuando acepte.
              </Text>

              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={handleVerificarManual}
                disabled={verificando}
                activeOpacity={0.85}
              >
                {verificando ? (
                  <ActivityIndicator size="small" color="#001B38" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={18} color="#001B38" />
                    <Text style={styles.verifyBtnText}>Verificar si ya aceptaron</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backLinkBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.backLinkText}>Volver a solicitudes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ─── FORMULARIO DE ENVÍO DE OFERTA ─── */
            <>
              {/* Input de Precio */}
              <View style={styles.inputSection}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Tu precio de oferta *</Text>
                  {solicitud?.precioMaximo && form.precioOfrecido !== String(Math.round(solicitud.precioMaximo)) && (
                    <TouchableOpacity
                      onPress={() => updateField('precioOfrecido', String(Math.round(solicitud.precioMaximo)))}
                    >
                      <Text style={styles.quickFillText}>Usar sugerido</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySign}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0"
                    placeholderTextColor="#546E7A"
                    value={form.precioOfrecido}
                    onChangeText={v => updateField('precioOfrecido', v)}
                    keyboardType="numeric"
                  />
                  <Text style={styles.currencyCode}>COP</Text>
                </View>
              </View>

              {/* Mensaje al Cliente */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>Mensaje al cliente (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ej: Hola, cuento con 3 años de experiencia y llego puntual con todos los implementos..."
                  placeholderTextColor="#546E7A"
                  value={form.mensajeOferta}
                  onChangeText={v => updateField('mensajeOferta', v)}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>

              {/* Tiempo de Llegada */}
              <View style={styles.inputSection}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Tiempo estimado de llegada (minutos)</Text>
                  <Text style={styles.gpsCalculatedTag}>Calculado por GPS</Text>
                </View>
                <View style={styles.timeInputContainer}>
                  <Ionicons name="time-outline" size={20} color="#49C0BC" />
                  <TextInput
                    style={styles.timeInput}
                    placeholder="Ej: 20"
                    placeholderTextColor="#546E7A"
                    value={form.tiempoLlegadaMinutos}
                    onChangeText={v => updateField('tiempoLlegadaMinutos', v)}
                    keyboardType="numeric"
                  />
                  <Text style={styles.timeInputSuffix}>minutos</Text>
                </View>
              </View>

              {/* Toggle de Materiales */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => {
                  updateField('materialesIncluidos', !form.materialesIncluidos);
                  Haptics.selectionAsync();
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={form.materialesIncluidos ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={form.materialesIncluidos ? '#49C0BC' : '#546E7A'}
                />
                <Text style={styles.toggleLabel}>Incluyo materiales y productos de limpieza</Text>
              </TouchableOpacity>

              {/* Botón de Envío */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#49C0BC', '#2a9d99']}
                  style={styles.btnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#001B38" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane" size={20} color="#001B38" />
                      <Text style={styles.submitText}>Enviar oferta ahora</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000F22',
  },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#49C0BC',
    textAlign: 'center',
    fontWeight: '600',
  },

  // ── Tarjeta de Solicitud ──────────────────────────────────────────────────
  requestCard: {
    backgroundColor: '#001B38',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  requestCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  serviceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(73, 192, 188, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  requestCategory: {
    fontSize: 12,
    color: '#49C0BC',
    fontWeight: '500',
    marginTop: 2,
  },
  requestMeta: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestMetaText: {
    fontSize: 13,
    color: '#B0BEC5',
    flex: 1,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    backgroundColor: 'rgba(73, 192, 188, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  budgetLabel: {
    fontSize: 13,
    color: '#B0BEC5',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#49C0BC',
  },

  // ── Inputs del Formulario ──────────────────────────────────────────────────
  inputSection: {
    marginBottom: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ECEFF1',
  },
  quickFillText: {
    fontSize: 12,
    color: '#49C0BC',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  gpsCalculatedTag: {
    fontSize: 11,
    color: '#49C0BC',
    backgroundColor: 'rgba(73, 192, 188, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001B38',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#49C0BC',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  currencySign: {
    fontSize: 26,
    fontWeight: '700',
    color: '#49C0BC',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#90A4AE',
  },
  input: {
    backgroundColor: '#001B38',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  textArea: {
    minHeight: 75,
    textAlignVertical: 'top',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001B38',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeInputSuffix: {
    fontSize: 13,
    color: '#90A4AE',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#CFD8DC',
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#49C0BC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitText: {
    color: '#001B38',
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Post-Envío: En Espera ──────────────────────────────────────────────────
  waitingCard: {
    backgroundColor: '#001B38',
    borderRadius: 18,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(73, 192, 188, 0.3)',
    marginTop: 10,
    gap: 12,
  },
  waitingIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(73, 192, 188, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  waitingDesc: {
    fontSize: 13,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 19,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#49C0BC',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    width: '100%',
  },
  verifyBtnText: {
    color: '#001B38',
    fontWeight: '700',
    fontSize: 15,
  },
  backLinkBtn: {
    marginTop: 4,
    padding: 6,
  },
  backLinkText: {
    color: '#90A4AE',
    fontSize: 13,
    textDecorationLine: 'underline',
  },

  // ── Post-Envío: OFERTA ACEPTADA 🎉 ─────────────────────────────────────────
  acceptedCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#49C0BC',
    shadowColor: '#49C0BC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  acceptedGrad: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: 12,
  },
  celebrationIconWrap: {
    marginBottom: 4,
  },
  acceptedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#49C0BC',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  acceptedDesc: {
    fontSize: 14,
    color: '#ECEFF1',
    textAlign: 'center',
    lineHeight: 20,
  },
  dealSummaryBox: {
    backgroundColor: 'rgba(73, 192, 188, 0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  dealSummaryLabel: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  dealSummaryAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  openChatBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
  },
  openChatBtnText: {
    color: '#001B38',
    fontWeight: '800',
    fontSize: 16,
  },
  gpsRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(73, 192, 188, 0.3)',
  },
  gpsRouteBtnText: {
    color: '#49C0BC',
    fontWeight: '600',
    fontSize: 14,
  },
  returnBtn: {
    marginTop: 4,
    padding: 6,
  },
  returnBtnText: {
    color: '#90A4AE',
    fontSize: 13,
  },
});
