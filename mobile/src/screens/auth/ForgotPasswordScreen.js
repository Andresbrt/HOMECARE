/**
 * ForgotPasswordScreen — Recuperación de contraseña en 3 pasos
 * Paso 1: Ingresa email → envía OTP
 * Paso 2: Ingresa código de 4 dígitos
 * Paso 3: Nueva contraseña + confirmación
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import GlassCard from '../../components/shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { getPasswordStrength } from '../../utils/passwordUtils';

// ─── Componente principal ────────────────────────────────────────────────────
export default function ForgotPasswordScreen({ navigation }) {
  const { sendForgotPasswordOTP, verifyForgotPasswordOTP, resetPasswordWithOTP } = useAuth();
  const insets = useSafeAreaInsets();

  // ── Estado de pasos ─────────────────────────────────────────────────────
  const [step, setStep]       = useState(1); // 1 | 2 | 3
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // ── Paso 1: Email ───────────────────────────────────────────────────────
  const [email, setEmail] = useState('');

  // ── Paso 2: OTP ─────────────────────────────────────────────────────────
  const [code, setCode]   = useState('');
  const otpRef   = useRef(null);
  const prevLen  = useRef(0);
  const d0Scale  = useSharedValue(1);
  const d1Scale  = useSharedValue(1);
  const d2Scale  = useSharedValue(1);
  const d3Scale  = useSharedValue(1);
  const digitScales = [d0Scale, d1Scale, d2Scale, d3Scale];

  // ── Paso 3: Nueva contraseña ────────────────────────────────────────────
  const [newPass, setNewPass]         = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Animaciones ─────────────────────────────────────────────────────────
  const shakeX     = useSharedValue(0);
  const btnGlow    = useSharedValue(0.55);
  const btnScale   = useSharedValue(1);
  const progressW  = useSharedValue(1 / 3);

  useEffect(() => {
    progressW.value = withTiming(step / 3, { duration: 380 });
  }, [step]);

  useEffect(() => {
    btnGlow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1400 }), withTiming(0.4, { duration: 1400 })),
      -1, true,
    );
  }, []);

  // Focus OTP input al entrar en paso 2
  useEffect(() => {
    if (step === 2) setTimeout(() => otpRef.current?.focus(), 350);
  }, [step]);

  // Pulse por dígito al escribir
  useEffect(() => {
    const newLen = code.length;
    if (newLen > prevLen.current && newLen > 0) {
      const idx = newLen - 1;
      digitScales[idx].value = withSequence(
        withTiming(0.8,  { duration: 60 }),
        withSpring(1.12, { damping: 10 }),
        withSpring(1,    { damping: 12 }),
      );
    }
    prevLen.current = newLen;
  }, [code]);

  // ── Animaciones derived ─────────────────────────────────────────────────
  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming( 8, { duration: 70 }),
      withTiming(-8, { duration: 70 }),
      withTiming( 5, { duration: 70 }),
      withTiming(-5, { duration: 70 }),
      withTiming( 0, { duration: 70 }),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const shakeStyle    = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const glowStyle     = useAnimatedStyle(() => ({ opacity: interpolate(btnGlow.value, [0, 1], [0.3, 0.7]) }));
  const scaleStyle    = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));
  const progressStyle = useAnimatedStyle(() => ({ width: `${progressW.value * 100}%` }));
  const d0Anim = useAnimatedStyle(() => ({ transform: [{ scale: d0Scale.value }] }));
  const d1Anim = useAnimatedStyle(() => ({ transform: [{ scale: d1Scale.value }] }));
  const d2Anim = useAnimatedStyle(() => ({ transform: [{ scale: d2Scale.value }] }));
  const d3Anim = useAnimatedStyle(() => ({ transform: [{ scale: d3Scale.value }] }));
  const digitAnims = [d0Anim, d1Anim, d2Anim, d3Anim];

  // ── Paso 1: Enviar OTP ──────────────────────────────────────────────────
  const handleSendOTP = async () => {
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Ingresa un correo electrónico válido');
      triggerShake();
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await sendForgotPasswordOTP(trimmed);
    setLoading(false);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(2);
    } else {
      setError(result.message || 'Error al enviar el código');
      triggerShake();
    }
  };

  // ── Paso 2: Validar código contra el backend ──────────────────────────
  const handleVerifyCode = async () => {
    setError('');
    if (code.length < 4) {
      setError('Ingresa los 4 dígitos del código');
      triggerShake();
      return;
    }
    setLoading(true);
    const result = await verifyForgotPasswordOTP(email.trim().toLowerCase(), code);
    setLoading(false);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(3);
    } else {
      setError(result.message || 'Código inválido o expirado');
      triggerShake();
    }
  };

  // ── Paso 3: Restablecer contraseña ──────────────────────────────────────
  const handleResetPassword = async () => {
    setError('');
    if (newPass.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      triggerShake();
      return;
    }
    if (newPass !== confirmPass) {
      setError('Las contraseñas no coinciden');
      triggerShake();
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await resetPasswordWithOTP(email.trim().toLowerCase(), code, newPass);
    setLoading(false);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } else {
      setError(result.message || 'Error al restablecer la contraseña');
      triggerShake();
    }
  };

  const handleCTA = step === 1 ? handleSendOTP : step === 2 ? handleVerifyCode : handleResetPassword;
  const ctaLabel  = step === 1 ? 'Enviar código'
    : step === 2 ? 'Verificar código'
    : 'Restablecer contraseña';

  const strength = getPasswordStrength(newPass);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <LinearGradient colors={PROF.gradMain} style={StyleSheet.absoluteFill} />

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (step > 1 ? setStep(s => s - 1) : navigation.goBack())}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={PROF.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Recuperar contraseña</Text>
      </View>

      {/* ── Barra de progreso ── */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>

      {/* ── Indicadores de paso ── */}
      <Animated.View entering={FadeIn.duration(350)} style={styles.stepsRow}>
        {[1, 2, 3].map(n => (
          <View key={n} style={[styles.stepDot, step >= n && styles.stepDotActive]}>
            {step > n
              ? <Ionicons name="checkmark" size={12} color={PROF.bgDeep} />
              : <Text style={[styles.stepNum, step === n && styles.stepNumActive]}>{n}</Text>
            }
          </View>
        ))}
      </Animated.View>

      {/* ── Contenido por paso ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Paso 1: Email ── */}
          {step === 1 && (
            <Animated.View entering={FadeInDown.duration(420).springify()}>
              <Animated.View style={shakeStyle}>
                <GlassCard variant="default" style={styles.card}>
                  <View style={styles.cardIcon}>
                    <LinearGradient colors={PROF.gradAccent} style={styles.iconCircle}>
                      <Ionicons name="mail-outline" size={28} color={PROF.bgDeep} />
                    </LinearGradient>
                  </View>
                  <Text style={styles.cardTitle}>Ingresa tu correo</Text>
                  <Text style={styles.cardSubtitle}>
                    Te enviaremos un código de 4 dígitos para verificar tu identidad.
                  </Text>
                  <View style={[styles.inputWrap, !!error && styles.inputError]}>
                    <Ionicons name="mail-outline" size={18} color={PROF.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="correo@ejemplo.com"
                      placeholderTextColor={PROF.textMuted}
                      value={email}
                      onChangeText={t => { setEmail(t); setError(''); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleSendOTP}
                    />
                  </View>
                  {!!error && <Text style={styles.errorText}>{error}</Text>}
                </GlassCard>
              </Animated.View>
            </Animated.View>
          )}

          {/* ── Paso 2: OTP ── */}
          {step === 2 && (
            <Animated.View entering={FadeInDown.duration(420).springify()}>
              <Animated.View style={shakeStyle}>
                <GlassCard variant="default" style={styles.card}>
                  <View style={styles.cardIcon}>
                    <LinearGradient colors={PROF.gradAccent} style={styles.iconCircle}>
                      <Ionicons name="key-outline" size={28} color={PROF.bgDeep} />
                    </LinearGradient>
                  </View>
                  <Text style={styles.cardTitle}>Verifica tu identidad</Text>
                  <Text style={styles.cardSubtitle}>
                    Ingresa el código de 4 dígitos enviado a{'\n'}
                    <Text style={styles.emailHighlight}>{email}</Text>
                  </Text>

                  {/* Input oculto */}
                  <TextInput
                    ref={otpRef}
                    style={styles.hiddenInput}
                    value={code}
                    onChangeText={t => {
                      if (/^\d{0,4}$/.test(t)) { setCode(t); setError(''); }
                    }}
                    keyboardType="number-pad"
                    maxLength={4}
                    caretHidden
                  />

                  {/* Cajas de dígitos */}
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => otpRef.current?.focus()}
                    style={styles.digitsRow}
                  >
                    {[0, 1, 2, 3].map(i => {
                      const digit   = code[i] ?? '';
                      const isFocus = code.length === i;
                      return (
                        <Animated.View
                          key={i}
                          style={[
                            styles.digitBox,
                            digit   && styles.digitBoxFilled,
                            isFocus && styles.digitBoxFocus,
                            digitAnims[i],
                          ]}
                        >
                          <Text style={styles.digitChar}>{digit}</Text>
                        </Animated.View>
                      );
                    })}
                  </TouchableOpacity>

                  {!!error && <Text style={styles.errorText}>{error}</Text>}

                  <TouchableOpacity
                    style={styles.resendRow}
                    onPress={() => { setCode(''); setStep(1); }}
                  >
                    <Ionicons name="refresh-outline" size={14} color={PROF.accent} />
                    <Text style={styles.resendText}>Volver a enviar el código</Text>
                  </TouchableOpacity>
                </GlassCard>
              </Animated.View>
            </Animated.View>
          )}

          {/* ── Paso 3: Nueva contraseña ── */}
          {step === 3 && (
            <Animated.View entering={FadeInDown.duration(420).springify()}>
              <Animated.View style={shakeStyle}>
                <GlassCard variant="default" style={styles.card}>
                  <View style={styles.cardIcon}>
                    <LinearGradient colors={PROF.gradAccent} style={styles.iconCircle}>
                      <Ionicons name="lock-closed-outline" size={28} color={PROF.bgDeep} />
                    </LinearGradient>
                  </View>
                  <Text style={styles.cardTitle}>Nueva contraseña</Text>
                  <Text style={styles.cardSubtitle}>Crea una contraseña segura para tu cuenta.</Text>

                  {/* Nueva contraseña */}
                  <Text style={styles.fieldLabel}>Contraseña nueva</Text>
                  <View style={[styles.inputWrap, !!error && styles.inputError]}>
                    <Ionicons name="lock-closed-outline" size={18} color={PROF.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Mínimo 8 caracteres"
                      placeholderTextColor={PROF.textMuted}
                      value={newPass}
                      onChangeText={t => { setNewPass(t); setError(''); }}
                      secureTextEntry={!showPass}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                    />
                    <TouchableOpacity onPress={() => setShowPass(s => !s)} style={styles.eyeBtn}>
                      <Ionicons
                        name={showPass ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={PROF.textMuted}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Barra de fuerza */}
                  {newPass.length > 0 && (
                    <Animated.View
                      entering={FadeInDown.duration(300).springify()}
                      style={styles.strengthWrap}
                    >
                      <View style={styles.strengthTrack}>
                        {[0, 1, 2, 3, 4].map(i => (
                          <View
                            key={i}
                            style={[
                              styles.strengthSeg,
                              i <= strength.level && { backgroundColor: strength.color },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.strengthLabel, { color: strength.color }]}>
                        {strength.label}
                      </Text>
                    </Animated.View>
                  )}

                  {/* Confirmar contraseña */}
                  <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Confirmar contraseña</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      confirmPass.length > 0 && newPass !== confirmPass && styles.inputError,
                    ]}
                  >
                    <Ionicons name="lock-open-outline" size={18} color={PROF.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Repite la contraseña"
                      placeholderTextColor={PROF.textMuted}
                      value={confirmPass}
                      onChangeText={t => { setConfirmPass(t); setError(''); }}
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleResetPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(s => !s)} style={styles.eyeBtn}>
                      <Ionicons
                        name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={
                          confirmPass.length > 0 && newPass !== confirmPass
                            ? PROF.error
                            : PROF.textMuted
                        }
                      />
                    </TouchableOpacity>
                  </View>
                  {!!error && <Text style={styles.errorText}>{error}</Text>}
                </GlassCard>
              </Animated.View>
            </Animated.View>
          )}

          {/* ── Botón CTA ── */}
          <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.ctaWrap}>
            <Animated.View style={[styles.ctaGlow, glowStyle]} />
            <Animated.View style={scaleStyle}>
              <TouchableOpacity
                onPress={handleCTA}
                onPressIn={() => { btnScale.value = withSpring(0.96, { damping: 14 }); }}
                onPressOut={() => { btnScale.value = withSpring(1,    { damping: 14 }); }}
                disabled={loading}
                activeOpacity={1}
              >
                <LinearGradient colors={PROF.gradAccent} style={styles.ctaBtn}>
                  {loading
                    ? <ActivityIndicator size="small" color={PROF.bgDeep} />
                    : (
                      <>
                        <Text style={styles.ctaLabel}>{ctaLabel}</Text>
                        <Ionicons name="arrow-forward" size={18} color={PROF.bgDeep} />
                      </>
                    )
                  }
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* ── Link volver al login ── */}
          {step === 1 && (
            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.loginRow}>
              <Text style={styles.loginText}>¿Ya recuerdas tu contraseña? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Iniciar sesión</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const DIGIT_SIZE = 58;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PROF.bgDeep },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingBottom: 12, gap: SPACING.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: PROF.textPrimary },

  progressTrack: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: SPACING.lg, borderRadius: 2, marginBottom: SPACING.md,
  },
  progressFill: { height: 3, backgroundColor: PROF.accent, borderRadius: 2 },

  stepsRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 12, marginBottom: SPACING.lg,
  },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: { backgroundColor: PROF.accent, borderColor: PROF.accent },
  stepNum: { fontSize: 12, fontWeight: '700', color: PROF.textMuted },
  stepNumActive: { color: PROF.bgDeep },

  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },

  card: { marginBottom: SPACING.lg },
  cardIcon: { alignItems: 'center', marginBottom: SPACING.md },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20, fontWeight: '700', color: PROF.textPrimary,
    textAlign: 'center', marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14, color: PROF.textSecondary, textAlign: 'center',
    lineHeight: 20, marginBottom: SPACING.lg,
  },
  emailHighlight: { color: PROF.accent, fontWeight: '600' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: PROF.textSecondary, marginBottom: 6 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, height: 52, marginBottom: SPACING.xs,
  },
  inputError: { borderColor: PROF.error },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: PROF.textPrimary, fontSize: 15 },
  eyeBtn: { padding: 4 },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },

  errorText: { fontSize: 13, color: PROF.error, marginTop: 2, marginBottom: 4 },

  digitsRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 12, marginVertical: SPACING.lg,
  },
  digitBox: {
    width: DIGIT_SIZE, height: DIGIT_SIZE,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: PROF.glassBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  digitBoxFilled: { borderColor: PROF.accent, backgroundColor: 'rgba(73,192,188,0.12)' },
  digitBoxFocus:  {
    borderColor: PROF.accent,
    shadowColor: PROF.accent, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  digitChar: { fontSize: 24, fontWeight: '700', color: PROF.textPrimary },

  resendRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: SPACING.sm,
  },
  resendText: { fontSize: 13, color: PROF.accent, fontWeight: '600' },

  strengthWrap: { marginTop: 6, marginBottom: 2 },
  strengthTrack: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  strengthSeg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  strengthLabel: { fontSize: 11, fontWeight: '600', textAlign: 'right' },

  ctaWrap: { position: 'relative', marginTop: SPACING.sm, marginBottom: SPACING.md },
  ctaGlow: {
    position: 'absolute', top: -8, left: '10%', right: '10%', bottom: -8,
    backgroundColor: PROF.accent, borderRadius: BORDER_RADIUS.xl,
    shadowColor: PROF.accent, shadowOpacity: 1, shadowRadius: 15, elevation: 0,
  },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 54, borderRadius: BORDER_RADIUS.xl,
    shadowColor: PROF.accent, shadowOpacity: 0.55, shadowRadius: 10, elevation: 8,
  },
  ctaLabel: { fontSize: 16, fontWeight: '700', color: PROF.bgDeep },

  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xs },
  loginText: { fontSize: 14, color: PROF.textSecondary },
  loginLink: { fontSize: 14, fontWeight: '700', color: PROF.accent },
});
