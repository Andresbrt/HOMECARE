import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocation } from '../../context/LocationContext';
import apiClient from '../../services/apiClient';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

const TIPOS_LIMPIEZA = [
  { value: 'BASICA', label: 'Básica', icon: 'sparkles-outline' },
  { value: 'PROFUNDA', label: 'Profunda', icon: 'water-outline' },
  { value: 'OFICINA', label: 'Oficina', icon: 'business-outline' },
  { value: 'POST_CONSTRUCCION', label: 'Post-construcción', icon: 'construct-outline' },
  { value: 'MUDANZA', label: 'Mudanza', icon: 'cube-outline' },
  { value: 'DESINFECCION', label: 'Desinfección', icon: 'shield-checkmark-outline' },
];

export default function CreateRequestScreen({ navigation }) {
  const { location } = useLocation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    tipoLimpieza: '',
    direccion: '',
    metrosCuadrados: '',
    cantidadHabitaciones: '',
    cantidadBanos: '',
    tieneMascotas: false,
    precioMaximo: '',
    fechaServicio: '',
    horaInicio: '',
    duracionEstimada: '60',
    instruccionesEspeciales: '',
  });

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.titulo.trim() || !form.tipoLimpieza || !form.direccion.trim() || !form.fechaServicio || !form.horaInicio) {
      Alert.alert('Campos requeridos', 'Completa título, tipo, dirección, fecha y hora.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        tipoLimpieza: form.tipoLimpieza,
        direccion: form.direccion.trim(),
        latitud: location?.coords?.latitude || 4.6097,
        longitud: location?.coords?.longitude || -74.0817,
        metrosCuadrados: form.metrosCuadrados ? parseFloat(form.metrosCuadrados) : null,
        cantidadHabitaciones: form.cantidadHabitaciones ? parseInt(form.cantidadHabitaciones, 10) : null,
        cantidadBanos: form.cantidadBanos ? parseInt(form.cantidadBanos, 10) : null,
        tieneMascotas: form.tieneMascotas,
        precioMaximo: form.precioMaximo ? parseFloat(form.precioMaximo) : null,
        fechaServicio: form.fechaServicio,
        horaInicio: form.horaInicio,
        duracionEstimada: parseInt(form.duracionEstimada, 10) || 60,
        instruccionesEspeciales: form.instruccionesEspeciales.trim() || null,
      };

      await apiClient.post('/solicitudes', payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('¡Solicitud creada!', 'Los profesionales cercanos recibirán tu solicitud.', [
        { text: 'Ver ofertas', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const msg = error.response?.data?.message || 'No se pudo crear la solicitud.';
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

          {/* Fecha y hora */}
          <Text style={styles.sectionTitle}>Programar servicio</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Fecha *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textDisabled}
                value={form.fechaServicio}
                onChangeText={v => updateField('fechaServicio', v)}
              />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={styles.miniLabel}>Hora *</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                placeholderTextColor={COLORS.textDisabled}
                value={form.horaInicio}
                onChangeText={v => updateField('horaInicio', v)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Duración (min)</Text>
              <TextInput
                style={styles.input}
                placeholder="60"
                placeholderTextColor={COLORS.textDisabled}
                value={form.duracionEstimada}
                onChangeText={v => updateField('duracionEstimada', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={styles.miniLabel}>Precio máximo ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="Opcional"
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
                <Ionicons name="send" size={20} color={COLORS.white} />
                <Text style={styles.submitText}>Publicar solicitud</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
});
