/**
 * ChatInput — GlassCard bottom input bar (optimizado)
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function ChatInput({
  onSendText,
  onPickImage,
  onTakePhoto,
  onTyping,
  disabled = false,
}) {
  const [text, setText] = useState('');
  const sendScale = useSharedValue(1);

  const canSend = text.trim().length > 0 && !disabled;

  const handleChangeText = useCallback((value) => {
    setText(value);
    if (value.trim()) onTyping?.();
  }, [onTyping]);

  const handleSend = useCallback(() => {
    const content = text.trim();
    if (!content) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendScale.value = withSpring(0.88, { damping: 12 }, () => sendScale.value = withSpring(1));
    setText('');
    onSendText?.(content);
  }, [text, onSendText]);

  const handleAttach = useCallback(() => {
    Haptics.selectionAsync();
    if (Platform.OS === 'ios') {
      // ActionSheetIOS...
      // (mismo código que tenías)
    } else {
      Alert.alert('Adjuntar', '', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar foto', onPress: onTakePhoto },
        { text: 'Galería', onPress: onPickImage },
      ]);
    }
  }, [onPickImage, onTakePhoto]);

  const sendAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const inputContent = (
    <View style={styles.row}>
      <TouchableOpacity style={styles.iconBtn} onPress={handleAttach} disabled={disabled}>
        <Ionicons name="attach" size={24} color={disabled ? PROF.textMuted : PROF.accent} />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={text}
        onChangeText={handleChangeText}
        placeholder="Mensaje..."
        placeholderTextColor={PROF.textMuted}
        multiline
        maxLength={2000}
        editable={!disabled}
      />

      <Animated.View style={sendAnimStyle}>
        <TouchableOpacity
          style={[styles.sendBtn, !canSend && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Ionicons name="send" size={20} color={canSend ? '#fff' : PROF.textMuted} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  return (
    <GlassCard variant="elevated" style={styles.container}>
      {inputContent}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.sm,
    marginBottom: Platform.OS === 'ios' ? 24 : 12,
    borderRadius: BORDER_RADIUS.lg,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, padding: SPACING.sm },
  iconBtn: { padding: SPACING.xs },
  input: {
    flex: 1,
    backgroundColor: PROF.glass,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: PROF.textPrimary,
    fontSize: TYPOGRAPHY.sm,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PROF.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: { backgroundColor: PROF.glass },
});