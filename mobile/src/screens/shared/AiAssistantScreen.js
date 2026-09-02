import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { aiChat, aiSupport } from '../../services/aiService';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

const QUICK_QUESTIONS = [
  '¿Cómo funciona HomeCare?',
  '¿Cómo cancelo un servicio?',
  '¿Cómo pago?',
  '¿Cuánto cuesta una limpieza?',
];

const MODES = [
  { key: 'asistente', label: 'Asistente', icon: 'sparkles-outline' },
  { key: 'soporte', label: 'Soporte', icon: 'help-circle-outline' },
];

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}
    >
      {!isUser && (
        <LinearGradient colors={['#0E4D68', '#49C0BC']} style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={14} color="#fff" />
        </LinearGradient>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
          {message.content}
        </Text>
      </View>
      {isUser && (
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={14} color={PROF.accent} />
        </View>
      )}
    </Animated.View>
  );
}

export default function AiAssistantScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const [mode, setMode] = useState('asistente');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'ai',
      content: '¡Hola! Soy HomeCare AI 👋 ¿En qué te puedo ayudar hoy? Puedes preguntarme sobre tus solicitudes, precios, pagos o cómo funciona la plataforma.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg = { id: Date.now().toString(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = mode === 'soporte'
        ? await aiSupport(trimmed)
        : await aiChat(trimmed);

      const aiMsg = { id: `ai-${Date.now()}`, role: 'ai', content: response };
      setMessages((prev) => [...prev, aiMsg]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      const errMsg = { id: `err-${Date.now()}`, role: 'ai', content: 'No pude conectarme al asistente. Verifica tu conexión e intenta de nuevo.' };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [loading, mode]);

  const switchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setMessages([{
      id: `welcome-${newMode}`,
      role: 'ai',
      content: newMode === 'soporte'
        ? '¡Hola! Soy el agente de soporte de HomeCare. Puedo ayudarte con preguntas frecuentes, problemas con pagos, cancelaciones y más. ¿Cuál es tu consulta?'
        : '¡Hola! Soy HomeCare AI 👋 ¿En qué te puedo ayudar hoy?',
    }]);
  };

  return (
    <LinearGradient colors={['#000F22', '#001B38']} style={{ flex: 1 }}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={PROF.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>HomeCare AI</Text>
          <Text style={styles.headerSub}>Asistente inteligente</Text>
        </View>

        <LinearGradient colors={['#0E4D68', '#49C0BC']} style={styles.headerIcon}>
          <Ionicons name="sparkles" size={20} color="#fff" />
        </LinearGradient>
      </Animated.View>

      {/* Mode Switcher */}
      <Animated.View entering={FadeInDown.duration(350).delay(80)} style={styles.modeSwitcher}>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.modeBtn, mode === m.key && styles.modeBtnActive]}
            onPress={() => switchMode(m.key)}
            activeOpacity={0.8}
          >
            <Ionicons name={m.icon} size={14} color={mode === m.key ? '#fff' : PROF.textMuted} />
            <Text style={[styles.modeBtnText, mode === m.key && styles.modeBtnTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListFooterComponent={
          loading ? (
            <View style={styles.typingIndicator}>
              <LinearGradient colors={['#0E4D68', '#49C0BC']} style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={14} color="#fff" />
              </LinearGradient>
              <View style={styles.bubbleAI}>
                <ActivityIndicator size="small" color={PROF.accent} />
              </View>
            </View>
          ) : null
        }
      />

      {/* Quick questions */}
      {messages.length <= 1 && (
        <Animated.ScrollView
          entering={FadeInDown.duration(400).delay(160)}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickScroll}
          contentContainerStyle={{ gap: 8, paddingHorizontal: SPACING.lg }}
        >
          {QUICK_QUESTIONS.map((q) => (
            <TouchableOpacity
              key={q}
              style={styles.quickChip}
              onPress={() => sendMessage(q)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickChipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </Animated.ScrollView>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.bottom + 8}
      >
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu pregunta..."
              placeholderTextColor={PROF.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(input)}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#49C0BC', '#2a9d99']}
              style={styles.sendBtnGrad}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: PROF.glassBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PROF.glass,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    color: PROF.textPrimary,
  },
  headerSub: {
    fontSize: TYPOGRAPHY.xs,
    color: PROF.textMuted,
    marginTop: 1,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modeSwitcher: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    backgroundColor: PROF.glass,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.full,
    padding: 3,
    gap: 3,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
  },
  modeBtnActive: {
    backgroundColor: PROF.accent,
  },
  modeBtnText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    color: PROF.textMuted,
  },
  modeBtnTextActive: {
    color: '#fff',
  },

  messageList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },

  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowAI: {
    justifyContent: 'flex-start',
  },

  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(73,192,188,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(73,192,188,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    padding: SPACING.sm + 4,
  },
  bubbleUser: {
    backgroundColor: PROF.accent,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: PROF.glass,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: TYPOGRAPHY.sm,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: '#fff',
    fontWeight: '500',
  },
  bubbleTextAI: {
    color: PROF.textPrimary,
  },

  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },

  quickScroll: {
    maxHeight: 48,
    marginBottom: SPACING.sm,
  },
  quickChip: {
    backgroundColor: PROF.glass,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickChipText: {
    fontSize: TYPOGRAPHY.xs,
    color: PROF.accent,
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: PROF.glassBorder,
    gap: SPACING.sm,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: PROF.glass,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 48,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    shadowColor: PROF.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sendBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnGrad: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
