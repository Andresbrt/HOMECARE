/**
 * ChatButton — Botón reutilizable para abrir el chat de una solicitud.
 *
 * Props:
 *   solicitudId    {string|number}  ID de la solicitud
 *   destinatarioId {string}         UID del otro participante
 *   titulo         {string}         Nombre/título para la pantalla de chat
 *   unread         {number}         Badge de no-leídos (opcional)
 *   variant        {'fab'|'pill'|'inline'}  Estilo visual (default: 'pill')
 *   style          {}               Estilo adicional para el contenedor
 *   disabled       {boolean}
 *
 * Uso:
 *   <ChatButton solicitudId={id} destinatarioId={uid} titulo="Carlos M." unread={3} />
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import useModeStore from '../../store/modeStore';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

export default function ChatButton({
  solicitudId,
  destinatarioId,
  titulo = 'Chat',
  unread = 0,
  variant = 'pill',
  style,
  disabled = false,
}) {
  const navigation  = useNavigation();
  const { mode }    = useModeStore();

  const handlePress = () => {
    if (disabled || !solicitudId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const screen = mode === 'usuario' ? 'UserChat' : 'Chat';
    navigation.navigate(screen, { solicitudId, destinatarioId, titulo });
  };

  // ── FAB circular ─────────────────────────────────────────────────────────
  if (variant === 'fab') {
    return (
      <View style={[styles.fabContainer, style]}>
        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.82}
          style={styles.fabInner}
        >
          <LinearGradient
            colors={disabled ? ['#444', '#555'] : PROF.gradAccent}
            style={styles.fabGradient}
          >
            <Ionicons name="chatbubbles" size={26} color="#fff" />
          </LinearGradient>
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // ── Botón inline (texto + ícono, sin fondo) ───────────────────────────────
  if (variant === 'inline') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.75}
        style={[styles.inlineBtn, disabled && styles.inlineDisabled, style]}
      >
        <Ionicons name="chatbubbles-outline" size={18} color={disabled ? '#888' : PROF.accent} />
        <Text style={[styles.inlineLabel, disabled && styles.inlineDisabled]}>
          {titulo ? `Chatear con ${titulo}` : 'Abrir chat'}
        </Text>
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // ── Pill (default) ────────────────────────────────────────────────────────
  return (
    <View style={[styles.pillContainer, style]}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.82}
        style={{ borderRadius: BORDER_RADIUS.full, overflow: 'hidden' }}
      >
        <LinearGradient
          colors={disabled ? ['#444', '#555'] : PROF.gradAccent}
          style={styles.pillGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="chatbubbles" size={18} color="#fff" />
          <Text style={styles.pillLabel}>
            {titulo ? `Chatear con ${titulo}` : 'Chatear'}
          </Text>
          {unread > 0 && (
            <View style={styles.badgeInline}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── FAB ──────────────────────────────────────────────────────────────────
  fabContainer: {
    position: 'relative',
    ...SHADOWS.glowStrong,
    shadowColor: PROF.accent,
  },
  fabInner: {
    position: 'relative',
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Pill ─────────────────────────────────────────────────────────────────
  pillContainer: {
    alignSelf: 'flex-start',
  },
  pillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: 8,
    borderRadius: BORDER_RADIUS.full,
  },
  pillLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    color: '#fff',
    letterSpacing: 0.2,
  },

  // ── Inline ────────────────────────────────────────────────────────────────
  inlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.xs,
  },
  inlineLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.accent,
    fontWeight: TYPOGRAPHY.medium,
  },
  inlineDisabled: {
    color: '#666',
    opacity: 0.5,
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF4C4C',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: PROF.bg ?? '#001B38',
  },
  badgeInline: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF4C4C',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    marginLeft: 2,
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '800',
  },
});
