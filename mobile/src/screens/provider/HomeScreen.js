import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Greeting */}
        <Text style={styles.greeting}>
          Hola, {user?.nombre || 'Profesional'} 👋
        </Text>
        <Text style={styles.subtitle}>Encuentra solicitudes cercanas</Text>

        {/* Main CTA */}
        <TouchableOpacity
          style={styles.ctaCard}
          onPress={() => navigation.navigate('AvailableRequests')}
          activeOpacity={0.8}
        >
          <View style={styles.ctaIcon}>
            <Ionicons name="search-outline" size={40} color={COLORS.white} />
          </View>
          <View style={styles.ctaText}>
            <Text style={styles.ctaTitle}>Ver solicitudes</Text>
            <Text style={styles.ctaDesc}>
              Busca servicios cercanos y envía tu mejor oferta
            </Text>
          </View>
        </TouchableOpacity>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('MyOffers')}
          >
            <Ionicons name="pricetag-outline" size={28} color={COLORS.accent} />
            <Text style={styles.actionText}>Mis Ofertas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={28} color={COLORS.accent} />
            <Text style={styles.actionText}>Notificaciones</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
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
    padding: SPACING.xl,
  },
  greeting: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  ctaCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  ctaIcon: {
    marginRight: SPACING.md,
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  ctaDesc: {
    fontSize: TYPOGRAPHY.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  actionText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: SPACING.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: SPACING.md,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.md,
    marginLeft: SPACING.sm,
  },
});
