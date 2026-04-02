import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  Modal,
} from 'react-native';

let MapView, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
  const MapModule = require('react-native-maps');
  MapView = MapModule.default;
  Marker = MapModule.Marker;
  PROVIDER_GOOGLE = MapModule.PROVIDER_GOOGLE;
} else {
  // Mock para Web
  MapView = ({ children, style }) => <View style={[style, { backgroundColor: '#0a1628', justifyContent: 'center', alignItems: 'center' }]}><Text style={{color: '#49C0BC'}}>Mapa (Solo Móvil)</Text>{children}</View>;
  Marker = ({ children }) => <View>{children}</View>;
  PROVIDER_GOOGLE = 'google';
}

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocation } from '../../context/LocationContext';
import apiClient from '../../services/apiClient';
import { inicializarChat, buildChatId } from '../../services/chatService';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, PROF } from '../../constants/theme';

const TIPOS_LIMPIEZA = [
  { value: 'BASICA', label: 'Básica', icon: 'sparkles-outline' },
  { value: 'PROFUNDA', label: 'Profunda', icon: 'water-outline' },
  { value: 'OFICINA', label: 'Oficina', icon: 'business-outline' },
  { value: 'POST_CONSTRUCCION', label: 'Post-construcción', icon: 'construct-outline' },
  { value: 'MUDANZA', label: 'Mudanza', icon: 'cube-outline' },
  { value: 'DESINFECCION', label: 'Desinfección', icon: 'shield-checkmark-outline' },
];

export default function CreateRequestScreen({ navigation, route }) {
  const { location } = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    tipoLimpieza: '',
    direccion: '',
    metrosCuadrados: '60',
    cantidadHabitaciones: '2',
    cantidadBanos: '1',
    tieneMascotas: false,
    precioMaximo: '',
    fechaServicio: new Date().toISOString().split('T')[0],
    horaInicio: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    duracionEstimada: '60',
    instruccionesEspeciales: '',
  });

  const selectedService = route.params?.service;

  useEffect(() => {
    if (selectedService) {
      const tipoMapeado = selectedService.title.toUpperCase().includes('BÁSICA') ? 'BASICA' :
                         selectedService.title.toUpperCase().includes('PROFUNDA') ? 'PROFUNDA' :
                         selectedService.title.toUpperCase().includes('OFICINA') ? 'OFICINA' : '';
      
      setForm(prev => ({
        ...prev,
        tipoLimpieza: tipoMapeado,
        titulo: `Solicitud de ${selectedService.title}`,
      }));
    }
  }, [selectedService]);

  const [isConfirmingLocation, setIsConfirmingLocation] = useState(false);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.titulo.trim() || !form.tipoLimpieza || !form.direccion.trim()) {
      Alert.alert('Campos requeridos', 'Completa título, tipo y dirección.');
      return;
    }

    const precio = form.precioMaximo ? parseFloat(form.precioMaximo) : 0;
    if (precio < 80000) {
      Alert.alert('Precio mínimo', 'El presupuesto mínimo para una solicitud es de COL$ 80.000.');
      return;
    }

    setIsConfirmingLocation(true);
  };

  const executeRequest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setIsConfirmingLocation(false);

    try {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 10 * 60000); 
      
      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || `Servicio de ${form.tipoLimpieza}`,
        tipoLimpieza: form.tipoLimpieza,
        direccion: form.direccion.trim(),
        latitud: location?.coords?.latitude ? parseFloat(location.coords.latitude.toFixed(6)) : 4.6097,
        longitud: location?.coords?.longitude ? parseFloat(location.coords.longitude.toFixed(6)) : -74.0817,
        metrosCuadrados: form.metrosCuadrados ? parseFloat(form.metrosCuadrados) : 60,
        cantidadHabitaciones: form.cantidadHabitaciones ? parseInt(form.cantidadHabitaciones, 10) : 2,
        cantidadBanos: form.cantidadBanos ? parseInt(form.cantidadBanos, 10) : 1,
        tieneMascotas: form.tieneMascotas,
        precioMaximo: parseFloat(form.precioMaximo),
        fechaServicio: futureDate.toISOString().split('T')[0],
        horaInicio: futureDate.toTimeString().split(' ')[0].substring(0, 5),
        duracionEstimada: parseInt(form.duracionEstimada, 10) || 60,
        instruccionesEspeciales: form.instruccionesEspeciales?.trim() || "Sin instrucciones adicionales",
      };

      // 1. Crear solicitud en el backend REST
      const { data: solicitudCreada } = await apiClient.post('/solicitudes', payload);
      const solicitudId = solicitudCreada?.id || solicitudCreada?.solicitudId;

      // 2. Crear documento de chat en Firestore (estado "pending")
      //    Lo hacemos en background — no bloquea la navegación
      if (solicitudId && user?.id) {
        inicializarChat({
          solicitudId,
          usuarioId: user.id,
          tituloServicio: form.titulo.trim(),
        }).catch((e) => console.warn('[CreateRequest] inicializarChat error:', e.message));
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 3. Navegar directamente al chat (modo "pending" mientras espera profesional)
      if (solicitudId) {
        navigation.replace('UserChat', {
          solicitudId,
          destinatarioId: null,   // aún no hay profesional asignado
          titulo: 'Buscando profesional…',
          pendiente: true,        // ChatScreen muestra banner de espera
        });
      } else {
        // Fallback si el backend no devuelve el ID
        navigation.goBack();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al conectar con el servidor.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nueva Solicitud</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Tipo de limpieza */}
          <Text style={styles.label}>Tipo de servicio *</Text>
          <View style={styles.tipoGrid}>
            {TIPOS_LIMPIEZA.map(tipo => (
              <TouchableOpacity
                key={tipo.value}
                style={[styles.tipoCard, form.tipoLimpieza === tipo.value && styles.tipoCardActive]}
                onPress={() => { updateField('tipoLimpieza', tipo.value); Haptics.selectionAsync(); }}
              >
                <Ionicons
                  name={tipo.icon}
                  size={24}
                  color={form.tipoLimpieza === tipo.value ? COLORS.white : COLORS.accent}
                />
                <Text style={[styles.tipoLabel, form.tipoLimpieza === tipo.value && styles.tipoLabelActive]}>
                  {tipo.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Título */}
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Limpieza apartamento 2 habitaciones"
            placeholderTextColor={COLORS.textDisabled}
            value={form.titulo}
            onChangeText={v => updateField('titulo', v)}
            maxLength={200}
          />

          {/* Descripcion */}
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe lo que necesitas..."
            placeholderTextColor={COLORS.textDisabled}
            value={form.descripcion}
            onChangeText={v => updateField('descripcion', v)}
            multiline
            numberOfLines={3}
          />

          {/* Dirección */}
          <Text style={styles.label}>Dirección *</Text>
          <TextInput
            style={styles.input}
            placeholder="Calle, número, barrio, ciudad"
            placeholderTextColor={COLORS.textDisabled}
            value={form.direccion}
            onChangeText={v => updateField('direccion', v)}
          />

          {/* Detalles del espacio */}
          <Text style={styles.sectionTitle}>Detalles del espacio</Text>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.miniLabel}>m²</Text>
              <TextInput
                style={styles.input}
                placeholder="50"
                placeholderTextColor={COLORS.textDisabled}
                value={form.metrosCuadrados}
                onChangeText={v => updateField('metrosCuadrados', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.miniLabel}>Habitaciones</Text>
              <TextInput
                style={styles.input}
                placeholder="2"
                placeholderTextColor={COLORS.textDisabled}
                value={form.cantidadHabitaciones}
                onChangeText={v => updateField('cantidadHabitaciones', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.miniLabel}>Baños</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor={COLORS.textDisabled}
                value={form.cantidadBanos}
                onChangeText={v => updateField('cantidadBanos', v)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Mascotas toggle */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => { updateField('tieneMascotas', !form.tieneMascotas); Haptics.selectionAsync(); }}
          >
            <Ionicons
              name={form.tieneMascotas ? 'checkbox' : 'square-outline'}
              size={24}
              color={form.tieneMascotas ? COLORS.accent : COLORS.textDisabled}
            />
            <Text style={styles.toggleLabel}>Tengo mascotas</Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Presupuesto sugerido (Min. $80.000) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 85000"
                placeholderTextColor={COLORS.textDisabled}
                value={form.precioMaximo}
                onChangeText={v => updateField('precioMaximo', v)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Instrucciones */}
          <Text style={styles.label}>Instrucciones especiales</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Algo que el profesional deba saber..."
            placeholderTextColor={COLORS.textDisabled}
            value={form.instruccionesEspeciales}
            onChangeText={v => updateField('instruccionesEspeciales', v)}
            multiline
            numberOfLines={3}
          />

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="flash" size={20} color={COLORS.white} />
                <Text style={styles.submitText}>SOLICITAR OFERTAS AHORA</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL DE CONFIRMACIÓN DE UBICACIÓN */}
      <Modal visible={isConfirmingLocation} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirma tu ubicación</Text>
            <Text style={styles.modalSub}>El profesional llegará a este punto exacto</Text>
            
            <View style={styles.miniMapWrap}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.miniMap}
                initialRegion={{
                  latitude: location?.coords?.latitude || 4.6097,
                  longitude: location?.coords?.longitude || -74.0817,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: location?.coords?.latitude || 4.6097,
                    longitude: location?.coords?.longitude || -74.0817,
                  }}
                >
                  <View style={styles.markerCircle}>
                    <View style={styles.markerDot} />
                  </View>
                </Marker>
              </MapView>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={executeRequest}>
              <Text style={styles.confirmBtnText}>Confirmar y Publicar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsConfirmingLocation(false)}>
              <Text style={styles.cancelBtnText}>Editar dirección</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  headerTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.bold, color: COLORS.textPrimary },
  label: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold, color: COLORS.textPrimary, marginTop: SPACING.md, marginBottom: SPACING.xs },
  miniLabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary, marginBottom: 4 },
  sectionTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold, color: COLORS.textPrimary, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  halfField: { flex: 1 },
  tipoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  tipoCard: {
    width: '31%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipoCardActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  tipoLabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.textPrimary, marginTop: 4, textAlign: 'center' },
  tipoLabelActive: { color: COLORS.white, fontWeight: TYPOGRAPHY.semibold },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, gap: SPACING.sm },
  toggleLabel: { fontSize: TYPOGRAPHY.md, color: COLORS.textPrimary },
  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  submitText: { color: COLORS.white, fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold },

  // Estilos del Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  miniMapWrap: {
    height: 180,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#eee',
    marginBottom: SPACING.lg,
  },
  miniMap: {
    flex: 1,
  },
  markerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(73,192,188,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#49C0BC',
    borderWidth: 2,
    borderColor: '#fff',
  },
  confirmBtn: {
    backgroundColor: '#000',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  cancelBtn: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#666',
    fontWeight: '600',
  },
});
