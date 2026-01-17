import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../theme';
import { authService } from '../../services/authService';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email);
      Alert.alert(
        'Email Enviado',
        'Hemos enviado las instrucciones para recuperar tu contraseña a tu email.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al enviar el email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.subtitle}>
            Ingresa tu email y te enviaremos las instrucciones para recuperar tu cuenta.
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.resetButton, loading && styles.disabledButton]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.resetButtonText}>
              {loading ? 'Enviando...' : 'Enviar Instrucciones'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backLinkText}>
              ← Volver al inicio de sesión
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>¿Necesitas ayuda?</Text>
          <Text style={styles.helpText}>
            Si no recibes el email, revisa tu carpeta de spam o contacta nuestro soporte.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  content: {
    flex: 1,
    padding: SPACING.LG,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XXL,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
    marginBottom: SPACING.XL,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 8,
    padding: SPACING.MD,
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    marginBottom: SPACING.LG,
    backgroundColor: COLORS.WHITE,
  },
  resetButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: 'bold',
  },
  backLink: {
    alignItems: 'center',
  },
  backLinkText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  helpSection: {
    backgroundColor: COLORS.LIGHT_GRAY,
    padding: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: SPACING.SM,
  },
  helpText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ForgotPasswordScreen;