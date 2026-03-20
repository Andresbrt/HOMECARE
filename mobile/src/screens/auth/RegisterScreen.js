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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

export default function RegisterScreen({ route, navigation }) {
  const { register } = useAuth();
  const selectedRole = route.params?.role || 'CUSTOMER';

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: '',
    rol: selectedRole,
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const { nombre, apellido, email, password } = form;
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Error', 'Por favor completa los campos obligatorios');
      return;
    }
    if (password.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const result = await register(form);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        '¡Registro Exitoso!',
        'Tu cuenta ha sido creada. Por favor verifica tu correo electrónico para activar todas las funciones.',
        [{ text: 'Entendido' }]
      );
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const isProvider = selectedRole === 'SERVICE_PROVIDER';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          {isProvider ? 'Registro Profesional' : 'Crear Cuenta'}
        </Text>
        <Text style={styles.subtitle}>
          {isProvider
            ? 'Completa tu perfil para recibir solicitudes'
            : 'Empieza a encontrar servicios cerca de ti'}
        </Text>

        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.halfInput]}>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Juan"
              placeholderTextColor={COLORS.textDisabled}
              value={form.nombre}
              onChangeText={(v) => updateField('nombre', v)}
            />
          </View>
          <View style={[styles.inputContainer, styles.halfInput]}>
            <Text style={styles.label}>Apellido *</Text>
            <TextInput
              style={styles.input}
              placeholder="Pérez"
              placeholderTextColor={COLORS.textDisabled}
              value={form.apellido}
              onChangeText={(v) => updateField('apellido', v)}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Correo electrónico *</Text>
          <TextInput
            style={styles.input}
            placeholder="ejemplo@correo.com"
            placeholderTextColor={COLORS.textDisabled}
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña *</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={COLORS.textDisabled}
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="3001234567"
            placeholderTextColor={COLORS.textDisabled}
            value={form.telefono}
            onChangeText={(v) => updateField('telefono', v)}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Crear cuenta</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>
            ¿Ya tienes cuenta?{' '}
            <Text style={styles.linkTextBold}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.backgroundSecondary,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  linkText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textSecondary,
  },
  linkTextBold: {
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.semibold,
  },
});
