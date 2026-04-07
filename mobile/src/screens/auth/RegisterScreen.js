import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function RegisterScreen({ route, navigation }) {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const selectedRole = route.params?.role || 'CUSTOMER';
  const isProvider = selectedRole === 'SERVICE_PROVIDER';

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: '',
    rol: selectedRole,
    fotoSelfieVerificacion: null,
    fotoCedulaFrontal: null,
    fotoCedulaPosterior: null,
    archivoAntecedentes: null,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});

  const touch = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const fieldError = (field) => {
    if (!touched[field]) return null;
    if ((field === 'nombre' || field === 'apellido') && !form[field].trim()) return 'Campo requerido';
    if (field === 'email') {
      if (!form.email.trim()) return 'Campo requerido';
      if (!/.+@.+\..+/.test(form.email.trim())) return 'Email inválido';
    }
    if (field === 'password') {
      if (!form.password) return 'Campo requerido';
      if (form.password.length < 6) return 'Mínimo 6 caracteres';
    }
    if (field === 'telefono' && form.telefono && !/^\d{7,10}$/.test(form.telefono)) return '7-10 dígitos numéricos';
    return null;
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const pickImage = async (field, useCamera = false) => {
    try {
      const { status } = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permiso denegado', `Necesitamos acceso a tu ${useCamera ? 'cámara' : 'galería'}.`);
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true });

      if (!result.canceled) updateField(field, result.assets[0].base64);
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleRegister = async () => {
    const { nombre, apellido, email, password } = form;

    if (!nombre.trim() || !apellido.trim() || !email.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Campos requeridos', 'Por favor completa nombre, apellido, email y contraseña');
      return;
    }

    if (isProvider && (!form.fotoSelfieVerificacion || !form.fotoCedulaFrontal || !form.fotoCedulaPosterior)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Verificación requerida', 'Debes subir tu selfie y fotos de la cédula.');
      return;
    }

    if (password.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Contraseña débil', 'Debe tener al menos 6 caracteres');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const result = await register(form);
    setLoading(false);

    if (result.success) {
      if (isProvider) {
        navigation.navigate('PendingVerification');
      } else {
        try {
          await authService.sendOTP(form.email.trim());
        } catch (_) { /* no bloquear si hay error */ }
        navigation.navigate('VerifyOTP', { email: form.email.trim() });
      }
    } else {
      Alert.alert('Error en el registro', result.message);
    }
  };

  const renderDocUpload = (label, field, useCamera = false) => {
    const uploaded = !!form[field];
    return (
      <View style={styles.uploadGroup}>
        <Text style={styles.uploadLabel}>{label}</Text>
        <TouchableOpacity
          style={[styles.uploadBtn, uploaded && styles.uploadBtnDone]}
          onPress={() => pickImage(field, useCamera)}
          activeOpacity={0.85}
        >
          {uploaded ? (
            <View style={styles.uploadPreviewRow}>
              <Image source={{ uri: `data:image/jpeg;base64,${form[field]}` }} style={styles.uploadThumb} />
              <View style={styles.uploadDoneTag}>
                <Ionicons name="checkmark-circle" size={16} color="#49C0BC" />
                <Text style={styles.uploadDoneText}>Cargado</Text>
              </View>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name={useCamera ? 'camera-outline' : 'image-outline'} size={20} color={PROF.textMuted} />
              <Text style={styles.uploadPlaceholderText}>Toca para {useCamera ? 'tomar foto' : 'seleccionar'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#000F22', '#001B38', '#0a2a42']} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={24} color={PROF.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Animated.View entering={ZoomIn.duration(320)} style={[styles.roleBadge, isProvider && styles.roleBadgePro]}>
                <Ionicons
                  name={isProvider ? 'briefcase' : 'person'}
                  size={13}
                  color={isProvider ? '#F5A623' : PROF.accent}
                />
              </Animated.View>
              <Text style={styles.title}>{isProvider ? 'Crea tu perfil pro' : 'Crear cuenta'}</Text>
              <Text style={styles.subtitle}>
                {isProvider ? 'Completa tu perfil para empezar a trabajar' : 'Únete y encuentra servicios cerca de ti'}
              </Text>
            </View>
          </Animated.View>

          {/* ── Datos básicos ── */}
          <Animated.View entering={FadeInDown.duration(500).delay(80).springify()} style={styles.card}>
            <Text style={styles.sectionTitle}>Datos personales</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Nombre *</Text>
                <View style={[styles.inputRow, !!fieldError('nombre') && styles.inputRowError]}>
                  <Ionicons name="person-outline" size={15} color={PROF.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Juan"
                    placeholderTextColor={PROF.textMuted}
                    value={form.nombre}
                    onChangeText={(v) => updateField('nombre', v)}
                    onBlur={() => touch('nombre')}
                  />
                </View>
                {!!fieldError('nombre') && <Text style={styles.fieldError}>{fieldError('nombre')}</Text>}
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Apellido *</Text>
                <View style={[styles.inputRow, !!fieldError('apellido') && styles.inputRowError]}>
                  <Ionicons name="person-outline" size={15} color={PROF.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Pérez"
                    placeholderTextColor={PROF.textMuted}
                    value={form.apellido}
                    onChangeText={(v) => updateField('apellido', v)}
                    onBlur={() => touch('apellido')}
                  />
                </View>
                {!!fieldError('apellido') && <Text style={styles.fieldError}>{fieldError('apellido')}</Text>}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico *</Text>
              <View style={[styles.inputRow, !!fieldError('email') && styles.inputRowError]}>
                <Ionicons name="mail-outline" size={17} color={PROF.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor={PROF.textMuted}
                  value={form.email}
                  onChangeText={(v) => updateField('email', v)}
                  onBlur={() => touch('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {!!fieldError('email') && <Text style={styles.fieldError}>{fieldError('email')}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <View style={[styles.inputRow, !!fieldError('telefono') && styles.inputRowError]}>
                <Ionicons name="call-outline" size={17} color={PROF.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="3001234567"
                  placeholderTextColor={PROF.textMuted}
                  value={form.telefono}
                  onChangeText={(v) => updateField('telefono', v)}
                  onBlur={() => touch('telefono')}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              {!!fieldError('telefono') && <Text style={styles.fieldError}>{fieldError('telefono')}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña *</Text>
              <View style={[styles.inputRow, !!fieldError('password') && styles.inputRowError]}>
                <Ionicons name="lock-closed-outline" size={17} color={PROF.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={PROF.textMuted}
                  value={form.password}
                  onChangeText={(v) => updateField('password', v)}
                  onBlur={() => touch('password')}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={PROF.textMuted} />
                </TouchableOpacity>
              </View>
              {!!fieldError('password') && <Text style={styles.fieldError}>{fieldError('password')}</Text>}
              {touched.password && form.password.length > 0 ? (
                <>
                  {(() => {
                    const level = form.password.length < 6 ? 1 : form.password.length < 9 ? 2 : 3;
                    const color = level === 1 ? '#FF5B5B' : level === 2 ? '#F5A623' : PROF.accent;
                    return (
                      <Animated.View
                        key={level}
                        entering={ZoomIn.duration(300).springify()}
                        style={styles.strengthRow}
                      >
                        {[1, 2, 3].map((seg) => (
                          <View
                            key={seg}
                            style={[styles.strengthSeg, seg <= level && { backgroundColor: color, borderColor: color }]}
                          />
                        ))}
                        <Text style={[styles.strengthLabel, { color }]}>
                          {level === 1 ? 'Débil' : level === 2 ? 'Media' : 'Fuerte'}
                        </Text>
                      </Animated.View>
                    );
                  })()}
                  <Text style={styles.passHint}>Usa letras, números y un símbolo para mayor seguridad</Text>
                </>
              ) : (
                <Text style={styles.passHint}>Mínimo 6 caracteres</Text>
              )}
            </View>
          </Animated.View>

          {/* ── Verificación de identidad (solo profesionales) ── */}
          {isProvider && (
            <Animated.View entering={FadeInDown.duration(500).delay(160).springify()} style={[styles.card, styles.verifyCard]}>
              <View style={styles.verifyHeader}>
                <Ionicons name="shield-checkmark" size={20} color={PROF.accent} />
                <Text style={styles.sectionTitle}>Verificación de identidad</Text>
              </View>
              <Text style={styles.verifySubtitle}>Necesitamos validar tu identidad para proteger a nuestros clientes.</Text>

              {renderDocUpload('Selfie con rostro *', 'fotoSelfieVerificacion', true)}
              {renderDocUpload('Cédula – Frontal *', 'fotoCedulaFrontal')}
              {renderDocUpload('Cédula – Posterior *', 'fotoCedulaPosterior')}
              {renderDocUpload('Antecedentes judiciales (opcional)', 'archivoAntecedentes')}
            </Animated.View>
          )}

          {/* ── Botón submit ── */}
          <Animated.View entering={FadeInDown.duration(500).delay(isProvider ? 240 : 160).springify()} style={styles.submitArea}>
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient colors={PROF.gradAccent} style={styles.submitBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>{isProvider ? 'Enviar para validación' : 'Crear cuenta'}</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
  },

  // Header
  header: {
    marginBottom: SPACING.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PROF.glass,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  headerCenter: {},
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
    color: PROF.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textSecondary,
    lineHeight: 20,
  },

  // Card
  card: {
    backgroundColor: PROF.glass,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
    color: PROF.textPrimary,
    marginBottom: SPACING.md,
  },

  // Verify card
  verifyCard: {
    borderColor: 'rgba(73,192,188,0.25)',
  },
  verifyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  verifySubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },

  // Inputs
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: PROF.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 50,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.md,
    color: PROF.textPrimary,
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },

  // Validation
  inputRowError: {
    borderColor: 'rgba(255,91,91,0.5)',
    backgroundColor: 'rgba(255,91,91,0.04)',
  },
  fieldError: {
    fontSize: 11,
    color: '#FF5B5B',
    marginTop: 4,
    marginLeft: 2,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  strengthSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  strengthLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    minWidth: 38,
    textAlign: 'right',
    color: PROF.textMuted,
  },
  passHint: {
    fontSize: 11,
    color: PROF.textMuted,
    marginTop: 5,
    marginLeft: 2,
    lineHeight: 15,
  },

  // Role badge
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(73,192,188,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(73,192,188,0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  roleBadgePro: {
    backgroundColor: 'rgba(245,166,35,0.1)',
    borderColor: 'rgba(245,166,35,0.3)',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: PROF.accent,
  },
  roleBadgeTextPro: {
    color: '#F5A623',
  },

  // Document upload
  uploadGroup: {
    marginBottom: SPACING.sm,
  },
  uploadLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PROF.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  uploadBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    minHeight: 56,
    justifyContent: 'center',
  },
  uploadBtnDone: {
    borderStyle: 'solid',
    borderColor: 'rgba(73,192,188,0.4)',
    backgroundColor: 'rgba(73,192,188,0.07)',
  },
  uploadPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadPlaceholderText: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textMuted,
  },
  uploadPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadThumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  uploadDoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uploadDoneText: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.accent,
    fontWeight: '600',
  },

  // Submit
  submitArea: {
    marginTop: SPACING.sm,
  },
  submitBtn: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    shadowColor: PROF.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnGrad: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  loginText: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textSecondary,
  },
  loginLink: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
    color: PROF.accent,
  },
});
