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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function LoginScreen({ navigation }) {
  const { login, loginWithGoogle, devLogin } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [quickLoading, setQuickLoading] = useState(null);

  const btnScale = useSharedValue(1);
  const btnGlow = useSharedValue(0);

  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
    shadowOpacity: interpolate(btnGlow.value, [0, 1], [0.25, 0.55]),
    shadowRadius: interpolate(btnGlow.value, [0, 1], [6, 15]),
    elevation: interpolate(btnGlow.value, [0, 1], [3, 10]),
  }));

  const handleQuickLogin = (role) => {
    setQuickLoading(role);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    devLogin(role === 'profesional' ? 'SERVICE_PROVIDER' : 'CUSTOMER');
    setQuickLoading(null);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) Alert.alert('Error al ingresar', result.message);
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    setGoogleLoading(false);
    if (!result.success) {
      const isExpoGoLimit = result.message?.includes('build nativo') || result.message?.includes('expo run');
      Alert.alert(
        isExpoGoLimit ? 'Solo en build nativo' : 'Error',
        isExpoGoLimit
          ? 'Google Sign-In requiere un build nativo.\nEjecuta: expo run:android / expo run:ios'
          : result.message
      );
    }
  };

  return (
    <LinearGradient colors={['#000F22', '#001B38', '#0a2a42']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ── */}
          <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="home" size={28} color={PROF.accent} />
            </View>
            <Text style={styles.logoText}>HOMECARE</Text>
            <Text style={styles.tagline}>Servicios a tu alcance</Text>
          </Animated.View>

          {/* ── Card Form ── */}
          <Animated.View entering={FadeInDown.duration(600).delay(120).springify()} style={styles.card}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color={PROF.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor={PROF.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={PROF.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={PROF.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={PROF.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Olvidé contraseña */}
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {/* Botón principal */}
            <Animated.View style={[styles.primaryBtn, loading && styles.btnDisabled, btnAnimStyle]}>
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
                onPressIn={() => {
                  btnScale.value = withSpring(0.96, { damping: 10, stiffness: 300 });
                  btnGlow.value = withTiming(1, { duration: 120 });
                }}
                onPressOut={() => {
                  btnScale.value = withSpring(1, { damping: 10, stiffness: 300 });
                  btnGlow.value = withTiming(0, { duration: 400 });
                }}
                style={{ overflow: 'hidden', borderRadius: BORDER_RADIUS.md }}
              >
                <LinearGradient colors={PROF.gradAccent} style={styles.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Iniciar sesión</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Divisor */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator color={PROF.textSecondary} />
              ) : (
                <>
                  <View style={styles.googleIconCircle}>
                    <Text style={styles.googleG}>G</Text>
                  </View>
                  <Text style={styles.googleBtnText}>Continuar con Google</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* ── Enlace a registro ── */}
          <Animated.View entering={FadeInDown.duration(600).delay(240).springify()} style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('RoleSelection')}>
              <Text style={styles.footerLink}>Regístrate</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── DEV quick access ── */}
          <Animated.View entering={FadeIn.duration(400).delay(400)} style={styles.devSection}>
            <Text style={styles.devLabel}>⚡ DEV</Text>
            <View style={styles.devRow}>
              <TouchableOpacity
                style={[styles.devBtn, { backgroundColor: 'rgba(14,77,104,0.6)' }]}
                onPress={() => handleQuickLogin('profesional')}
                disabled={!!quickLoading}
              >
                {quickLoading === 'profesional' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.devBtnText}>👷 Profesional</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devBtn, { backgroundColor: 'rgba(20,100,60,0.6)' }]}
                onPress={() => handleQuickLogin('usuario')}
                disabled={!!quickLoading}
              >
                {quickLoading === 'usuario' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.devBtnText}>👤 Usuario</Text>
                )}
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
    alignItems: 'stretch',
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PROF.accentDim,
    borderWidth: 1.5,
    borderColor: PROF.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: PROF.textPrimary,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textSecondary,
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // Card
  card: {
    backgroundColor: PROF.glass,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },

  // Inputs
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
    color: PROF.textSecondary,
    marginBottom: 8,
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
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.md,
    color: PROF.textPrimary,
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 8,
  },

  // Forgot
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: SPACING.lg,
  },
  forgotText: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.accent,
  },

  // Primary button
  primaryBtn: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    shadowColor: PROF.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.65,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: PROF.glassBorder,
  },
  dividerText: {
    marginHorizontal: SPACING.sm,
    fontSize: TYPOGRAPHY.xs,
    color: PROF.textMuted,
    letterSpacing: 0.3,
  },

  // Google
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 15,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  googleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(66,133,244,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(66,133,244,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    color: PROF.textPrimary,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textSecondary,
  },
  footerLink: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
    color: PROF.accent,
  },

  // DEV
  devSection: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: SPACING.md,
  },
  devLabel: {
    fontSize: 11,
    color: PROF.textMuted,
    marginBottom: SPACING.sm,
    letterSpacing: 1,
  },
  devRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  devBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  devBtnText: {
    color: PROF.textPrimary,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
});
