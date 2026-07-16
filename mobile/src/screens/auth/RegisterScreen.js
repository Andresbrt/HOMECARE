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
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '../../context/AuthContext';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function RegisterScreen({ route, navigation }) {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const selectedRole = route.params?.role || 'CUSTOMER';
  const isProvider = selectedRole === 'SERVICE_PROVIDER';

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [fotoSelfieBase64, setFotoSelfieBase64] = useState(null);
  const [fotoCedulaFrontalBase64, setFotoCedulaFrontalBase64] = useState(null);
  const [fotoCedulaPosteriorBase64, setFotoCedulaPosteriorBase64] = useState(null);
  const [archivoAntecedentesBase64, setArchivoAntecedentesBase64] = useState(null);
  const [uploadErrors, setUploadErrors] = useState({});

  const touch = (field) => setTouched((p) => ({ ...p, [field]: true }));

  const errors = {
    nombre: touched.nombre && !nombreCompleto.trim() ? 'Campo requerido' : null,
    email: touched.email
      ? !email.trim()
        ? 'Campo requerido'
        : !/.+@.+\..+/.test(email.trim())
        ? 'Email inválido'
        : null
      : null,
    password: touched.password
      ? !password
        ? 'Campo requerido'
        : password.length < 6
        ? 'Mínimo 6 caracteres'
        : null
      : null,
    fotoSelfie: uploadErrors.fotoSelfie || null,
    fotoCedulaFrontal: uploadErrors.fotoCedulaFrontal || null,
    fotoCedulaPosterior: uploadErrors.fotoCedulaPosterior || null,
    archivoAntecedentes: uploadErrors.archivoAntecedentes || null,
  };

  const handleRegister = async () => {
    setTouched({ nombre: true, email: true, password: true });
    setUploadErrors({});

    if (!nombreCompleto.trim() || !email.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Campos requeridos', 'Completa nombre, correo y contraseña');
      return;
    }
    if (password.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Contraseña débil', 'Debe tener al menos 6 caracteres');
      return;
    }
    if (isProvider) {
      const errors = {};
      if (!fotoSelfieBase64) errors.fotoSelfie = 'Selfie obligatorio para proveedores';
      if (!fotoCedulaFrontalBase64) errors.fotoCedulaFrontal = 'Cédula frontal obligatoria';
      if (!fotoCedulaPosteriorBase64) errors.fotoCedulaPosterior = 'Cédula posterior obligatoria';
      if (!archivoAntecedentesBase64) errors.archivoAntecedentes = 'Antecedentes obligatorios';
      if (Object.keys(errors).length > 0) {
        setUploadErrors(errors);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Documentos obligatorios', 'Completa todos los documentos requeridos para registrar como profesional.');
        return;
      }
    }

    // Separar nombre completo en nombre + apellido para el backend
    const partes = nombreCompleto.trim().split(/\s+/);
    const nombre = partes[0];
    const apellido = partes.slice(1).join(' ') || partes[0];

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const result = await register({
      nombre,
      apellido,
      email: email.trim(),
      password,
      rol: selectedRole,
      ...(fotoSelfieBase64 && { fotoSelfieBase64 }),
      ...(fotoCedulaFrontalBase64 && { fotoCedulaFrontalBase64 }),
      ...(fotoCedulaPosteriorBase64 && { fotoCedulaPosteriorBase64 }),
      ...(archivoAntecedentesBase64 && { archivoAntecedentesBase64 }),
    });
    setLoading(false);

    if (result.success) {
      if (result.requiresOTP) {
        navigation.navigate('VerifyOTP', { email: email.trim() });
      } else if (isProvider) {
        navigation.navigate('PendingVerification');
      }
    } else {
      Alert.alert('Error en el registro', result.message);
    }
  };

  const pickImage = async (setter) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Necesitamos acceso a la cámara para capturar los documentos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(asset.uri, [], {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      const response = await fetch(manipulated.uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result?.toString().replace(/^data:image\/[a-z]+;base64,/, '');
        if (base64data) setter(base64data);
      };
      reader.readAsDataURL(blob);
    }
  };

  const passStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 9 ? 2 : 3;
  const strengthColor = passStrength === 1 ? '#FF5B5B' : passStrength === 2 ? '#F5A623' : PROF.accent;
  const strengthLabel = passStrength === 1 ? 'Débil' : passStrength === 2 ? 'Media' : 'Fuerte';

  return (
    <LinearGradient colors={['#000F22', '#001B38', '#0a2a42']} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={24} color={PROF.textPrimary} />
            </TouchableOpacity>

            <Animated.View entering={ZoomIn.duration(350)} style={[styles.roleBadge, isProvider && styles.roleBadgePro]}>
              <Ionicons name={isProvider ? 'briefcase' : 'person'} size={13} color={isProvider ? '#F5A623' : PROF.accent} />
              <Text style={[styles.roleBadgeText, isProvider && { color: '#F5A623' }]}>
                {isProvider ? 'Profesional' : 'Cliente'}
              </Text>
            </Animated.View>

            <Text style={styles.title}>{isProvider ? 'Crea tu perfil pro' : 'Crear cuenta'}</Text>
            <Text style={styles.subtitle}>
              {isProvider
                ? 'Empieza a recibir solicitudes de clientes'
                : 'Únete y encuentra servicios cerca de ti'}
            </Text>
          </Animated.View>

          {/* Formulario */}
          <Animated.View entering={FadeInDown.duration(500).delay(80).springify()} style={styles.card}>
            <Text style={styles.sectionTitle}>Datos personales</Text>

            {/* Nombre completo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre completo *</Text>
              <View style={[styles.inputRow, errors.nombre && styles.inputError]}>
                <Ionicons name="person-outline" size={17} color={PROF.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder={isProvider ? 'Tu nombre y apellido' : 'Juan Pérez'}
                  placeholderTextColor={PROF.textMuted}
                  value={nombreCompleto}
                  onChangeText={setNombreCompleto}
                  onBlur={() => touch('nombre')}
                  autoCapitalize="words"
                />
              </View>
              {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico *</Text>
              <View style={[styles.inputRow, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={17} color={PROF.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor={PROF.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => touch('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña *</Text>
              <View style={[styles.inputRow, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={17} color={PROF.textMuted} style={styles.icon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={PROF.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => touch('password')}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={PROF.textMuted} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

              {/* Barra de fuerza */}
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[1, 2, 3].map((seg) => (
                    <View
                      key={seg}
                      style={[styles.strengthSeg, seg <= passStrength && { backgroundColor: strengthColor, borderColor: strengthColor }]}
                    />
                  ))}
                  <Text style={[styles.strengthLabel, passStrength > 0 && { color: strengthColor }]}>
                    {strengthLabel}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* OTP info */}
          <Animated.View entering={FadeInDown.duration(500).delay(160).springify()} style={styles.otpInfo}>
            <Ionicons name="mail-unread-outline" size={18} color={PROF.accent} />
            <Text style={styles.otpInfoText}>
              Recibirás un código de verificación en tu correo para confirmar tu cuenta
            </Text>
          </Animated.View>

          {/* Nota dev para profesionales */}
          {isProvider && (
            <Animated.View entering={FadeInDown.duration(500).delay(200).springify()} style={styles.devNote}>
              <Ionicons name="construct-outline" size={15} color={PROF.warning} />
              <Text style={styles.devNoteText}>
                Modo desarrollo · La verificación de documentos se habilitará en producción
              </Text>
            </Animated.View>
          )}

          {isProvider && (
            <Animated.View entering={FadeInDown.duration(500).delay(220).springify()} style={styles.card}>
              <Text style={styles.sectionTitle}>Documentos profesionales</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Selfie profesional *</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setFotoSelfieBase64)}>
                  <Text style={styles.uploadBtnText}>{fotoSelfieBase64 ? 'Selfie cargada' : 'Tomar selfie'}</Text>
                </TouchableOpacity>
                {errors.fotoSelfie && <Text style={styles.errorText}>{errors.fotoSelfie}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cédula frontal *</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setFotoCedulaFrontalBase64)}>
                  <Text style={styles.uploadBtnText}>{fotoCedulaFrontalBase64 ? 'Documento cargado' : 'Tomar cédula frontal'}</Text>
                </TouchableOpacity>
                {errors.fotoCedulaFrontal && <Text style={styles.errorText}>{errors.fotoCedulaFrontal}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cédula posterior *</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setFotoCedulaPosteriorBase64)}>
                  <Text style={styles.uploadBtnText}>{fotoCedulaPosteriorBase64 ? 'Documento cargado' : 'Tomar cédula posterior'}</Text>
                </TouchableOpacity>
                {errors.fotoCedulaPosterior && <Text style={styles.errorText}>{errors.fotoCedulaPosterior}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Antecedentes judiciales *</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setArchivoAntecedentesBase64)}>
                  <Text style={styles.uploadBtnText}>{archivoAntecedentesBase64 ? 'Documento cargado' : 'Tomar foto de antecedentes'}</Text>
                </TouchableOpacity>
                {errors.archivoAntecedentes && <Text style={styles.errorText}>{errors.archivoAntecedentes}</Text>}
              </View>
            </Animated.View>
          )}

          {/* Botón */}
          <Animated.View entering={FadeInDown.duration(500).delay(240).springify()} style={styles.submitArea}>
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={PROF.gradAccent}
                style={styles.submitGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitText}>
                      {isProvider ? 'Crear cuenta profesional' : 'Crear cuenta'}
                    </Text>
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
  header: {
    marginBottom: SPACING.lg,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PROF.glass,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
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
    marginBottom: 12,
  },
  roleBadgePro: {
    backgroundColor: 'rgba(245,166,35,0.1)',
    borderColor: 'rgba(245,166,35,0.3)',
  },
  roleBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    color: PROF.accent,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
    color: PROF.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textSecondary,
    lineHeight: 20,
  },
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
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: PROF.textSecondary,
    marginBottom: 7,
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
    height: 52,
  },
  inputError: {
    borderColor: 'rgba(255,91,91,0.5)',
    backgroundColor: 'rgba(255,91,91,0.04)',
  },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.md,
    color: PROF.textPrimary,
    height: '100%',
  },
  eyeBtn: { padding: 4, marginLeft: 6 },
  errorText: {
    fontSize: 11,
    color: '#FF5B5B',
    marginTop: 5,
    marginLeft: 2,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
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
    color: PROF.textMuted,
    minWidth: 40,
    textAlign: 'right',
  },
  uploadBtn: {
    backgroundColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PROF.glassBorder,
  },
  uploadBtnText: {
    color: PROF.textPrimary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  otpInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(73,192,188,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(73,192,188,0.2)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  otpInfoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textSecondary,
    lineHeight: 19,
  },
  devNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245,166,35,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.2)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm + 4,
    marginBottom: SPACING.md,
  },
  devNoteText: {
    flex: 1,
    fontSize: 11,
    color: PROF.warning,
    lineHeight: 17,
  },
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
  submitGrad: {
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  btnDisabled: { opacity: 0.6 },
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
