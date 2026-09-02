/**
 * ChatScreen — Premium real-time bidirectional chat (optimizado 2026)
 * Route params: { solicitudId, destinatarioId, titulo }
 */
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, { FadeIn, FadeOut, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { useTyping } from '../../hooks/useTyping';
import { useOnlineStatus, formatLastSeen } from '../../hooks/useOnlineStatus';
import useChatStore from '../../store/chatStore';

import GlassCard from '../../components/shared/GlassCard'; // ← nuevo: usamos GlassCard
import MessageBubble from '../../components/chat/MessageBubble';
import TypingIndicator from '../../components/chat/TypingIndicator';
import ChatInput from '../../components/chat/ChatInput';

import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { formatSectionDate } from '../../utils/chatUtils';

// Date separator con glass sutil
function DateSeparator({ label }) {
  return (
    <GlassCard variant="elevated" style={styles.dateSep}>
      <Text style={styles.dateLabel}>{label}</Text>
    </GlassCard>
  );
}

// Header con GlassCard + glow en dot online
function ChatHeader({ titulo, isOnline, lastSeen, onBack }) {
  const subtitle = isOnline ? 'En línea' : formatLastSeen(lastSeen, false);

  const dotStyle = useMemo(
    () => ({
      ...styles.onlineDot,
      backgroundColor: isOnline ? PROF.available : PROF.offline,
      ...SHADOWS.glow, // glow turquesa sutil cuando online
    }),
    [isOnline]
  );

  return (
    <GlassCard variant="elevated" glow style={styles.header}>
      <StatusBar barStyle="light-content" backgroundColor={PROF.bg} />
      <View style={styles.headerInner}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={PROF.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {titulo || 'Chat con proveedor'}
          </Text>
          <View style={styles.onlineRow}>
            <Animated.View style={dotStyle} />
            <Text style={styles.subtitleText}>{subtitle}</Text>
          </View>
        </View>

        <View style={{ width: 48 }} /> {/* spacer */}
      </View>
    </GlassCard>
  );
}

// Scroll-to-bottom FAB con glow
function ScrollToBottomBtn({ visible, onPress }) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.fab}>
      <TouchableOpacity style={[styles.fabBtn, SHADOWS.glow]} onPress={onPress}>
        <Ionicons name="chevron-down" size={24} color={PROF.textPrimary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ChatScreen({ route, navigation }) {
  const { solicitudId, destinatarioId, titulo, chatId } = route.params || {};
  const { user } = useAuth();

  const {
    messages,
    loading,
    sending,
    uploadingImage,
    loadingMore,
    hasMore,
    error,
    sendText,
    pickImageFromLibrary,
    takePhoto,
    loadMore,
    notifyTyping,
  } = useChat(solicitudId, destinatarioId);

  const { isOtherTyping } = useTyping(solicitudId);
  useOnlineStatus(destinatarioId);

  const presence = useChatStore((s) => s.presence[String(destinatarioId)]);
  const isOnline = presence?.online ?? false;
  const lastSeen = presence?.lastSeen ?? null;

  const flatListRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const handleScroll = useCallback((e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    setShowScrollBtn(distFromBottom > 100);
  }, []);

  const handleScrollToBottom = useCallback(() => {
    Haptics.selectionAsync();
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const listData = useMemo(() => {
    if (!messages.length) return [];
    const items = [];
    let lastDate = null;
    messages.forEach((msg) => {
      const d = msg.fechaEnvio || msg.createdAt;
      const date = d ? new Date(d).toDateString() : 'unknown';
      if (date !== lastDate) {
        lastDate = date;
        items.push({ _type: 'separator', id: `sep_${date}`, label: formatSectionDate(d ? new Date(d) : null) });
      }
      items.push({ _type: 'message', ...msg });
    });
    return items;
  }, [messages]);

  const renderItem = useCallback(
    ({ item }) => {
      if (item._type === 'separator') {
        return <DateSeparator label={item.label} />;
      }
      const isOwn = item.remitenteId === user?.id || item.remitenteId === user?.userId;
      return <MessageBubble message={item} isOwn={isOwn} senderName={!isOwn ? titulo : undefined} />;
    },
    [user?.id, titulo]
  );

  if (loading) {
    return (
      <LinearGradient colors={PROF.gradMain} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PROF.accent} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={PROF.gradMain} style={styles.screen}>
      <ChatHeader titulo={titulo} isOnline={isOnline} lastSeen={lastSeen} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1 }}>
          {error && (
            <GlassCard variant="accent" style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </GlassCard>
          )}

          {(uploadingImage || sending) && (
            <GlassCard variant="elevated" style={styles.uploadBanner}>
              <ActivityIndicator size="small" color={PROF.accent} />
              <Text style={styles.uploadText}>{uploadingImage ? 'Subiendo imagen…' : 'Enviando…'}</Text>
            </GlassCard>
          )}

          <FlatList
            ref={flatListRef}
            data={listData}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id || item._type + '_' + item.label)}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              loadingMore ? (
                <ActivityIndicator size="small" color={PROF.accent} style={{ padding: SPACING.md }} />
              ) : hasMore ? (
                <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}>
                  <Text style={styles.loadMoreText}>Cargar mensajes anteriores</Text>
                </TouchableOpacity>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={64} color={PROF.textMuted} />
                <Text style={styles.emptyText}>Inicia la conversación</Text>
              </View>
            }
            onScroll={handleScroll}
            scrollEventThrottle={16}
            inverted={false} // no invertimos, usamos scrollToEnd
            removeClippedSubviews={Platform.OS === 'android'}
            keyboardShouldPersistTaps="handled"
          />

          <TypingIndicator visible={isOtherTyping} />

          <ChatInput
            onSendText={(text) => sendText(text)}
            onPickImage={pickImageFromLibrary}
            onTakePhoto={takePhoto}
            onTyping={notifyTyping}
            disabled={sending || uploadingImage}
          />
        </View>
      </KeyboardAvoidingView>

      <ScrollToBottomBtn visible={showScrollBtn} onPress={handleScrollToBottom} />
    </LinearGradient>
  );
}

// Estilos actualizados (más consistentes con tu tema)
const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginTop: Platform.OS === 'ios' ? 0 : 8, marginHorizontal: SPACING.md, marginBottom: SPACING.sm },
  headerInner: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm },
  backBtn: { padding: SPACING.sm },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: PROF.textPrimary, fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  subtitleText: { color: PROF.textSecondary, fontSize: TYPOGRAPHY.sm },
  listContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl + 80 },
  dateSep: { alignSelf: 'center', marginVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  dateLabel: { color: PROF.textMuted, fontSize: TYPOGRAPHY.sm },
  loadMoreBtn: { alignItems: 'center', padding: SPACING.md },
  loadMoreText: { color: PROF.accent, fontWeight: TYPOGRAPHY.medium },
  fab: { position: 'absolute', right: SPACING.md, bottom: 100, zIndex: 10 },
  fabBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PROF.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PROF.glassBorder,
  },
  errorBanner: { margin: SPACING.md, padding: SPACING.sm },
  errorText: { color: PROF.error, textAlign: 'center', fontSize: TYPOGRAPHY.sm },
  uploadBanner: { margin: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, padding: SPACING.sm },
  uploadText: { color: PROF.textSecondary, fontSize: TYPOGRAPHY.sm },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.lg, paddingTop: 120 },
  emptyText: { color: PROF.textMuted, fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.medium },
});