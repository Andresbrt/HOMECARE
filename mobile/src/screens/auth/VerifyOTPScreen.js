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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withRepeat,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useOTPVerification } from '../../hooks/useOTPVerification';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function VerifyOTPScreen({ route, navigation }) {
  const { email } = route.params;
  const { loginWithOTPResponse } = useAuth();
  const insets = useSafeAreaInsets();

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
  const prevCodeLen = useRef(0);
  const shakeX = useSharedValue(0);
  const successScale = useSharedValue(0);
  const d0Scale = useSharedValue(1);
  const d1Scale = useSharedValue(1);
  const d2Scale = useSharedValue(1);
  const d3Scale = useSharedValue(1);
  const btnGlow = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  // Shake on error
  useEffect(() => {
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeX.value = withSequence(
        withTiming(10, { duration: 55 }),
        withTiming(-10, { duration: 55 }),
        withTiming(7, { duration: 55 }),
        withTiming(-7, { duration: 55 }),
        withTiming(0, { duration: 55 }),
      );
    }
  }, [error]);

  // Success scale-in
  useEffect(() => {
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      successScale.value = withSpring(1, { damping: 12, stiffness: 120 });
    }
  }, [success]);

  // Pulse por dígito al escribir
  useEffect(() => {
    const newLen = code.length;
    if (newLen > prevCodeLen.current && newLen > 0) {
      const scales = [d0Scale, d1Scale, d2Scale, d3Scale];
      const idx = newLen - 1;
      scales[idx].value = withSequence(
        withTiming(0.8, { duration: 60 }),
        withSpring(1, { damping: 8, stiffness: 280 }),
      );
    }
    prevCodeLen.current = newLen;
  }, [code]);

  // Glow pulsante del botón cuando se completan los 4 dígitos
  useEffect(() => {
    if (code.length === 4 && !error && !expired && !blocked) {
      btnGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700 }),
          withTiming(0.45, { duration: 700 }),
        ),
        -1,
        true,
      );
    } else {
      btnGlow.value = withTiming(0, { duration: 200 });
    }
  }, [code.length, error, expired, blocked]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const successScaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: successScale.value }] }));
  const d0AnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: d0Scale.value }] }));
  const d1AnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: d1Scale.value }] }));
  const d2AnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: d2Scale.value }] }));
  const d3AnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: d3Scale.value }] }));
  const digitAnimStyles = [d0AnimStyle, d1AnimStyle, d2AnimStyle, d3AnimStyle];
  const btnGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(btnGlow.value, [0, 1], [0.25, 0.55]),
    shadowRadius: interpolate(btnGlow.value, [0, 1], [6, 15]),
    elevation: interpolate(btnGlow.value, [0, 1], [3, 10]),
  }));

  const handleVerify = async () => {
    const response = await verify();
    if (response) {
      setSuccess(true);
      await loginWithOTPResponse(response);
    }
  };

  const handleCodeChange = (text) => {
    setCode(text.replace(/[^0-9]/g, '').slice(0, 4));
  };

  const digits = code.padEnd(4, ' ').split('');

  if (success) {
    return (
      <LinearGradient colors={PROF.gradMain} style={styles.container}>
        <Animated.View style={[styles.successBox, successScaleStyle]}>
          <View style={styles.successCircle}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>¡Verificado!</Text>
          <Text style={styles.successSub}>Tu cuenta está activa</Text>
        </Animated.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000F22', '#001B38', '#0a2a42']} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.inner, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>

          {/* ── Icono + títulos ── */}
          <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>✉</Text>
            </View>
            <Text style={styles.title}>Verifica tu correo</Text>
            <Text style={styles.subtitle}>Enviamos un código de 4 dígitos a</Text>
            <Text style={styles.emailText}>{email}</Text>
          </Animated.View>

          {/* ── Cajas de dígitos ── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(100).springify()}
            style={[styles.codeRow, shakeStyle]}
          >
            {digits.map((d, i) => {
              const isFilled = d.trim() !== '';
              const allFilled = code.length === 4;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.digitBox,
                    code.length === i && styles.digitBoxActive,
                    isFilled && allFilled && !error && styles.digitBoxFilled,
                    error && styles.digitBoxError,
                    digitAnimStyles[i],
                  ]}
                >
                  <Text style={[
                    styles.digitText,
                    isFilled && allFilled && !error && styles.digitTextFilled,
                  ]}>
                    {d.trim()}
                  </Text>
                  {code.length === i && <View style={styles.cursor} />}
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* Input invisible que captura el teclado numérico */}
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

          {/* ── Timer ── */}
          <Animated.View entering={FadeInDown.duration(500).delay(180).springify()} style={styles.timerRow}>
            <View style={[styles.timerBadge, expired && styles.timerBadgeExpired]}>
              <Text style={[styles.timerText, expired && styles.timerTextExpired]}>
                {expired ? '⏱ Código expirado' : `⏱ Expira en ${expiryFormatted}`}
              </Text>
            </View>
          </Animated.View>

          {/* ── Error ── */}
          {error ? (
            <Animated.Text entering={FadeIn.duration(250)} style={styles.errorText}>
              {error}
            </Animated.Text>
          ) : null}

          {/* ── Botón verificar ── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(220).springify()}
            style={[styles.button, (loading || code.length < 4 || expired || blocked) && styles.buttonDisabled, btnGlowStyle]}
          >
            <TouchableOpacity
              onPress={handleVerify}
              disabled={loading || code.length < 4 || expired || blocked}
              activeOpacity={0.88}
              onPressIn={() => inputRef.current?.focus()}
              style={{ overflow: 'hidden', borderRadius: BORDER_RADIUS.md }}
            >
              <LinearGradient
                colors={PROF.gradAccent}
                style={styles.buttonGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verificar código</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Reenviar ── */}
          <Animated.View entering={FadeInDown.duration(500).delay(280).springify()} style={styles.resendWrapper}>
            <Text style={styles.resendLabel}>¿No recibiste el código?</Text>
            {resending ? (
              <View style={styles.resendLoadingRow}>
                <ActivityIndicator color={PROF.accent} size="small" />
                <Text style={styles.resendSendingText}>Enviando…</Text>
              </View>
            ) : canResend ? (
              <TouchableOpacity
                onPress={resend}
                activeOpacity={0.8}
                style={styles.resendBtn}
              >
                <LinearGradient
                  colors={['rgba(73,192,188,0.18)', 'rgba(73,192,188,0.08)']}
                  style={styles.resendBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="refresh" size={14} color={PROF.accent} />
                  <Text style={styles.resendBtnText}>Reenviar código</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.resendCountdownPill}>
                <Ionicons name="time-outline" size={14} color={PROF.textMuted} />
                <Text style={styles.resendCountdownText}>
                  Reenviar en{' '}<Text style={styles.resendCountdownTime}>{resendFormatted}</Text>
                </Text>
              </View>
            )}
          </Animated.View>

        </View>
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

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PROF.accentDim,
    borderWidth: 1.5,
    borderColor: PROF.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  iconText: { fontSize: 32 },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
    color: PROF.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textSecondary,
    textAlign: 'center',
  },
  emailText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    color: PROF.accent,
    marginTop: 4,
    textAlign: 'center',
  },

  // Digit boxes
  codeRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  digitBox: {
    width: 64,
    height: 76,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: PROF.glass,
    borderWidth: 1.5,
    borderColor: PROF.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBoxActive: {
    borderColor: PROF.accent,
    backgroundColor: 'rgba(73,192,188,0.1)',
  },
  digitBoxError: {
    borderColor: PROF.error || '#FF5B5B',
    backgroundColor: 'rgba(255,91,91,0.08)',
  },
  digitBoxFilled: {
    borderColor: PROF.accent,
    backgroundColor: 'rgba(73,192,188,0.14)',
    shadowColor: PROF.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  digitTextFilled: {
    color: PROF.accent,
  },
  digitText: {
    fontSize: 32,
    fontWeight: '700',
    color: PROF.textPrimary,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  cursor: {
    position: 'absolute',
    bottom: 16,
    width: 2,
    height: 20,
    borderRadius: 1,
    backgroundColor: PROF.accent,
    opacity: 0.9,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },

  // Timer
  timerRow: { marginBottom: 16 },
  timerBadge: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(73,192,188,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(73,192,188,0.22)',
  },
  timerBadgeExpired: {
    backgroundColor: 'rgba(255,91,91,0.1)',
    borderColor: 'rgba(255,91,91,0.28)',
  },
  timerText: { fontSize: TYPOGRAPHY.sm, color: PROF.accent, fontWeight: '500' },
  timerTextExpired: { color: PROF.error || '#FF5B5B' },

  // Error
  errorText: {
    color: PROF.error || '#FF5B5B',
    fontSize: TYPOGRAPHY.sm,
    textAlign: 'center',
    marginBottom: 14,
    maxWidth: 280,
    lineHeight: 18,
  },

  // Verify button
  button: {
    width: '100%',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    shadowColor: PROF.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 4,
  },
  buttonGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.45, shadowOpacity: 0 },
  buttonText: { color: '#fff', fontSize: TYPOGRAPHY.lg, fontWeight: '700' },

  // Resend
  resendWrapper: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: 10,
  },
  resendLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textSecondary,
  },
  resendLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resendSendingText: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.accent,
  },
  resendBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(73,192,188,0.3)',
  },
  resendBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resendBtnText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
    color: PROF.accent,
  },
  resendCountdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  resendCountdownIcon: {
    fontSize: 14,
  },
  resendCountdownText: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textMuted,
  },
  resendCountdownTime: {
    fontWeight: '700',
    fontSize: TYPOGRAPHY.md,
    color: PROF.accent,
  },

  // Success
  successBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(73,192,188,0.18)',
    borderWidth: 2,
    borderColor: PROF.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIcon: { fontSize: 44, color: PROF.accent },
  successTitle: { fontSize: TYPOGRAPHY.xxxl, fontWeight: '800', color: PROF.textPrimary, marginBottom: 8 },
  successSub: { fontSize: TYPOGRAPHY.md, color: PROF.textSecondary },
});

