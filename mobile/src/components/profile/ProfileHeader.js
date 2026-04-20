/**
 * ProfileHeader — Encabezado premium de perfil Homecare 2026
 * Avatar, nombre, nivel, estadísticas y botón editar
 */
import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { computeLevel, getQuarterLabel } from '../../utils/levelUtils';

// ─── Tarjeta de estadística ───────────────────────────────────────────────────
function StatCard({ icon, value, label, delay = 0 }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)} style={styles.statCard}>
      <GlassCard variant="elevated" animated={false} padding={12} style={styles.statGlass}>
        <Ionicons name={icon} size={18} color={PROF.accent} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </GlassCard>
    </Animated.View>
  );
}

export default function ProfileHeader({ user, onEditPress }) {
  const editScale = useSharedValue(1);

  const nombre   = user?.nombre   || 'Usuario';
  const apellido = user?.apellido || '';
  const email    = user?.email    || '';
  const services = user?.serviciosCompletados ?? user?.totalServicios ?? 0;
  const rating   = user?.calificacionPromedio ?? 0;
  const level    = computeLevel(services);
  const quarterLabel = getQuarterLabel();

  // Iniciales del avatar
  const initials = [nombre, apellido]
    .filter(Boolean)
    .map(s => s[0]?.toUpperCase())
    .join('');

  const editAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: editScale.value }],
  }));

  const handleEdit = useCallback(() => {
    editScale.value = withSpring(0.93, { damping: 16 }, () => {
      editScale.value = withSpring(1, { damping: 16 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onEditPress) {
      onEditPress();
    } else {
      Alert.alert('Editar Perfil', 'Funcionalidad disponible próximamente.');
    }
  }, [onEditPress]);

  const progressWidth = `${Math.min(level.progress * 100, 100).toFixed(0)}%`;

  return (
    <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.container}>
      {/* ── Avatar + Info ─────────────────────────────────────────── */}
      <GlassCard variant="elevated" glow padding={20} style={styles.headerCard}>
        <View style={styles.topRow}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <LinearGradient colors={PROF.gradAccent} style={styles.avatarGradient}>
              {user?.fotoPerfil ? (
                <Image source={{ uri: user.fotoPerfil }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials || '?'}</Text>
              )}
            </LinearGradient>
            {/* Indicador online */}
            <View style={styles.onlineDot} />
            {/* Botón cámara → va a EditProfile */}
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={handleEdit}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={12} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Datos principales */}
          <View style={styles.infoBlock}>
            <Text style={styles.fullName} numberOfLines={1}>
              {nombre} {apellido}
            </Text>
            <Text style={styles.emailText} numberOfLines={1}>{email}</Text>

            {/* Badge de nivel */}
            <View style={[styles.levelBadge, { borderColor: level.color }]}>
              <Ionicons name={level.icon} size={11} color={level.color} />
              <Text style={[styles.levelText, { color: level.color }]}>{level.label}</Text>
            </View>
          </View>

          {/* Botón Editar */}
          <Animated.View style={editAnimStyle}>
            <TouchableOpacity style={styles.editBtn} onPress={handleEdit} activeOpacity={0.8}>
              <Ionicons name="pencil" size={16} color={PROF.accent} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ── Barra de progreso de nivel ─────────────────────────── */}
        {level.next !== null && (
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>
                Progreso a {level.nextLabel}
              </Text>
              <Text style={styles.progressCount}>
                {services} / {level.next} servicios · {quarterLabel}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={[PROF.accent, '#2a9d99']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: progressWidth }]}
              />
            </View>
          </View>
        )}
        {level.next === null && (
          <View style={styles.platinumBanner}>
            <Ionicons name="diamond" size={14} color={level.color} />
            <Text style={styles.platinumText}>{level.motivo}</Text>
          </View>
        )}
      </GlassCard>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <StatCard icon="checkmark-circle-outline" value={services}               label="Servicios"     delay={100} />
        <StatCard icon="star-outline"             value={rating > 0 ? rating.toFixed(1) : '—'}  label="Calificacion"  delay={180} />
        <StatCard icon="time-outline"             value={user?.totalHoras ?? 0}  label="Horas totales" delay={260} />
      </View>
    </Animated.View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  headerCard: {
    gap: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  // ── Avatar ──
  avatarWrap: {
    position: 'relative',
  },
  avatarGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PROF.accent,
  },
  avatarText: {
    color: '#fff',
    fontSize: 26,
    fontFamily: TYPOGRAPHY.fontBold,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: PROF.accent,
    borderWidth: 2,
    borderColor: PROF.bg,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PROF.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: PROF.bg,
  },
  // ── Info ──
  infoBlock: {
    flex: 1,
    gap: 4,
  },
  fullName: {
    color: PROF.textPrimary,
    fontSize: TYPOGRAPHY.lg ?? 17,
    fontFamily: TYPOGRAPHY.fontBold,
  },
  emailText: {
    color: PROF.textSecondary,
    fontSize: TYPOGRAPHY.sm,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  levelText: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: TYPOGRAPHY.fontSemibold,
  },
  // ── Editar ──
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PROF.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PROF.accentGlow,
  },
  // ── Progreso ──
  progressSection: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: PROF.textSecondary,
    fontSize: TYPOGRAPHY.xs,
  },
  progressCount: {
    color: PROF.accent,
    fontSize: TYPOGRAPHY.xs,
    fontFamily: TYPOGRAPHY.fontSemibold,
  },
  progressTrack: {
    height: 5,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  // ── Elite banner ──
  platinumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(229,228,226,0.07)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  platinumText: {
    color: '#E5E4E2',
    fontSize: TYPOGRAPHY.xs,
    fontFamily: TYPOGRAPHY.fontSemibold,
  },
  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
  },
  statGlass: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: PROF.textPrimary,
    fontSize: TYPOGRAPHY.lg ?? 17,
    fontFamily: TYPOGRAPHY.fontBold,
  },
  statLabel: {
    color: PROF.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
});
