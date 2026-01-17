import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';

/**
 * PANTALLA DE LOGIN
 * Integrada con Spring Boot backend para autenticación JWT
 */
const LoginScreen = ({ navigation }) => {
  const { login, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo al escribir
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // Limpiar error global
    if (error) {
      clearError();
    }
  };

  const handleLogin = async () => {
    // Limpiar errores previos
    setFieldErrors({});
    clearError();
    
    // Validación básica del frontend
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    if (!formData.password) {
      errors.password = 'La contraseña es obligatoria';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // La navegación se maneja automáticamente por el estado de autenticación
        // en App.js o AppNavigator.js
      } else {
        Alert.alert(
          'Error de Login',
          result.error || 'Credenciales inválidas'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error de Conexión',
        'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      );
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const fillDemoCredentials = (role) => {
    const demoCredentials = {
      admin: { email: 'admin@homecare.com', password: 'admin123' },
      provider: { email: 'maria.rodriguez@homecare.com', password: 'provider123' },
      customer: { email: 'juan.perez@homecare.com', password: 'customer123' },
    };

    const credentials = demoCredentials[role];
    setFormData(credentials);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>HomeCare</Text>
            <Text style={styles.subtitle}>
              Bienvenido de vuelta
            </Text>
            <Text style={styles.description}>
              Inicia sesión para acceder a tu cuenta
            </Text>
          </View>

          {/* Mensaje de error global */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {/* Formulario */}
          <View style={styles.form}>
            <Input
              label="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={fieldErrors.email}
              leftIcon="✉️"
            />

            <Input
              label="Contraseña"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              error={fieldErrors.password}
              leftIcon="🔒"
              rightIcon={showPassword ? "👁️" : "👁️‍🗨️"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
              fullWidth
            />
          </View>

          {/* Demo Credentials para testing */}
          {__DEV__ && (
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>🧪 Credenciales Demo</Text>
              <View style={styles.demoButtons}>
                <TouchableOpacity
                  style={[styles.demoButton, { backgroundColor: COLORS.ERROR }]}
                  onPress={() => fillDemoCredentials('admin')}
                >
                  <Text style={styles.demoButtonText}>Admin</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.demoButton, { backgroundColor: COLORS.PRIMARY }]}
                  onPress={() => fillDemoCredentials('provider')}
                >
                  <Text style={styles.demoButtonText}>Proveedor</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.demoButton, { backgroundColor: COLORS.SUCCESS }]}
                  onPress={() => fillDemoCredentials('customer')}
                >
                  <Text style={styles.demoButtonText}>Cliente</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Registro */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>
              ¿No tienes una cuenta?{' '}
            </Text>
            <TouchableOpacity onPress={handleRegister} activeOpacity={0.7}>
              <Text style={styles.registerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Al iniciar sesión aceptas nuestros{' '}
            </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.footerLink}>Términos y Condiciones</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}> y </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.footerLink}>Política de Privacidad</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XL,
  },

  header: {
    alignItems: 'center',
    paddingTop: SPACING.XXL,
    paddingBottom: SPACING.XL,
  },

  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XXL + 8,
    fontWeight: '800',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.MD,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  subtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },

  description: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
    lineHeight: 20,
  },

  errorContainer: {
    backgroundColor: COLORS.ERROR_LIGHT,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.MD,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.ERROR,
  },

  errorText: {
    color: COLORS.ERROR,
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '500',
    textAlign: 'center',
  },

  form: {
    flex: 1,
    paddingTop: SPACING.MD,
  },

  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: SPACING.SM,
    marginBottom: SPACING.XL,
  },

  forgotPasswordText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },

  loginButton: {
    marginBottom: SPACING.LG,
  },

  // Demo section (solo en desarrollo)
  demoSection: {
    backgroundColor: COLORS.WARNING_LIGHT,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.LG,
  },

  demoTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.DARK,
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },

  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  demoButton: {
    flex: 1,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    marginHorizontal: SPACING.XS,
    alignItems: 'center',
  },

  demoButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    fontWeight: '600',
  },

  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.LG,
  },

  registerText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },

  registerLink: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.MD,
  },

  footerText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
  },

  footerLink: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
});

export default LoginScreen;