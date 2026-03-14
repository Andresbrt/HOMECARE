import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

function MessageBubble({ message, isOwn }) {
  return (
    <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && <Text style={styles.senderName}>{message.remitenteNombre}</Text>}
        <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>{message.contenido}</Text>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, isOwn && styles.timeTextOwn]}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isOwn && message.leido && (
            <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" />
          )}
        </View>
      </View>
    </View>
  );
}

export default function ChatScreen({ route, navigation }) {
  const { solicitudId, destinatarioId, titulo } = route.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/mensajes/solicitud/${solicitudId}`);
      setMessages(data.reverse());
      // Mark all as read
      apiClient.put(`/mensajes/solicitud/${solicitudId}/leer-todos`).catch(() => {});
    } catch (error) {
      // Silently fail on poll
    } finally {
      setLoading(false);
    }
  }, [solicitudId]);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 5s
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSending(true);
    setText('');

    try {
      const { data } = await apiClient.post('/mensajes', {
        solicitudId,
        destinatarioId,
        contenido: content,
        tipo: 'TEXTO',
      });
      setMessages(prev => [...prev, data]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      setText(content);
      // Could show error toast here
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{titulo || 'Chat'}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <MessageBubble message={item} isOwn={item.remitenteId === user?.id} />
          )}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textDisabled} />
              <Text style={styles.emptyText}>Inicia la conversación</Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={COLORS.textDisabled}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="send" size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.semibold, color: COLORS.textPrimary },
  messagesList: { padding: SPACING.md, paddingBottom: SPACING.sm, flexGrow: 1, justifyContent: 'flex-end' },
  bubbleRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  bubbleRowOwn: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg },
  bubbleOwn: { backgroundColor: COLORS.accent, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: COLORS.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  senderName: { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.semibold, color: COLORS.accent, marginBottom: 2 },
  messageText: { fontSize: TYPOGRAPHY.md, color: COLORS.textPrimary },
  messageTextOwn: { color: COLORS.white },
  timeRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 },
  timeText: { fontSize: 10, color: COLORS.textDisabled },
  timeTextOwn: { color: 'rgba(255,255,255,0.7)' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: SPACING.sm, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.sm },
  textInput: { flex: 1, backgroundColor: COLORS.backgroundSecondary, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: TYPOGRAPHY.md, color: COLORS.textPrimary, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  emptyText: { fontSize: TYPOGRAPHY.md, color: COLORS.textDisabled },
});
