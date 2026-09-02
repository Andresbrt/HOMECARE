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
import apiClient from '../../services/apiClient';
import { obtenerChat, buildChatId } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

export default function SendOfferScreen({ route, navigation }) {
  const { solicitud } = route.params || {};
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ofertaEnviada, setOfertaEnviada] = useState(false);
  const [form, setForm] = useState({
    precioOfrecido: '',
    mensajeOferta: '',
    tiempoLlegadaMinutos: '',
    materialesIncluidos: false,
  });

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    const precio = parseFloat(form.precioOfrecido);
    if (!precio || precio < 1) {
      Alert.alert('Precio requerido', 'Ingresa un precio válido (mínimo $1).');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      await apiClient.post('/ofertas', {
        solicitudId: solicitud.id,
        precioOfrecido: precio,
        mensajeOferta: form.mensajeOferta.trim() || null,
        tiempoLlegadaMinutos: form.tiempoLlegadaMinutos ? parseInt(form.tiempoLlegadaMinutos, 10) : null,
        materialesIncluidos: form.materialesIncluidos,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Mostrar botón "Ir al Chat" en vez de volver — el usuario puede ya haber aceptado
      setOfertaEnviada(true);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo enviar la oferta.');
    } finally {
      setLoading(false);
    }
  };

  /** El profesional va al chat cuando el usuario ya aceptó su oferta */
  const handleAbrirChat = async () => {
    try {
      const chatData = await obtenerChat(solicitud.id);
      if (chatData?.status === 'active') {
        navigation.navigate('Chat', {
          solicitudId: solicitud.id,
          destinatarioId: chatData.usuarioId,
          titulo: solicitud.titulo || 'Cliente',
        });
      } else {
        Alert.alert(
          'Chat no disponible',
          'El cliente aún no ha aceptado tu oferta. Te notificaremos cuando lo haga.',
        );
      }
    } catch {
      Alert.alert('Error', 'No se pudo verificar el estado del chat.');
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
            <Text style={styles.headerTitle}>Enviar oferta</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Request summary */}
          {solicitud && (
            <View style={styles.requestCard}>
              <Text style={styles.requestTitle}>{solicitud.titulo}</Text>
              <View style={styles.requestMeta}>
                <Text style={styles.requestMetaText}>
                  <Ionicons name="location-outline" size={14} /> {solicitud.direccion}
                </Text>
                <Text style={styles.requestMetaText}>
                  <Ionicons name="calendar-outline" size={14} /> {solicitud.fechaServicio} · {solicitud.horaInicio?.substring(0, 5)}
                </Text>
                {solicitud.precioMaximo && (
                  <Text style={styles.requestBudget}>
                    Presupuesto máx: ${Number(solicitud.precioMaximo).toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Price input (main) */}
          <Text style={styles.label}>Tu precio *</Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySign}>$</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0"
              placeholderTextColor={COLORS.textDisabled}
              value={form.precioOfrecido}
              onChangeText={v => updateField('precioOfrecido', v)}
              keyboardType="numeric"
            />
          </View>

          {/* Message */}
          <Text style={styles.label}>Mensaje al cliente</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Cuéntale al cliente por qué eres la mejor opción..."
            placeholderTextColor={COLORS.textDisabled}
            value={form.mensajeOferta}
            onChangeText={v => updateField('mensajeOferta', v)}
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          {/* Arrival time */}
          <Text style={styles.label}>Tiempo de llegada (minutos)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 30"
            placeholderTextColor={COLORS.textDisabled}
            value={form.tiempoLlegadaMinutos}
            onChangeText={v => updateField('tiempoLlegadaMinutos', v)}
            keyboardType="numeric"
          />

          {/* Materials toggle */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => { updateField('materialesIncluidos', !form.materialesIncluidos); Haptics.selectionAsync(); }}
          >
            <Ionicons
              name={form.materialesIncluidos ? 'checkbox' : 'square-outline'}
              size={24}
              color={form.materialesIncluidos ? COLORS.accent : COLORS.textDisabled}
            />
            <Text style={styles.toggleLabel}>Materiales de limpieza incluidos</Text>
          </TouchableOpacity>

          {/* Submit / Post-envío */}
          {ofertaEnviada ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
              <Text style={styles.successTitle}>¡Oferta enviada!</Text>
              <Text style={styles.successSub}>
                Cuando el cliente acepte, ambos podrán chatear directamente.
              </Text>
              <TouchableOpacity style={styles.chatBtn} onPress={handleAbrirChat} activeOpacity={0.85}>
                <Ionicons name="chatbubbles" size={20} color="#fff" />
                <Text style={styles.chatBtnText}>Verificar si ya aceptaron</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backLinkBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.backLinkText}>Volver a solicitudes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={20} color={COLORS.white} />
                  <Text style={styles.submitText}>Enviar oferta</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
  requestCard: { backgroundColor: COLORS.backgroundSecondary, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderLeftWidth: 4, borderLeftColor: COLORS.accent },
  requestTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.semibold, color: COLORS.textPrimary },
  requestMeta: { marginTop: SPACING.sm, gap: 4 },
  requestMetaText: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary },
  requestBudget: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold, color: COLORS.accent, marginTop: 4 },
  label: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold, color: COLORS.textPrimary, marginTop: SPACING.lg, marginBottom: SPACING.xs },
  priceInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundSecondary, borderRadius: BORDER_RADIUS.lg, borderWidth: 2, borderColor: COLORS.accent, padding: SPACING.md },
  currencySign: { fontSize: TYPOGRAPHY.xxxl, fontWeight: TYPOGRAPHY.bold, color: COLORS.accent, marginRight: SPACING.sm },
  priceInput: { flex: 1, fontSize: TYPOGRAPHY.xxxl, fontWeight: TYPOGRAPHY.bold, color: COLORS.textPrimary },
  input: { backgroundColor: COLORS.backgroundSecondary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, fontSize: TYPOGRAPHY.md, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.lg, gap: SPACING.sm },
  toggleLabel: { fontSize: TYPOGRAPHY.md, color: COLORS.textPrimary },
  submitBtn: { backgroundColor: COLORS.accent, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xl, gap: SPACING.sm, ...SHADOWS.md },
  submitText: { color: COLORS.white, fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold },
  // ── Post-envío ──────────────────────────────────────────────────────────────
  successBox: { marginTop: SPACING.xl, alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, backgroundColor: COLORS.backgroundSecondary, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.success },
  successTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.bold, color: COLORS.textPrimary },
  successSub: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.accent, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, borderRadius: BORDER_RADIUS.lg, ...SHADOWS.sm },
  chatBtnText: { color: '#fff', fontWeight: TYPOGRAPHY.bold, fontSize: TYPOGRAPHY.md },
  backLinkBtn: { marginTop: SPACING.xs },
  backLinkText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sm, textDecorationLine: 'underline' },
});
