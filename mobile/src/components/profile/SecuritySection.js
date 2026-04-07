/**
 * SecuritySection — Sección de Seguridad Premium Homecare 2026
 * Contraseña, 2FA, dispositivos conectados, historial de actividad
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

// ─── Datos de dispositivos simulados ─────────────────────────────────────────
const MOCK_DEVICES = [
  { id: '1', name: 'iPhone 14 Pro', os: 'iOS 17.4', lastSeen: 'Ahora',         current: true  },
  { id: '2', name: 'Samsung Galaxy S23', os: 'Android 14', lastSeen: 'Hace 2h', current: false },
  { id: '3', name: 'MacBook Pro', os: 'macOS 14',   lastSeen: 'Hace 1 dia',    current: false },
];

// ─── Actividad reciente simulada ─────────────────────────────────────────────
const MOCK_ACTIVITY = [
  { id: '1', icon: 'log-in-outline',      text: 'Inicio de sesion',          time: 'Hace 5 min',   risk: 'safe'    },
  { id: '2', icon: 'key-outline',         text: 'Cambio de contrasena',      time: 'Hace 3 dias',  risk: 'warning' },
  { id: '3', icon: 'shield-checkmark',    text: 'Verificacion OTP exitosa',  time: 'Hace 3 dias',  risk: 'safe'    },
  { id: '4', icon: 'phone-portrait-outline', text: 'Nuevo dispositivo',      time: 'Hace 1 semana', risk: 'warning' },
];

// ─── Row clickeable ───────────────────────────────────────────────────────────
function ActionRow({ icon, title, subtitle, onPress, rightNode, delay = 0, danger = false }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)} style={animStyle}>
      <TouchableOpacity
        onPress={() => {
          scale.value = withSpring(0.97, { damping: 16 }, () => { scale.value = withSpring(1); });
          Haptics.selectionAsync();
          onPress?.();
        }}
        activeOpacity={1}
        style={styles.actionRow}
      >
        <View style={[styles.actionIcon, danger && styles.actionIconDanger]}>
          <Ionicons name={icon} size={18} color={danger ? PROF.error : PROF.accent} />
        </View>
        <View style={styles.actionText}>
          <Text style={[styles.actionTitle, danger && styles.dangerText]}>{title}</Text>
          {subtitle ? <Text style={styles.actionSubtitle}>{subtitle}</Text> : null}
        </View>
        {rightNode || <Ionicons name="chevron-forward" size={16} color={PROF.textMuted} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Modal cambiar contraseña ─────────────────────────────────────────────────
function ChangePasswordModal({ visible, onClose }) {
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSave = () => {
    if (!current || !next || !confirm) {
      Alert.alert('Campos requeridos', 'Completa todos los campos.');
      return;
    }
    if (next.length < 8) {
      Alert.alert('Contrasena debil', 'Debe tener al menos 8 caracteres.');
      return;
    }
    if (next !== confirm) {
      Alert.alert('No coinciden', 'Las contrasenas nuevas no coinciden.');
      return;
    }
    setLoading(true);
    // Simulacion de llamada API
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Exito', 'Contrasena actualizada correctamente.');
      setCurrent(''); setNext(''); setConfirm('');
      onClose();
    }, 1500);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.modalSheet}>
          <LinearGradient colors={['#0a1e35', '#001224']} style={styles.modalGradient}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar contrasena</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={PROF.textSecondary} />
              </TouchableOpacity>
            </View>

            {[
              { label: 'Contrasena actual', val: current, set: setCurrent, show: showCur,  setShow: setShowCur },
              { label: 'Nueva contrasena',  val: next,    set: setNext,    show: showNext, setShow: setShowNext },
              { label: 'Confirmar nueva',   val: confirm, set: setConfirm, show: showNext, setShow: setShowNext },
            ].map(({ label, val, set, show, setShow }) => (
              <View key={label} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{label}</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    value={val}
                    onChangeText={set}
                    secureTextEntry={!show}
                    placeholderTextColor={PROF.textMuted}
                    placeholder="••••••••"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShow(!show)} style={styles.inputEye}>
                    <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={PROF.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.saveBtn, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
            >
              <LinearGradient colors={PROF.gradAccent} style={styles.saveBtnGradient}>
                <Text style={styles.saveBtnText}>{loading ? 'Guardando...' : 'Guardar cambios'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function SecuritySection({ onLogoutAll }) {
  const [twoFAEnabled,    setTwoFAEnabled]    = useState(false);
  const [showDevices,     setShowDevices]     = useState(false);
  const [showActivity,    setShowActivity]    = useState(false);
  const [showPassModal,   setShowPassModal]   = useState(false);
  const devRotate  = useSharedValue(0);
  const actRotate  = useSharedValue(0);

  const toggleDevices  = () => {
    devRotate.value  = withSpring(showDevices  ? 0 : 1, { damping: 16 });
    setShowDevices(prev => !prev);
  };
  const toggleActivity = () => {
    actRotate.value  = withSpring(showActivity ? 0 : 1, { damping: 16 });
    setShowActivity(prev => !prev);
  };

  const devChevron  = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(devRotate.value,  [0,1],[0,90])}deg` }] }));
  const actChevron  = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(actRotate.value,  [0,1],[0,90])}deg` }] }));

  const handleToggle2FA = useCallback((val) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (val) {
      Alert.alert(
        'Activar 2FA',
        'Se enviara un codigo OTP a tu email cada vez que inicies sesion.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Activar', onPress: () => setTwoFAEnabled(true) },
        ],
      );
    } else {
      setTwoFAEnabled(false);
    }
  }, []);

  const handleRevokeDevice = useCallback((device) => {
    Alert.alert(
      'Cerrar sesion',
      `¿Cerrar sesion en "${device.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text:  'Cerrar sesion', style: 'destructive', onPress: () =>
          Alert.alert('Sesion cerrada', `Sesion cerrada en ${device.name}.`) },
      ],
    );
  }, []);

  const handleLogoutAll = useCallback(() => {
    Alert.alert(
      'Cerrar todas las sesiones',
      'Se cerrara sesion en todos los dispositivos y volveras al inicio de sesion.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: () => onLogoutAll?.(),
        },
      ],
    );
  }, [onLogoutAll]);

  return (
    <View style={styles.container}>
      <Animated.Text entering={FadeInDown.delay(50).springify()} style={styles.sectionTitle}>
        <Ionicons name="shield-checkmark" size={15} color={PROF.accent} /> Seguridad
      </Animated.Text>

      <GlassCard variant="elevated" animated padding={0} style={styles.card}>
        {/* Cambiar contraseña */}
        <ActionRow
          icon="lock-closed-outline"
          title="Cambiar contrasena"
          subtitle="Ultima actualizacion: hace 3 dias"
          onPress={() => setShowPassModal(true)}
          delay={60}
        />
        <View style={styles.divider} />

        {/* 2FA */}
        <ActionRow
          icon="phone-portrait-outline"
          title="Autenticacion de dos factores"
          subtitle={twoFAEnabled ? 'Activa — via email OTP' : 'Desactivada'}
          delay={120}
          rightNode={
            <Switch
              value={twoFAEnabled}
              onValueChange={handleToggle2FA}
              thumbColor={twoFAEnabled ? PROF.accent : PROF.textMuted}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: PROF.accentGlow }}
            />
          }
        />
        <View style={styles.divider} />

        {/* Dispositivos */}
        <ActionRow
          icon="laptop-outline"
          title="Dispositivos conectados"
          subtitle={`${MOCK_DEVICES.length} dispositivos activos`}
          onPress={toggleDevices}
          delay={180}
          rightNode={
            <Animated.View style={devChevron}>
              <Ionicons name="chevron-forward" size={16} color={PROF.textMuted} />
            </Animated.View>
          }
        />
        {showDevices && (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.subSection}>
            {MOCK_DEVICES.map((d) => (
              <View key={d.id} style={styles.deviceRow}>
                <Ionicons
                  name={d.name.toLowerCase().includes('iphone') || d.name.toLowerCase().includes('samsung') ? 'phone-portrait-outline' : 'laptop-outline'}
                  size={20}
                  color={d.current ? PROF.accent : PROF.textSecondary}
                />
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{d.name}{d.current ? ' (este dispositivo)' : ''}</Text>
                  <Text style={styles.deviceMeta}>{d.os} · {d.lastSeen}</Text>
                </View>
                {!d.current && (
                  <TouchableOpacity onPress={() => handleRevokeDevice(d)} style={styles.revokeBtn}>
                    <Ionicons name="close-circle-outline" size={20} color={PROF.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </Animated.View>
        )}
        <View style={styles.divider} />

        {/* Historial de actividad */}
        <ActionRow
          icon="time-outline"
          title="Historial de actividad"
          subtitle="Ultimos 7 dias"
          onPress={toggleActivity}
          delay={240}
          rightNode={
            <Animated.View style={actChevron}>
              <Ionicons name="chevron-forward" size={16} color={PROF.textMuted} />
            </Animated.View>
          }
        />
        {showActivity && (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.subSection}>
            {MOCK_ACTIVITY.map((a) => (
              <View key={a.id} style={styles.activityRow}>
                <View style={[styles.activityDot, a.risk === 'warning' && styles.activityDotWarn]}>
                  <Ionicons name={a.icon} size={14} color={a.risk === 'warning' ? PROF.warning : PROF.accent} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityText}>{a.text}</Text>
                  <Text style={styles.activityTime}>{a.time}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}
        <View style={styles.divider} />

        {/* Cerrar sesion en todos los dispositivos */}
        <ActionRow
          icon="power-outline"
          title="Cerrar sesion en todos los dispositivos"
          onPress={handleLogoutAll}
          delay={300}
          danger
        />
      </GlassCard>

      <ChangePasswordModal visible={showPassModal} onClose={() => setShowPassModal(false)} />
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: PROF.textPrimary,
    fontSize: TYPOGRAPHY.md ?? 15,
    fontFamily: TYPOGRAPHY.fontSemibold,
    paddingLeft: 4,
  },
  card: {
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    gap: SPACING.md,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PROF.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconDanger: {
    backgroundColor: 'rgba(255,91,91,0.12)',
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    color: PROF.textPrimary,
    fontSize: TYPOGRAPHY.sm ?? 13,
    fontFamily: TYPOGRAPHY.fontMedium,
  },
  actionSubtitle: {
    color: PROF.textMuted,
    fontSize: TYPOGRAPHY.xs ?? 11,
    marginTop: 2,
  },
  dangerText: {
    color: PROF.error,
  },
  divider: {
    height: 1,
    backgroundColor: PROF.border,
    marginLeft: 64,
  },
  // ── Sub-secciones ──
  subSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 8,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: PROF.textPrimary,
    fontSize: TYPOGRAPHY.xs ?? 11,
    fontFamily: TYPOGRAPHY.fontMedium,
  },
  deviceMeta: {
    color: PROF.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  revokeBtn: {
    padding: 4,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 6,
  },
  activityDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: PROF.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityDotWarn: {
    backgroundColor: 'rgba(245,166,35,0.15)',
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    color: PROF.textSecondary,
    fontSize: TYPOGRAPHY.xs ?? 11,
  },
  activityTime: {
    color: PROF.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: SPACING.lg,
    paddingBottom: 40,
    gap: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    color: PROF.textPrimary,
    fontSize: TYPOGRAPHY.lg ?? 17,
    fontFamily: TYPOGRAPHY.fontBold,
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: PROF.textSecondary,
    fontSize: TYPOGRAPHY.xs ?? 11,
    fontFamily: TYPOGRAPHY.fontMedium,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    paddingHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    color: PROF.textPrimary,
    fontSize: TYPOGRAPHY.sm ?? 13,
    paddingVertical: 14,
  },
  inputEye: {
    padding: 6,
  },
  saveBtn: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  saveBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontFamily: TYPOGRAPHY.fontBold,
    fontSize: TYPOGRAPHY.md ?? 15,
  },
});
