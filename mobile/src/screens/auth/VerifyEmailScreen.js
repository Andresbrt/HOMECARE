import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { authService } from '../../services/authService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function VerifyEmailScreen({ route, navigation }) {
  const { token } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      // Intentamos obtener el token de route.params (navegación interna)
      // o del Deep Link directo
      const initialUrl = await Linking.getInitialURL();
      let activeToken = token;

      if (initialUrl) {
        const { queryParams } = Linking.parse(initialUrl);
        if (queryParams?.token) {
          activeToken = queryParams.token;
        }
      }

      if (activeToken) {
        verify(activeToken);
      } else {
        setLoading(false);
        setError('Token no proporcionado');
      }
    };

    checkToken();
  }, [token]);

  const verify = async (tokenToUse) => {
    setLoading(true);
    try {
      await authService.verifyEmail(tokenToUse);
      setVerified(true);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Error al verificar email';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificación de Email</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} />
      ) : verified ? (
        <View style={styles.statusBox}>
          <Text style={styles.successText}>✅ ¡Email verificado exitosamente!</Text>
          <Text style={styles.subtitle}>Ahora puedes acceder a todas las funciones de HOME CARE.</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonText}>Ir al Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.statusBox}>
          <Text style={styles.errorText}>❌ Error: {error}</Text>
          <Text style={styles.subtitle}>El token pudo haber expirado o ser inválido.</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonText}>Volver al Login</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.xl, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: SPACING.xxl, textAlign: 'center' },
  statusBox: { width: '100%', alignItems: 'center', gap: SPACING.lg },
  successText: { fontSize: TYPOGRAPHY.lg, color: 'green', fontWeight: 'bold' },
  errorText: { fontSize: TYPOGRAPHY.lg, color: 'red', fontWeight: 'bold' },
  subtitle: { fontSize: TYPOGRAPHY.md, color: COLORS.textSecondary, textAlign: 'center' },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xl,
  },
  buttonText: { color: COLORS.white, fontWeight: 'bold' },
});
