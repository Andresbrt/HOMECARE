/**
 * ResetPasswordScreen — Nueva contraseña (token desde email)
 * PROF dark theme con accesibilidad completa y validación en tiempo real.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
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
import { authService } from '../../services/authService';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { getPasswordStrength } from '../../utils/passwordUtils';

export default function ResetPasswordScreen({ route, navigation }) {
  const { token } = route.params || {};
  const insets = useSafeAreaInsets();

  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]         = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const shakeX   = useSharedValue(0);
  const btnGlow  = useSharedValue(0.55);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    btnGlow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1400 }), withTiming(0.4, { duration: 1400 })),
      -1, true,
    );
  }, []);

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

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const glowStyle  = useAnimatedStyle(() => ({ opacity: interpolate(btnGlow.value, [0, 1], [0.3, 0.7]) }));
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handleReset = async () => {
    setError('');
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      triggerShake();
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      triggerShake();
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await authService.resetPassword(token, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.mensaje ||
        'No se pudo restablecer la contraseña'
      );
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <View style={styles.screen}>
        <LinearGradient colors={PROF.gradMain} style={StyleSheet.absoluteFill} />
        <View style={styles.invalidWrap}>
          <Ionicons name="alert-circle-outline" size={64} color={PROF.error} />
          <Text style={styles.invalidText}>Enlace no válido o expirado</Text>
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'ForgotPassword' }] })}
          >
            <Text style={styles.backLinkText}>Solicitar nuevo enlace</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const strength = getPasswordStrength(password);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={PROF.gradMain} style={StyleSheet.absoluteFill} />

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={PROF.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Nueva contraseña</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(450).springify()}>
            <Animated.View style={shakeStyle}>
              <GlassCard variant="default" style={styles.card}>
                <View style={styles.cardIcon}>
                  <LinearGradient colors={PROF.gradAccent} style={styles.iconCircle}>
                    <Ionicons name="lock-closed-outline" size={28} color={PROF.bgDeep} />
                  </LinearGradient>
                </View>
                <Text style={styles.cardTitle}>Crea tu nueva contraseña</Text>
                <Text style={styles.cardSubtitle}>
                  Elige una contraseña segura y recuérdala bien.
                </Text>

                {/* Nueva contraseña */}
                <Text style={styles.fieldLabel}>Contraseña nueva</Text>
                <View style={[styles.inputWrap, !!error && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={18} color={PROF.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor={PROF.textMuted}
                    value={password}
                    onChangeText={t => { setPassword(t); setError(''); }}
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

                {/* Fuerza */}
                {password.length > 0 && (
                  <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.strengthWrap}>
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
                    confirmPassword.length > 0 && password !== confirmPassword && styles.inputError,
                  ]}
                >
                  <Ionicons name="lock-open-outline" size={18} color={PROF.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Repite la contraseña"
                    placeholderTextColor={PROF.textMuted}
                    value={confirmPassword}
                    onChangeText={t => { setConfirmPassword(t); setError(''); }}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleReset}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(s => !s)} style={styles.eyeBtn}>
                    <Ionicons
                      name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={
                        confirmPassword.length > 0 && password !== confirmPassword
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

          {/* CTA */}
          <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.ctaWrap}>
            <Animated.View style={[styles.ctaGlow, glowStyle]} />
            <Animated.View style={scaleStyle}>
              <TouchableOpacity
                onPress={handleReset}
                onPressIn={() => { btnScale.value = withSpring(0.96, { damping: 14 }); }}
                onPressOut={() => { btnScale.value = withSpring(1,    { damping: 14 }); }}
                disabled={loading}
                activeOpacity={1}
              >
                <LinearGradient colors={PROF.gradAccent} style={styles.ctaBtn}>
                  {loading
                    ? <Ionicons name="sync-outline" size={20} color={PROF.bgDeep} />
                    : (
                      <>
                        <Text style={styles.ctaLabel}>Cambiar contraseña</Text>
                        <Ionicons name="checkmark-circle-outline" size={20} color={PROF.bgDeep} />
                      </>
                    )
                  }
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

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

  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },

  card: { marginBottom: SPACING.lg },
  cardIcon: { alignItems: 'center', marginBottom: SPACING.md },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: PROF.textPrimary, textAlign: 'center', marginBottom: 6 },
  cardSubtitle: { fontSize: 14, color: PROF.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.lg },
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
  errorText: { fontSize: 13, color: PROF.error, marginTop: 2, marginBottom: 4 },

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

  invalidWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl, gap: SPACING.lg },
  invalidText: { fontSize: 18, fontWeight: '700', color: PROF.textPrimary, textAlign: 'center' },
  backLink: { marginTop: SPACING.sm },
  backLinkText: { fontSize: 15, color: PROF.accent, fontWeight: '600' },
});
