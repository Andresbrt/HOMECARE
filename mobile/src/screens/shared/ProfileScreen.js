/**
 * ProfileScreen — Perfil Minimalista Homecare 2026
 * Diseño limpio, sobrio y ergonómico (estilo Apple / Airbnb).
 * Soporta modo Cliente (fondo claro, elegante) y Profesional (modo oscuro ejecutivo, sin saturación de neón).
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import useModeStore from '../../store/modeStore';
import apiClient from '../../services/apiClient';
import LegalModal from '../../components/shared/LegalModal';
import { COLORS, PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { computeLevel } from '../../utils/levelUtils';

// ─── Fila de Menú Minimalista ────────────────────────────────────────────────
function MinimalMenuItem({ icon, title, subtitle, onPress, isDark, isDanger, isAccent, badge }) {
  const iconColor = isDanger
    ? '#EF4444'
    : isAccent
    ? (isDark ? '#49C0BC' : '#0E4D68')
    : (isDark ? 'rgba(255,255,255,0.75)' : '#475569');

  const iconBg = isDanger
    ? 'rgba(239,68,68,0.1)'
    : isAccent
    ? (isDark ? 'rgba(73,192,188,0.15)' : 'rgba(14,77,104,0.08)')
    : (isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9');

  const titleColor = isDanger
    ? '#EF4444'
    : isAccent
    ? (isDark ? '#49C0BC' : '#001B38')
    : (isDark ? '#FFFFFF' : '#0F172A');

  const subColor = isDark ? 'rgba(255,255,255,0.45)' : '#64748B';

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>

      <View style={styles.menuTextCol}>
        <Text style={[styles.menuTitle, { color: titleColor }]}>{title}</Text>
        {subtitle ? <Text style={[styles.menuSub, { color: subColor }]}>{subtitle}</Text> : null}
      </View>

      {badge ? (
        <View style={[styles.badge, { backgroundColor: isDark ? PROF.accent : COLORS.accent }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={isDark ? 'rgba(255,255,255,0.25)' : '#CBD5E1'}
        />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { mode, setMode } = useModeStore();
  const isUsuario = mode === 'usuario';
  const isDark = !isUsuario;

  const [legalVisible, setLegalVisible] = useState(false);
  const [legalType, setLegalType] = useState('terms');

  // Datos de usuario
  const nombre = user?.nombre || 'Usuario';
  const apellido = user?.apellido || '';
  const fullName = `${nombre} ${apellido}`.trim();
  const email = user?.email || '';
  const telefono = user?.telefono || '';
  const completedServices = user?.serviciosCompletados ?? user?.totalServicios ?? 0;
  const rating = user?.calificacionPromedio ? Number(user.calificacionPromedio).toFixed(1) : '5.0';

  const initials = [nombre, apellido]
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase())
    .join('') || 'U';

  const profLevel = !isUsuario ? computeLevel(completedServices) : null;

  // Handlers
  const handleLogout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Cerrar sesión', '¿Deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
    ]);
  }, [logout]);

  const handleDeleteAccount = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Eliminar cuenta',
      'Tu cuenta y datos se desactivarán permanentemente conforme a las normativas de privacidad.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar definitivamente',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete('/usuarios/me');
              Alert.alert('Cuenta eliminada', 'Tu cuenta ha sido desactivada.');
              logout();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'No se pudo eliminar la cuenta.');
            }
          },
        },
      ]
    );
  }, [logout]);

  const handleSwitchMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextMode = isUsuario ? 'profesional' : 'usuario';
    setMode(nextMode);
  };

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? '#001326' : '#F8FAFC' }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#001326' : '#F8FAFC'}
      />

      {/* Top Header */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF' }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
          Perfil
        </Text>
        <TouchableOpacity
          style={[
            styles.modeChip,
            { backgroundColor: isDark ? 'rgba(73,192,188,0.12)' : 'rgba(14,77,104,0.08)' },
          ]}
          onPress={handleSwitchMode}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isUsuario ? 'person' : 'briefcase'}
            size={12}
            color={isDark ? '#49C0BC' : '#0E4D68'}
          />
          <Text style={[styles.modeChipText, { color: isDark ? '#49C0BC' : '#0E4D68' }]}>
            {isUsuario ? 'Modo Cliente' : 'Modo Profesional'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── CARD PRINCIPAL DE PERFIL ── */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: isDark ? '#001B38' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.profileHeaderRow}>
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              {user?.fotoPerfil ? (
                <Image source={{ uri: user.fotoPerfil }} style={styles.avatarImg} />
              ) : (
                <View
                  style={[
                    styles.avatarInitials,
                    { backgroundColor: isDark ? '#0E4D68' : '#E0F2FE' },
                  ]}
                >
                  <Text style={[styles.initialsText, { color: isDark ? '#49C0BC' : '#0369A1' }]}>
                    {initials}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.editAvatarBtn}
                onPress={() => navigation.navigate('EditProfile')}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil" size={12} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.profileName, { color: isDark ? '#FFFFFF' : '#0F172A' }]} numberOfLines={1}>
                  {fullName}
                </Text>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </View>
              <Text style={[styles.profileSub, { color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B' }]} numberOfLines={1}>
                {email}
              </Text>
              {telefono ? (
                <Text style={[styles.profilePhone, { color: isDark ? 'rgba(255,255,255,0.45)' : '#94A3B8' }]}>
                  {telefono}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Métricas Minimalistas */}
          <View style={[styles.statsRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: isDark ? '#49C0BC' : '#0E4D68' }]}>
                {completedServices}
              </Text>
              <Text style={[styles.statLbl, { color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B' }]}>
                {isUsuario ? 'Servicios pedidos' : 'Completados'}
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]} />

            <View style={styles.statBox}>
              <View style={styles.ratingValRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={[styles.statNum, { color: isDark ? '#FFFFFF' : '#0F172A', marginLeft: 3 }]}>
                  {rating}
                </Text>
              </View>
              <Text style={[styles.statLbl, { color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B' }]}>
                Calificación
              </Text>
            </View>

            {!isUsuario && profLevel && (
              <>
                <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: '#F59E0B' }]}>
                    {profLevel.label}
                  </Text>
                  <Text style={[styles.statLbl, { color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B' }]}>
                    Nivel Pro
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── SECCIÓN 1: MI CUENTA ── */}
        <Text style={[styles.groupTitle, { color: isDark ? 'rgba(255,255,255,0.45)' : '#94A3B8' }]}>
          CUENTA
        </Text>
        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: isDark ? '#001B38' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
            },
          ]}
        >
          <MinimalMenuItem
            icon="person-outline"
            title="Editar Información"
            subtitle="Nombre, teléfono y foto"
            onPress={() => navigation.navigate('EditProfile')}
            isDark={isDark}
            isAccent
          />
          <View style={[styles.itemDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]} />
          <MinimalMenuItem
            icon="time-outline"
            title="Historial de Servicios"
            subtitle="Servicios completados y activos"
            onPress={() => navigation.navigate(isUsuario ? 'UserHistory' : 'ProfHistory')}
            isDark={isDark}
          />
          <View style={[styles.itemDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]} />
          <MinimalMenuItem
            icon="shield-checkmark-outline"
            title="Seguridad y Contraseña"
            subtitle="Acceso y privacidad de cuenta"
            onPress={() => navigation.navigate(isUsuario ? 'UserSecurity' : 'ProfSecurity')}
            isDark={isDark}
          />
        </View>

        {/* ── SECCIÓN 2: PREFERENCIAS ── */}
        <Text style={[styles.groupTitle, { color: isDark ? 'rgba(255,255,255,0.45)' : '#94A3B8' }]}>
          PREFERENCIAS
        </Text>
        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: isDark ? '#001B38' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
            },
          ]}
        >
          <MinimalMenuItem
            icon="notifications-outline"
            title="Notificaciones"
            subtitle="Alertas de solicitudes y avisos"
            onPress={() => navigation.navigate(isUsuario ? 'UserNotifications' : 'ProfNotifications')}
            isDark={isDark}
          />
          <View style={[styles.itemDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]} />
          <MinimalMenuItem
            icon="sync-outline"
            title={isUsuario ? 'Cambiar a Profesional' : 'Cambiar a Cliente'}
            subtitle={isUsuario ? 'Ofrece tus servicios en la app' : 'Solicita servicios para tu hogar'}
            onPress={handleSwitchMode}
            isDark={isDark}
            isAccent
          />
        </View>

        {/* ── SECCIÓN 3: SOPORTE Y LEGAL ── */}
        <Text style={[styles.groupTitle, { color: isDark ? 'rgba(255,255,255,0.45)' : '#94A3B8' }]}>
          SOPORTE Y LEGAL
        </Text>
        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: isDark ? '#001B38' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
            },
          ]}
        >
          <MinimalMenuItem
            icon="help-circle-outline"
            title="Ayuda y Soporte"
            subtitle="Preguntas frecuentes y contacto"
            onPress={() => navigation.navigate(isUsuario ? 'UserHelpSupport' : 'ProfHelpSupport')}
            isDark={isDark}
          />
          <View style={[styles.itemDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]} />
          <MinimalMenuItem
            icon="document-text-outline"
            title="Términos y Condiciones"
            onPress={() => {
              setLegalType('terms');
              setLegalVisible(true);
            }}
            isDark={isDark}
          />
          <View style={[styles.itemDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]} />
          <MinimalMenuItem
            icon="lock-closed-outline"
            title="Política de Privacidad"
            onPress={() => {
              setLegalType('privacy');
              setLegalVisible(true);
            }}
            isDark={isDark}
          />
        </View>

        {/* ── SECCIÓN 4: ACCIONES DE CUENTA ── */}
        <View style={styles.dangerGroup}>
          <TouchableOpacity
            style={[
              styles.logoutBtn,
              {
                backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#FEE2E2',
                borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#FECACA',
              },
            ]}
            onPress={handleLogout}
            activeOpacity={0.75}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Text style={[styles.deleteText, { color: isDark ? 'rgba(255,255,255,0.35)' : '#94A3B8' }]}>
              Eliminar mi cuenta
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.versionText, { color: isDark ? 'rgba(255,255,255,0.25)' : '#94A3B8' }]}>
          Homecare · Medellín v1.0.0
        </Text>
      </ScrollView>

      {/* Modal Legal */}
      <LegalModal
        visible={legalVisible}
        type={legalType}
        onClose={() => setLegalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: 10,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: 8,
  },

  // Profile Card
  profileCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarInitials: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 22,
    fontWeight: '800',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0E4D68',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    flexShrink: 1,
  },
  profileSub: {
    fontSize: 13,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 12,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 17,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 11,
    marginTop: 2,
  },
  ratingValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
  },

  // Groups
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuSub: {
    fontSize: 12,
    marginTop: 1,
  },
  itemDivider: {
    height: 1,
    marginLeft: 60,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  // Danger / Bottom
  dangerGroup: {
    marginTop: 8,
    gap: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  deleteText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 16,
  },
});
