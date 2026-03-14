import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

export default function RoleSelectionScreen({ navigation }) {
  const handleSelect = (role) => {
    navigation.navigate('Register', { role });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>HOMECARE</Text>
          <Text style={styles.subtitle}>¿Cómo quieres usar la app?</Text>
        </View>

        {/* Role Cards */}
        <View style={styles.cards}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleSelect('CUSTOMER')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#E8F8F7' }]}>
              <Ionicons name="home-outline" size={32} color={COLORS.accent} />
            </View>
            <Text style={styles.cardTitle}>Necesito un servicio</Text>
            <Text style={styles.cardDesc}>
              Publica solicitudes y recibe ofertas de profesionales verificados.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => handleSelect('SERVICE_PROVIDER')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#E3EDF5' }]}>
              <Ionicons name="construct-outline" size={32} color={COLORS.secondary} />
            </View>
            <Text style={styles.cardTitle}>Soy profesional</Text>
            <Text style={styles.cardDesc}>
              Encuentra solicitudes cercanas y envía ofertas competitivas.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login link */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>
            ¿Ya tienes cuenta?{' '}
            <Text style={styles.loginTextBold}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logo: {
    fontSize: 40,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  cards: {
    gap: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  cardDesc: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  loginText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textSecondary,
  },
  loginTextBold: {
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.semibold,
  },
});
