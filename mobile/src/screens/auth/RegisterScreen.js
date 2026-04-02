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
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
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
    // Nuevos campos de verificación para profesionales
    fotoSelfieVerificacion: null,
    fotoCedulaFrontal: null,
    fotoCedulaPosterior: null,
    archivoAntecedentes: null,
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const pickImage = async (field, useCamera = false) => {
    try {
      const { status } = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
        
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', `Necesitamos acceso a tu ${useCamera ? 'cámara' : 'galería'} para continuar.`);
        return;
      }

      let result;
      if (useCamera) {
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
          base64: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
          base64: true,
        });
      }

      if (!result.canceled) {
        // Guardamos el base64 directamente para enviarlo al backend
        updateField(field, result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleRegister = async () => {
    const { nombre, apellido, email, password, rol } = form;
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Error', 'Por favor completa los campos obligatorios');
      return;
    }

    // Validación adicional para profesionales
    if (rol === 'SERVICE_PROVIDER') {
      if (!form.fotoSelfieVerificacion || !form.fotoCedulaFrontal || !form.fotoCedulaPosterior) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Seguridad Requerida', 'Como profesional, debes subir tu selfie y fotos de la cédula para validación de identidad.');
        return;
      }
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
      if (isProvider) {
        navigation.navigate('PendingVerification');
      } else {
        Alert.alert(
          '¡Registro Exitoso!',
          'Tu cuenta ha sido creada. Por favor verifica tu correo electrónico para activar todas las funciones.',
          [{ text: 'Entendido', onPress: () => navigation.navigate('Login') }]
        );
      }
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const isProvider = selectedRole === 'SERVICE_PROVIDER';

  const renderImageUpload = (label, field, icon, useCamera = false) => (
    <View style={styles.uploadContainer}>
      <Text style={styles.label}>{label} *</Text>
      <TouchableOpacity 
        style={[styles.uploadButton, form[field] && styles.uploadButtonSuccess]} 
        onPress={() => pickImage(field, useCamera)}
      >
        {form[field] ? (
          <View style={styles.previewContainer}>
            <Image 
              source={{ uri: `data:image/jpeg;base64,${form[field]}` }} 
              style={styles.previewImage} 
            />
            <Text style={styles.uploadButtonTextSuccess}>✓ Cargado</Text>
          </View>
        ) : (
          <Text style={styles.uploadButtonText}>+ Seleccionar {label}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

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
            ? 'Completa tu perfil de seguridad para empezar a trabajar'
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

        {isProvider && (
          <View style={styles.verificationSection}>
            <Text style={styles.sectionTitle}>Verificación de Identidad</Text>
            <Text style={styles.sectionSubtitle}>Para seguridad de nuestros clientes, requerimos validar tu identidad.</Text>
            
            {renderImageUpload('Selfie con Rostro', 'fotoSelfieVerificacion', 'camera', true)}
            {renderImageUpload('Cédula (Frontal)', 'fotoCedulaFrontal', 'image')}
            {renderImageUpload('Cédula (Posterior)', 'fotoCedulaPosterior', 'image')}
            
            <View style={styles.uploadContainer}>
              <Text style={styles.label}>Antecedentes Judiciales (Opcional)</Text>
              <TouchableOpacity 
                style={[styles.uploadButton, form.archivoAntecedentes && styles.uploadButtonSuccess]} 
                onPress={() => pickImage('archivoAntecedentes')}
              >
                <Text style={form.archivoAntecedentes ? styles.uploadButtonTextSuccess : styles.uploadButtonText}>
                  {form.archivoAntecedentes ? '✓ Documento Cargado' : '+ Adjuntar PDF o Imagen'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>
              {isProvider ? 'Enviar para validación' : 'Crear cuenta'}
            </Text>
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
  verificationSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.accent,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  uploadContainer: {
    marginBottom: SPACING.md,
  },
  uploadButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  uploadButtonSuccess: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
    borderStyle: 'solid',
  },
  uploadButtonText: {
    color: COLORS.accent,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
  },
  uploadButtonTextSuccess: {
    color: '#2E7D32',
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
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
