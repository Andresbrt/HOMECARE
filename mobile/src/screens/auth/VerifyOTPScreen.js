import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { useOTPVerification } from '../../hooks/useOTPVerification';
import { COLORS, PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function VerifyOTPScreen({ route, navigation }) {
  const { email } = route.params;
  const { loginWithOTPResponse } = useAuth();

  const {
    code, setCode,
    loading, resending,
    error, success, setSuccess,
    expiryFormatted, expired,
    resendCooldown, resendFormatted, canResend,
    blocked,
    verify,
    resend,
  } = useOTPVerification(email);

  const inputRef = useRef(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  // Shake al error
  useEffect(() => {
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  // Animación éxito
  useEffect(() => {
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.spring(successScale, {
        toValue: 1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  }, [success]);

  const handleVerify = async () => {
    const response = await verify();
    if (response) {
      // 1. Activar animación de éxito + haptics de inmediato (feedback instantáneo al usuario)
      setSuccess(true);
      // 2. Autenticar: establece modo + token → AppNavigator redirige automáticamente
      //    al flujo del rol: SERVICE_PROVIDER → Drawer/Dashboard, CUSTOMER → UserMap
      //    (la animación de éxito corre ~100-200ms mientras el storage persiste la sesión,
      //     luego AppNavigator desmonta el Auth Stack → el usuario ve su pantalla principal)
      await loginWithOTPResponse(response);
    }
  };

  const handleCodeChange = (text) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 4);
    setCode(clean);
  };

  const digits = code.padEnd(4, ' ').split('');

  if (success) {
    return (
      <LinearGradient colors={PROF.gradMain} style={styles.container}>
        <Animated.View style={[styles.successBox, { transform: [{ scale: successScale }] }]}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>¡Verificado!</Text>
          <Text style={styles.successSub}>Tu cuenta está activa</Text>
        </Animated.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={PROF.gradMain} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>✉</Text>
          </View>
          <Text style={styles.title}>Verifica tu correo</Text>
          <Text style={styles.subtitle}>
            Enviamos un código de 4 dígitos a
          </Text>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        {/* Cajas de dígitos (visual) */}
        <Animated.View style={[styles.codeRow, { transform: [{ translateX: shakeAnim }] }]}>
          {digits.map((d, i) => (
            <View
              key={i}
              style={[
                styles.digitBox,
                code.length === i && styles.digitBoxActive,
                error && styles.digitBoxError,
                success && styles.digitBoxSuccess,
              ]}
            >
              <Text style={styles.digitText}>{d.trim()}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Input oculto que captura el teclado numérico */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleCodeChange}
          keyboardType="number-pad"
          maxLength={4}
          style={styles.hiddenInput}
          caretHidden
          onSubmitEditing={handleVerify}
        />

        {/* Timer expiry */}
        <View style={styles.timerRow}>
          <View style={[styles.timerBadge, expired && styles.timerBadgeExpired]}>
            <Text style={[styles.timerText, expired && styles.timerTextExpired]}>
              {expired ? 'Código expirado' : `Expira en ${expiryFormatted}`}
            </Text>
          </View>
        </View>

        {/* Error */}
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {/* Botón verificar */}
        <TouchableOpacity
          style={[styles.button, (loading || code.length < 4 || expired || blocked) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading || code.length < 4 || expired || blocked}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verificar código</Text>
          )}
        </TouchableOpacity>

        {/* Reenviar */}
        <TouchableOpacity
          style={[styles.resendButton, !canResend && styles.resendDisabled]}
          onPress={resend}
          disabled={!canResend}
        >
          {resending ? (
            <ActivityIndicator color={PROF.accent} size="small" />
          ) : (
            <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
              {canResend
                ? 'Reenviar código'
                : `Reenviar en ${resendFormatted}`}
            </Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  header: { alignItems: 'center', marginBottom: 36 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(73,192,188,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(73,192,188,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: { fontSize: 30 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: PROF.textPrimary,
    marginBottom: 8,
  },
  subtitle: { fontSize: 14, color: PROF.textSecondary, textAlign: 'center' },
  emailText: {
    fontSize: 15,
    fontWeight: '600',
    color: PROF.accent,
    marginTop: 4,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  digitBox: {
    width: 62,
    height: 72,
    borderRadius: 14,
    backgroundColor: PROF.glass,
    borderWidth: 1.5,
    borderColor: PROF.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBoxActive: {
    borderColor: PROF.accent,
    backgroundColor: 'rgba(73,192,188,0.12)',
  },
  digitBoxError: {
    borderColor: '#EF5350',
    backgroundColor: 'rgba(239,83,80,0.10)',
  },
  digitBoxSuccess: {
    borderColor: '#49C0BC',
    backgroundColor: 'rgba(73,192,188,0.18)',
  },
  digitText: {
    fontSize: 30,
    fontWeight: '700',
    color: PROF.textPrimary,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  timerRow: { marginBottom: 16 },
  timerBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(73,192,188,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(73,192,188,0.25)',
  },
  timerBadgeExpired: {
    backgroundColor: 'rgba(239,83,80,0.12)',
    borderColor: 'rgba(239,83,80,0.3)',
  },
  timerText: { fontSize: 13, color: PROF.accent, fontWeight: '500' },
  timerTextExpired: { color: '#EF5350' },
  errorText: {
    color: '#EF5350',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: 280,
  },
  button: {
    width: '100%',
    backgroundColor: PROF.accent,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: PROF.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.45, shadowOpacity: 0 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendButton: { marginTop: 20, padding: 8 },
  resendDisabled: { opacity: 0.5 },
  resendText: { color: PROF.accent, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  resendTextDisabled: { color: PROF.textSecondary, textDecorationLine: 'none' },
  // Success
  successBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: { fontSize: 72, color: PROF.accent, marginBottom: 16 },
  successTitle: { fontSize: 32, fontWeight: '800', color: PROF.textPrimary, marginBottom: 8 },
  successSub: { fontSize: 16, color: PROF.textSecondary },
});
