/**
 * SecurityScreen — Seguridad Homecare 2026
 * Contraseña, 2FA, dispositivos conectados, historial de actividad
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
import GlassCard from '../../components/shared/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

const MOCK_DEVICES = [
  { id: '1', name: 'iPhone 14 Pro',     os: 'iOS 17.4',     lastSeen: 'Ahora',       current: true  },
  { id: '2', name: 'Samsung Galaxy S23',os: 'Android 14',   lastSeen: 'Hace 2h',     current: false },
  { id: '3', name: 'MacBook Pro',        os: 'macOS 14',     lastSeen: 'Hace 1 dia',  current: false },
];

const MOCK_ACTIVITY = [
  { id: '1', icon: 'log-in-outline',        text: 'Inicio de sesion',         time: 'Hace 5 min',    risk: 'safe'    },
  { id: '2', icon: 'key-outline',           text: 'Cambio de contrasena',     time: 'Hace 3 dias',   risk: 'warning' },
  { id: '3', icon: 'shield-checkmark',      text: 'Verificacion OTP exitosa', time: 'Hace 3 dias',   risk: 'safe'    },
  { id: '4', icon: 'phone-portrait-outline',text: 'Nuevo dispositivo',        time: 'Hace 1 semana', risk: 'warning' },
];

// ─── Row de acción ────────────────────────────────────────────────────────────
function ActionRow({ icon, title, subtitle, onPress, rightNode, delay = 0, danger = false }) {
  const scale = useSharedValue(1);
  const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)} style={anim}>
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
        {rightNode !== undefined ? rightNode : <Ionicons name="chevron-forward" size={16} color={PROF.textMuted} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Modal cambiar contraseña ─────────────────────────────────────────────────
function ChangePasswordModal({ visible, onClose }) {
  const [current, setCurrent] = useState('');
  const [next,    setNext]    = useState('');
  const [confirm, setConfirm] = useState('');
  const [showA,   setShowA]   = useState(false);
  const [showB,   setShowB]   = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    if (!current || !next || !confirm) { Alert.alert('Campos requeridos', 'Completa todos los campos.'); return; }
    if (next.length < 8)               { Alert.alert('Contrasena debil', 'Debe tener al menos 8 caracteres.'); return; }
    if (next !== confirm)              { Alert.alert('No coinciden', 'Las contrasenas nuevas no coinciden.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Exito', 'Contrasena actualizada correctamente.');
      onClose();
    }, 1200);
  };

  const Field = ({ label, value, onChangeText, show, setShow, placeholder }) => (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={PROF.textMuted}
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShow(s => !s)} style={styles.eyeBtn}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={PROF.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrap}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
        <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Cambiar contraseña</Text>
          <Field label="Contraseña actual" value={current} onChangeText={setCurrent} show={showA} setShow={setShowA} placeholder="••••••••" />
          <Field label="Nueva contraseña"  value={next}    onChangeText={setNext}    show={showB} setShow={setShowB} placeholder="Mín. 8 caracteres" />
          <Field label="Confirmar nueva"   value={confirm} onChangeText={setConfirm} show={showB} setShow={setShowB} placeholder="Repetir nueva contraseña" />
          <TouchableOpacity style={[styles.saveBtn, loading && styles.saveBtnDisabled]} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>{loading ? 'Guardando…' : 'Guardar cambios'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function SecurityScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [devices, setDevices] = useState(MOCK_DEVICES);

  const handleRevokeDevice = useCallback((id) => {
    Alert.alert('Revocar dispositivo', '¿Cerrar sesión en este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Revocar', style: 'destructive', onPress: () => setDevices(d => d.filter(x => x.id !== id)) },
    ]);
  }, []);

  const handleLogoutAll = useCallback(() => {
    Alert.alert('Cerrar todas las sesiones', '¿Estás seguro? Se cerrará sesión en todos los dispositivos.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: () => logout() },
    ]);
  }, [logout]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={PROF.bgDeep} />
      <LinearGradient colors={[PROF.bgDeep, PROF.bg, PROF.bg]} style={StyleSheet.absoluteFill} locations={[0, 0.35, 1]} />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={PROF.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Seguridad</Text>
        <View style={{ width: 38 }} />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Acceso a la cuenta ─────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60).springify().damping(16)}>
          <GlassCard variant="default" style={styles.card}>
            <Text style={styles.cardTitle}>Acceso a la cuenta</Text>
            <ActionRow
              icon="lock-closed-outline"
              title="Cambiar contraseña"
              subtitle="Última actualización: Hace 3 días"
              onPress={() => setShowPwdModal(true)}
              delay={80}
            />
            <View style={styles.separator} />
            <ActionRow
              icon="shield-outline"
              title="Autenticación en dos factores"
              subtitle={twoFA ? 'Activada — SMS y app' : 'Desactivada'}
              delay={140}
              rightNode={
                <Switch
                  value={twoFA}
                  onValueChange={(v) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert(
                      v ? 'Activar 2FA' : 'Desactivar 2FA',
                      v ? '¿Activar verificación en dos pasos?' : '¿Desactivar la protección adicional?',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Confirmar', onPress: () => setTwoFA(v) },
                      ],
                    );
                  }}
                  trackColor={{ false: PROF.border, true: PROF.accent }}
                  thumbColor="#fff"
                />
              }
            />
          </GlassCard>
        </Animated.View>

        {/* ── Dispositivos conectados ─────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(160).springify().damping(16)}>
          <GlassCard variant="default" style={styles.card}>
            <Text style={styles.cardTitle}>Dispositivos conectados</Text>
            {devices.map((dev, i) => (
              <View key={dev.id}>
                {i > 0 && <View style={styles.separator} />}
                <View style={styles.deviceRow}>
                  <View style={styles.deviceIcon}>
                    <Ionicons
                      name={dev.os.includes('iOS') || dev.os.includes('macOS') ? 'logo-apple' : 'phone-portrait-outline'}
                      size={18}
                      color={dev.current ? PROF.accent : PROF.textMuted}
                    />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{dev.name}</Text>
                    <Text style={styles.deviceSub}>{dev.os} · {dev.lastSeen}</Text>
                    {dev.current && <Text style={styles.deviceCurrent}>Dispositivo actual</Text>}
                  </View>
                  {!dev.current && (
                    <TouchableOpacity style={styles.revokeBtn} onPress={() => handleRevokeDevice(dev.id)}>
                      <Text style={styles.revokeTxt}>Revocar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        {/* ── Historial de actividad ──────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(240).springify().damping(16)}>
          <GlassCard variant="default" style={styles.card}>
            <Text style={styles.cardTitle}>Actividad reciente</Text>
            {MOCK_ACTIVITY.map((act, i) => (
              <View key={act.id}>
                {i > 0 && <View style={styles.separator} />}
                <View style={styles.activityRow}>
                  <View style={[styles.activityDot, act.risk === 'warning' && styles.activityDotWarn]}>
                    <Ionicons name={act.icon} size={15} color={act.risk === 'warning' ? '#FFB347' : PROF.accent} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityText}>{act.text}</Text>
                    <Text style={styles.activityTime}>{act.time}</Text>
                  </View>
                </View>
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        {/* ── Cerrar sesión en todos ──────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(320).springify().damping(16)}>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleLogoutAll} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={18} color={PROF.error} />
            <Text style={styles.dangerTxt}>Cerrar sesión en todos los dispositivos</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <ChangePasswordModal visible={showPwdModal} onClose={() => setShowPwdModal(false)} />
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: PROF.bgDeep },
  topBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, zIndex: 10 },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center' },
  topBarTitle:  { flex: 1, color: PROF.textPrimary, fontFamily: TYPOGRAPHY.fontBold, fontSize: 17, textAlign: 'center', marginLeft: -38 },
  scroll:       { flex: 1 },
  scrollContent:{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, gap: SPACING.md },
  card:         { marginBottom: 0 },
  cardTitle:    { color: PROF.textPrimary, fontFamily: TYPOGRAPHY.fontBold, fontSize: 14, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.6, opacity: 0.7 },
  separator:    { height: 1, backgroundColor: PROF.border, marginVertical: 4 },

  // ActionRow
  actionRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  actionIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: PROF.accentDim, justifyContent: 'center', alignItems: 'center' },
  actionIconDanger: { backgroundColor: 'rgba(255,91,91,0.1)' },
  actionText:   { flex: 1 },
  actionTitle:  { color: PROF.textPrimary, fontFamily: TYPOGRAPHY.fontSemibold, fontSize: 14 },
  actionSubtitle:{ color: PROF.textMuted, fontSize: 12, marginTop: 2 },
  dangerText:   { color: PROF.error },

  // Dispositivos
  deviceRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  deviceIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: PROF.accentDim, justifyContent: 'center', alignItems: 'center' },
  deviceInfo:   { flex: 1 },
  deviceName:   { color: PROF.textPrimary, fontFamily: TYPOGRAPHY.fontSemibold, fontSize: 13 },
  deviceSub:    { color: PROF.textMuted, fontSize: 11, marginTop: 2 },
  deviceCurrent:{ color: PROF.accent, fontSize: 11, marginTop: 2 },
  revokeBtn:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,91,91,0.4)', backgroundColor: 'rgba(255,91,91,0.07)' },
  revokeTxt:    { color: PROF.error, fontSize: 11, fontFamily: TYPOGRAPHY.fontSemibold },

  // Actividad
  activityRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  activityDot:  { width: 34, height: 34, borderRadius: 10, backgroundColor: PROF.accentDim, justifyContent: 'center', alignItems: 'center' },
  activityDotWarn:{ backgroundColor: 'rgba(255,179,71,0.12)' },
  activityInfo: { flex: 1 },
  activityText: { color: PROF.textPrimary, fontSize: 13 },
  activityTime: { color: PROF.textMuted, fontSize: 11, marginTop: 2 },

  // Danger button
  dangerBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,91,91,0.25)', backgroundColor: 'rgba(255,91,91,0.06)' },
  dangerTxt:    { color: PROF.error, fontFamily: TYPOGRAPHY.fontSemibold, fontSize: 13 },

  // Modal
  modalWrap:     { flex: 1 },
  modalOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: PROF.bgElevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, paddingTop: SPACING.sm, borderWidth: 1, borderColor: PROF.border },
  modalHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: PROF.border, alignSelf: 'center', marginBottom: SPACING.md },
  modalTitle:    { color: PROF.textPrimary, fontFamily: TYPOGRAPHY.fontBold, fontSize: 18, marginBottom: SPACING.md },
  fieldWrap:     { marginBottom: SPACING.sm },
  fieldLabel:    { color: PROF.textMuted, fontSize: 12, marginBottom: 4 },
  fieldRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: PROF.border, paddingHorizontal: 14 },
  fieldInput:    { flex: 1, color: PROF.textPrimary, fontSize: 14, paddingVertical: 12 },
  eyeBtn:        { padding: 8 },
  saveBtn:       { backgroundColor: PROF.accent, borderRadius: BORDER_RADIUS.md, paddingVertical: 14, alignItems: 'center', marginTop: SPACING.md },
  saveBtnDisabled:{ opacity: 0.55 },
  saveBtnText:   { color: '#fff', fontFamily: TYPOGRAPHY.fontBold, fontSize: 15 },
});
