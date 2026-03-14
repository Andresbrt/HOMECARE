import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Ionicons name="person-circle-outline" size={80} color={COLORS.accent} />
        </View>
        <Text style={styles.name}>
          {user?.nombre} {user?.apellido}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text
          style={[
            styles.role,
            user?.rol === 'SERVICE_PROVIDER' ? styles.roleProvider : styles.roleCustomer,
          ]}
        >
          {user?.rol === 'SERVICE_PROVIDER' ? 'Profesional' : 'Cliente'}
        </Text>

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
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  avatar: {
    marginBottom: SPACING.md,
  },
  name: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textPrimary,
  },
  email: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  role: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  roleCustomer: {
    color: COLORS.secondary,
    backgroundColor: '#E3EDF5',
  },
  roleProvider: {
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.md,
    marginLeft: SPACING.sm,
  },
});
