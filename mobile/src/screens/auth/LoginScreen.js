import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../../context/AuthContext';
import { signInWithGoogleCredential } from '../../services/firebaseAuthService';
import { GOOGLE_IDS } from '../../services/firebaseAuthService';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

// Necesario para que expo-web-browser cierre la sesiÃ³n correctamente al retornar
WebBrowser.maybeCompleteAuthSession();

// â”€â”€â”€ Modal de selecciÃ³n de rol para nuevos usuarios de Google â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RoleSelectionModal({ visible, loading, onSelect, onClose }) {
  const scaleUser = useSharedValue(1);
  const scaleProf = useSharedValue(1);
  const animUser  = useAnimatedStyle(() => ({ transform: [{ scale: scaleUser.value }] }));
  const animProf  = useAnimatedStyle(() => ({ transform: [{ scale: scaleProf.value }] }));

  const press = (sv)  => () => { sv.value = withSpring(0.94, { damping: 10 }); };
  const rlse  = (sv)  => () => { sv.value = withSpring(1, { damping: 10 }); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modal.backdrop}>
        <Animated.View entering={ZoomIn.duration(320).springify()} style={modal.card}>
          <Text style={modal.title}>Â¿CÃ³mo vas a usar{'\n'}Homecare?</Text>
          <Text style={modal.subtitle}>
            Elige tu perfil para personalizar tu experiencia.
          </Text>

          {/* OpciÃ³n CLIENTE */}
          <Animated.View style={[animUser, { marginBottom: 12 }]}>
            <TouchableOpacity
              style={modal.option}
              onPress={() => onSelect('CUSTOMER')}
              onPressIn={press(scaleUser)}
              onPressOut={rlse(scaleUser)}
              activeOpacity={0.9}
              disabled={loading}
            >
              <View style={[modal.optionIcon, { backgroundColor: 'rgba(73,192,188,0.15)' }]}>
                <Ionicons name="person-outline" size={26} color={PROF.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={modal.optionTitle}>Soy Cliente</Text>
                <Text style={modal.optionDesc}>Busco servicios de limpieza y hogar</Text>
              </View>
              {loading === 'CUSTOMER' ? (
                <ActivityIndicator color={PROF.accent} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={PROF.textMuted} />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* OpciÃ³n PROFESIONAL */}
          <Animated.View style={animProf}>
            <TouchableOpacity
              style={modal.option}
              onPress={() => onSelect('SERVICE_PROVIDER')}
              onPressIn={press(scaleProf)}
              onPressOut={rlse(scaleProf)}
              activeOpacity={0.9}
              disabled={loading}
            >
              <View style={[modal.optionIcon, { backgroundColor: 'rgba(14,77,104,0.35)' }]}>
                <Ionicons name="construct-outline" size={26} color="#57c8e8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={modal.optionTitle}>Soy Profesional</Text>
                <Text style={modal.optionDesc}>Ofrezco servicios a domicilio</Text>
              </View>
              {loading === 'SERVICE_PROVIDER' ? (
                <ActivityIndicator color="#57c8e8" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={PROF.textMuted} />
              )}
            </TouchableOpacity>
          </Animated.View>

          <Pressable style={modal.cancel} onPress={onClose}>
            <Text style={modal.cancelText}>Cancelar</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// â”€â”€â”€ Pantalla principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function LoginScreen({ navigation }) {
  const { login, loginWithGoogle, devLogin } = useAuth();
  const insets       = useSafeAreaInsets();
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [loading,      setLoading]      = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [quickLoading, setQuickLoading] = useState(null);

  // Estado para el modal de selecciÃ³n de rol (nuevo usuario Google)
  const [roleModal,    setRoleModal]    = useState(false);
  const [roleLoading,  setRoleLoading]  = useState(null);   // 'CUSTOMER' | 'SERVICE_PROVIDER'
  const [pendingGToken, setPendingGToken] = useState(null); // Firebase token guardado hasta que el usuario elija rol

  // Animaciones botÃ³n principal
  const btnScale = useSharedValue(1);
  const btnGlow  = useSharedValue(0);
  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
    shadowOpacity: interpolate(btnGlow.value, [0, 1], [0.25, 0.55]),
    shadowRadius:  interpolate(btnGlow.value, [0, 1], [6, 15]),
    elevation:     interpolate(btnGlow.value, [0, 1], [3, 10]),
  }));

  // â”€â”€â”€ Hook expo-auth-session / Google (Expo Go flow) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId    : GOOGLE_IDS.webClientId,
    iosClientId    : GOOGLE_IDS.iosClientId,
    // androidClientId: aÃ±adir cuando tengas el SHA-1 en Firebase Console
  });

  // Maneja la respuesta del browser OAuth2 (solo en Expo Go)
  useEffect(() => {
    if (response?.type !== 'success') return;

    const finishGoogleLogin = async () => {
      setGoogleLoading(true);
      try {
        const { authentication } = response;
        // Si Google devuelve id_token lo usamos; si no, usamos access_token
        const firebaseIdToken = await signInWithGoogleCredential(
          authentication.accessToken,
          authentication.idToken ?? null,
        );
        const result = await loginWithGoogle(firebaseIdToken);
        if (result.isNewUser) {
          // Nuevo usuario â†’ pedir rol antes de completar el login
          setPendingGToken(firebaseIdToken);
          setRoleModal(true);
        } else if (!result.success) {
          Alert.alert('Error', result.message || 'Error al iniciar sesiÃ³n con Google');
        }
      } catch (err) {
        Alert.alert('Error', err.message || 'Error al iniciar sesiÃ³n con Google');
      } finally {
        setGoogleLoading(false);
      }
    };

    finishGoogleLogin();
  }, [response]); // eslint-disable-line react-hooks/exhaustive-deps

  // â”€â”€â”€ BotÃ³n "Continuar con Google" â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleGoogleLogin = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGoogleLoading(true);

    // Intento 1: flujo nativo (@react-native-google-signin)
    const result = await loginWithGoogle();

    if (result.needsHook) {
      // Expo Go â†’ activar el hook expo-auth-session
      await promptAsync();
      // googleLoading se desactiva cuando el useEffect termine
      return;
    }

    setGoogleLoading(false);

    if (result.isNewUser) {
      // Nuevo usuario nativo â†’ pedir rol
      setPendingGToken(result.pendingFirebaseToken);
      setRoleModal(true);
      return;
    }

    if (!result.success) {
      Alert.alert('Error', result.message || 'Error al iniciar sesiÃ³n con Google');
    }
  }, [loginWithGoogle, promptAsync]);

  // â”€â”€â”€ Confirmar selecciÃ³n de rol (usuarios nuevos Google) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleRoleSelected = useCallback(async (selectedRole) => {
    if (!pendingGToken) return;
    setRoleLoading(selectedRole);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await loginWithGoogle(pendingGToken, selectedRole);
    setRoleLoading(null);
    if (!result.success) {
      Alert.alert('Error', result.message || 'Error al completar el registro');
    } else {
      setRoleModal(false);
      setPendingGToken(null);
    }
  }, [pendingGToken, loginWithGoogle]);

  // â”€â”€â”€ Login con email/contraseÃ±a â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  const handleQuickLogin = async (role) => {
    setQuickLoading(role);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await devLogin(role === 'profesional' ? 'SERVICE_PROVIDER' : 'CUSTOMER');
    setQuickLoading(null);
    if (!result.success) {
      Alert.alert('Error DEV Login', result.message || 'No se pudo iniciar sesión de desarrollo');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#000F22', '#001B38', '#0a2a42']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* â”€â”€ Logo â”€â”€ */}
          <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="home" size={28} color={PROF.accent} />
            </View>
            <Text style={styles.logoText}>HOMECARE</Text>
            <Text style={styles.tagline}>Servicios a tu alcance</Text>
          </Animated.View>

          {/* â”€â”€ Card Form â”€â”€ */}
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
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={PROF.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Olvidé contraseña */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {/* BotÃ³n principal */}
            <Animated.View style={[styles.primaryBtn, loading && styles.btnDisabled, btnAnimStyle]}>
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
                onPressIn={() => {
                  btnScale.value = withSpring(0.96, { damping: 10, stiffness: 300 });
                  btnGlow.value  = withTiming(1, { duration: 120 });
                }}
                onPressOut={() => {
                  btnScale.value = withSpring(1, { damping: 10, stiffness: 300 });
                  btnGlow.value  = withTiming(0, { duration: 400 });
                }}
                style={{ overflow: 'hidden', borderRadius: BORDER_RADIUS.md }}
              >
                <LinearGradient
                  colors={PROF.gradAccent}
                  style={styles.primaryBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
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
              style={[styles.googleBtn, (googleLoading || !request) && styles.btnDisabled]}
              onPress={handleGoogleLogin}
              disabled={googleLoading || !request}
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

          {/* â”€â”€ Registro â”€â”€ */}
          <Animated.View entering={FadeInDown.duration(600).delay(240).springify()} style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('RoleSelection')}>
              <Text style={styles.footerLink}>Regístrate</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* â”€â”€ DEV quick access â”€â”€ */}
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

      {/* â”€â”€ Modal rol nuevo usuario Google â”€â”€ */}
      <RoleSelectionModal
        visible={roleModal}
        loading={roleLoading}
        onSelect={handleRoleSelected}
        onClose={() => {
          setRoleModal(false);
          setPendingGToken(null);
        }}
      />
    </LinearGradient>
  );
}

// â”€â”€â”€ Estilos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  inputGroup: { marginBottom: SPACING.md },
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
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.md,
    color: PROF.textPrimary,
    height: '100%',
  },
  eyeBtn: { padding: 4, marginLeft: 8 },

  // Forgot
  forgotBtn: { alignSelf: 'flex-end', marginTop: 2, marginBottom: SPACING.lg },
  forgotText: { fontSize: TYPOGRAPHY.sm, color: PROF.accent },

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
  btnDisabled: { opacity: 0.65 },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: PROF.glassBorder },
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
  googleG: { fontSize: 16, fontWeight: '800', color: '#4285F4' },
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
  footerText: { fontSize: TYPOGRAPHY.sm, color: PROF.textSecondary },
  footerLink: { fontSize: TYPOGRAPHY.sm, fontWeight: '700', color: PROF.accent },

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
  devRow: { flexDirection: 'row', gap: SPACING.sm, width: '100%' },
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

// â”€â”€â”€ Estilos del modal de rol â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const modal = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#001B38',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(73,192,188,0.2)',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
  },
  optionDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  cancel: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
});
