/**
 * EditProfileScreen — Editar perfil Homecare 2026
 * Nombre, apellido, teléfono, dirección + foto de avatar.
 * Guarda en Firestore y actualiza AuthContext al instante.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../../components/shared/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/firestoreService';
import { uploadAvatar } from '../../services/storageService';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

// ─── Campo de formulario ─────────────────────────────────────────────────────
function FormField({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  editable = true,
  delay = 0,
  multiline = false,
  keyboardType = 'default',
  maxLength,
  error,
}) {
  const hasError = !!error;
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)} style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        <Ionicons name={icon} size={13} color={hasError ? PROF.error : PROF.accent} />{'  '}
        {label}
      </Text>
      <View style={[styles.fieldInputWrap, hasError && styles.fieldInputError]}>
        <TextInput
          style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={PROF.textMuted}
          editable={editable}
          multiline={multiline}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize="words"
        />
      </View>
      {hasError ? <Text style={styles.fieldError}>{error}</Text> : null}
    </Animated.View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
export default function EditProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  // Estado del formulario
  const [nombre, setNombre]             = useState(user?.nombre || '');
  const [apellido, setApellido]         = useState(user?.apellido || '');
  const [telefono, setTelefono]         = useState(user?.telefono || '');
  const [direccion, setDireccion]       = useState(user?.direccion || '');
  const [fotoUri, setFotoUri]           = useState(user?.fotoPerfil || null); // URL de Firebase o null
  const [localFoto, setLocalFoto]       = useState(null); // URI temporal de la imagen seleccionada
  const [saving, setSaving]             = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  // Scroll animación
  const saveScale = useSharedValue(1);
  const saveAnim  = useAnimatedStyle(() => ({ transform: [{ scale: saveScale.value }] }));

  const photoScale = useSharedValue(1);
  const photoAnim  = useAnimatedStyle(() => ({ transform: [{ scale: photoScale.value }] }));

  // Detectar si hay cambios
  const [errors, setErrors] = useState({});
  const hasChanges =
    nombre !== (user?.nombre || '') ||
    apellido !== (user?.apellido || '') ||
    telefono !== (user?.telefono || '') ||
    direccion !== (user?.direccion || '') ||
    !!localFoto;

  // ─── Seleccionar foto ─────────────────────────────────────────────────
  const handlePickPhoto = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Pedir permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Necesitamos acceso a tu galería para cambiar la foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setLocalFoto(result.assets[0].uri);
      setFotoUri(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  // Tomar foto con cámara
  const handleTakePhoto = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Necesitamos acceso a tu cámara para tomar la foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setLocalFoto(result.assets[0].uri);
      setFotoUri(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  // ─── Validar formulario ─────────────────────────────────────────────
  const validate = useCallback(() => {
    const e = {};
    if (!nombre.trim()) e.nombre = 'El nombre es obligatorio.';
    if (!apellido.trim()) e.apellido = 'El apellido es obligatorio.';
    if (telefono.trim() && !/^[\d\s+\-()]{7,15}$/.test(telefono.trim())) {
      e.telefono = 'Número de teléfono inválido.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [nombre, apellido, telefono]);

  // ─── Guardar ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    saveScale.value = withSpring(0.96, { damping: 12 }, () => {
      saveScale.value = withSpring(1, { damping: 14 });
    });

    setSaving(true);
    setErrors({});

    try {
      // 1. Subir foto si se seleccionó una nueva
      let newPhotoUrl = user?.fotoPerfil || null;
      if (localFoto) {
        setLoadingPhoto(true);
        newPhotoUrl = await uploadAvatar(user?.id || user?.email, localFoto);
        setLoadingPhoto(false);
      }

      // 2. Guardar en Firestore
      const profileData = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        fotoPerfil: newPhotoUrl,
      };
      await updateUserProfile(user?.id || user?.email, profileData);

      // 3. Actualizar estado local (AuthContext + SecureStore)
      await updateUser(profileData);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Perfil actualizado', 'Tus cambios se han guardado correctamente.');
      navigation.goBack();
    } catch (error) {
      console.error('Error guardando perfil:', error);
      setLoadingPhoto(false);
      setSaving(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error al guardar',
        error?.message || 'No se pudo guardar el perfil. Verifica tu conexión e intenta de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  }, [nombre, apellido, telefono, direccion, localFoto, user, updateUser, navigation, validate]);

  // Iniciales para fallback del avatar
  const initials = [nombre, apellido].filter(Boolean).map(s => s[0]?.toUpperCase()).join('') || '?';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={PROF.bgDeep} />
      <LinearGradient
        colors={[PROF.bgDeep, '#0a2235', PROF.bg]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.3, 1]}
      />

      {/* ── Header ── */}
      <Animated.View entering={FadeIn.duration(350)} style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={PROF.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Editar Perfil</Text>
        <View style={{ width: 38 }} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Avatar ── */}
          <Animated.View entering={FadeInDown.delay(60).springify().damping(16)} style={styles.avatarSection}>
            <Animated.View style={photoAnim}>
              <TouchableOpacity
                onPress={handlePickPhoto}
                activeOpacity={0.85}
              >
                <View style={styles.avatarOuter}>
                  <LinearGradient
                    colors={fotoUri ? ['#49C0BC', '#0a6b6b'] : PROF.gradAccent}
                    style={styles.avatarGrad}
                  >
                    {fotoUri ? (
                      <Image
                        source={{ uri: localFoto || fotoUri }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    )}
                  </LinearGradient>
                  <View style={styles.avatarCameraBadge}>
                    <Ionicons name="camera" size={14} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.avatarHint}>Toca para cambiar tu foto</Text>

            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhoto}>
                <Ionicons name="image-outline" size={16} color={PROF.accent} />
                <Text style={styles.photoBtnLabel}>Galería</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto}>
                <Ionicons name="camera-outline" size={16} color={PROF.accent} />
                <Text style={styles.photoBtnLabel}>Cámara</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── Formulario ── */}
          <Animated.View entering={FadeInDown.delay(120).springify().damping(16)} style={styles.formSection}>
            <Text style={styles.sectionLabel}>Datos personales</Text>
            <GlassCard variant="default" padding={0} style={styles.formCard}>
              <View style={styles.formInner}>
                <FormField
                  icon="person-outline"
                  label="Nombre"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChangeText={setNombre}
                  error={errors.nombre}
                  delay={160}
                />
                <View style={styles.fieldSep} />
                <FormField
                  icon="person-outline"
                  label="Apellido"
                  placeholder="Tu apellido"
                  value={apellido}
                  onChangeText={setApellido}
                  error={errors.apellido}
                  delay={200}
                />
                <View style={styles.fieldSep} />
                <FormField
                  icon="call-outline"
                  label="Teléfono"
                  placeholder="+57 300 123 4567"
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                  error={errors.telefono}
                  delay={240}
                />
                <View style={styles.fieldSep} />
                <FormField
                  icon="location-outline"
                  label="Dirección"
                  placeholder="Cra 15 #82-45, Bogotá"
                  value={direccion}
                  onChangeText={setDireccion}
                  delay={280}
                />
              </View>
            </GlassCard>
          </Animated.View>

          {/* ── Email (solo lectura) ── */}
          {user?.email ? (
            <Animated.View entering={FadeInDown.delay(320).springify().damping(16)}>
              <GlassCard variant="default" style={styles.emailCard}>
                <View style={styles.emailRow}>
                  <View style={styles.emailIcon}>
                    <Ionicons name="mail-outline" size={18} color={PROF.textMuted} />
                  </View>
                  <View style={styles.emailInfo}>
                    <Text style={styles.emailLabel}>Email</Text>
                    <Text style={styles.emailValue}>{user.email}</Text>
                  </View>
                  <View style={styles.emailBadge}>
                    <Text style={styles.emailBadgeText}>Verificado</Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Botón Guardar (fijado abajo) ── */}
      <View style={[styles.saveBar, { paddingBottom: insets.bottom + SPACING.md }]}>
        <Animated.View style={saveAnim}>
          <TouchableOpacity
            style={[styles.saveBtn, (!hasChanges || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={hasChanges && !saving ? PROF.gradAccent : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
              style={styles.saveBtnGradient}
            >
              {saving || loadingPhoto ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={hasChanges ? '#fff' : PROF.textMuted} />
                  <Text style={[styles.saveBtnText, !hasChanges && { color: PROF.textMuted }]}>
                    {saving ? 'Guardando...' : loadingPhoto ? 'Subiendo foto...' : 'Guardar cambios'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: PROF.bgDeep },
  keyboardWrap:  { flex: 1 },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: 8 },

  // Header
  topBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: 12 },
  backBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  topBarTitle:   { flex: 1, fontSize: 17, fontWeight: '700', color: PROF.textPrimary, textAlign: 'center', marginRight: -38 },

  // Avatar
  avatarSection:    { alignItems: 'center', paddingVertical: SPACING.lg },
  avatarOuter:      { position: 'relative' },
  avatarGrad:       { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: `${PROF.accent}60`, overflow: 'hidden' },
  avatarInitials:   { fontSize: 36, fontWeight: '800', color: '#fff' },
  avatarImage:      { width: '100%', height: '100%' },
  avatarCameraBadge:{ position: 'absolute', bottom: 2, right: 2, width: 30, height: 30, borderRadius: 15, backgroundColor: PROF.accent, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: PROF.bgDeep },
  avatarHint:       { fontSize: 12, color: PROF.textMuted, marginTop: 12 },
  photoActions:     { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  photoBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full, backgroundColor: 'rgba(73,192,188,0.12)', borderWidth: 1, borderColor: `${PROF.accent}30` },
  photoBtnLabel:    { fontSize: 12, fontWeight: '600', color: PROF.accent },

  // Form
  formSection: { marginTop: SPACING.sm },
  sectionLabel:{ fontSize: 12, fontWeight: '700', color: PROF.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: SPACING.sm },
  formCard:    { overflow: 'hidden' },
  formInner:   { padding: SPACING.md },
  fieldWrap:   { gap: 6 },
  fieldLabel:  { fontSize: 12, color: PROF.textSecondary, fontWeight: '600' },
  fieldInputWrap: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    paddingHorizontal: SPACING.md,
  },
  fieldInput: {
    color: PROF.textPrimary,
    fontSize: 15,
    paddingVertical: 14,
    minHeight: 48,
  },
  fieldInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fieldInputError: {
    borderColor: PROF.error,
    backgroundColor: 'rgba(255,91,91,0.05)',
  },
  fieldError: {
    fontSize: 11,
    color: PROF.error,
    marginTop: 4,
    fontWeight: '500',
  },
  fieldSep: {
    height: 1,
    backgroundColor: PROF.border,
    marginVertical: SPACING.xs,
  },

  // Email
  emailCard:    { marginTop: SPACING.md },
  emailRow:     { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  emailIcon:    { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  emailInfo:    { flex: 1 },
  emailLabel:   { fontSize: 11, color: PROF.textMuted, fontWeight: '600' },
  emailValue:   { fontSize: 14, color: PROF.textSecondary, marginTop: 2 },
  emailBadge:   { backgroundColor: 'rgba(73,192,188,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
  emailBadgeText:{ fontSize: 10, fontWeight: '700', color: PROF.accent },

  // Save
  saveBar:          { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: PROF.bgDeep, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: PROF.border },
  saveBtn:          { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  saveBtnDisabled:  { opacity: 0.6 },
  saveBtnGradient:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16 },
  saveBtnText:      { fontSize: 15, fontWeight: '700', color: '#fff' },
});
