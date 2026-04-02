/**
 * ChatListScreen — Conversation inbox
 *
 * Fetches the list of active chat conversations from REST endpoint
 * GET /mensajes/conversaciones
 *
 * Each conversation shows:
 * - Other participant's name + initial avatar
 * - Last message preview (text or "📷 Imagen")
 * - Relative timestamp
 * - Unread badge count
 * - Online status dot (from Firestore presence / chatStore)
 *
 * Navigates to ChatScreen on press with { solicitudId, destinatarioId, titulo }.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import useChatStore from '../../store/chatStore';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { formatRelativeTime } from '../../utils/chatUtils';

// ─── Avatar initial chip ──────────────────────────────────────────────────────
function Avatar({ name, isOnline }) {
  const letter = (name || '?')[0].toUpperCase();
  return (
    <View style={styles.avatarWrap}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{letter}</Text>
      </View>
      {isOnline && <View style={styles.onlineDot} />}
    </View>
  );
}

// ─── Single conversation row ──────────────────────────────────────────────────
function ConversationItem({ item, onPress, index }) {
  const { presence } = useChatStore();
  const otherUserId = String(item.otroUsuarioId || item.destinatarioId || '');
  const isOnline = presence[otherUserId]?.online ?? false;

  const lastMsg = item.ultimoMensaje;
  const preview =
    lastMsg?.tipo === 'IMAGEN'
      ? '📷 Imagen'
      : lastMsg?.contenido?.substring(0, 60) ?? 'Inicia la conversación';
  const time = formatRelativeTime(lastMsg?.fechaEnvio || lastMsg?.createdAt || item.updatedAt);
  const unread = item.mensajesNoLeidos ?? 0;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300).springify()}>
      <TouchableOpacity
        style={styles.item}
        onPress={() => onPress(item)}
        activeOpacity={0.75}
      >
        <Avatar name={item.otroUsuarioNombre || item.titulo} isOnline={isOnline} />

        <View style={styles.itemContent}>
          <View style={styles.itemTop}>
            <Text style={styles.nameText} numberOfLines={1}>
              {item.otroUsuarioNombre || item.titulo || 'Conversación'}
            </Text>
            <Text style={styles.timeText}>{time}</Text>
          </View>
          <View style={styles.itemBottom}>
            <Text
              style={[styles.previewText, unread > 0 && styles.previewUnread]}
              numberOfLines={1}
            >
              {preview}
            </Text>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const { setConversations } = useChatStore();
  const conversations = useChatStore((s) => s.conversations);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/mensajes/conversaciones');
      const list = Array.isArray(data) ? data : data.content ?? [];
      setConversations(list);
      setError(null);
    } catch (e) {
      console.error('[ChatListScreen] fetchConversations error:', e.message);
      setError('No se pudieron cargar los mensajes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const handlePress = useCallback(
    (item) => {
      const routeName = user?.rol === 'SERVICE_PROVIDER' ? 'Chat' : 'UserChat';
      navigation.navigate(routeName, {
        solicitudId: item.solicitudId,
        destinatarioId: item.otroUsuarioId || item.destinatarioId,
        titulo: item.otroUsuarioNombre || item.titulo || 'Chat',
      });
    },
    [navigation, user],
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <ConversationItem item={item} onPress={handlePress} index={index} />
    ),
    [handlePress],
  );

  const keyExtractor = useCallback((item) => String(item.solicitudId || item.id), []);

  return (
    <LinearGradient colors={PROF.gradMain} style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={PROF.bg} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={26} color={PROF.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mensajes</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={PROF.accent} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={40} color={PROF.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchConversations}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={PROF.accent}
                colors={[PROF.accent]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={52} color={PROF.textMuted} />
                <Text style={styles.emptyTitle}>Sin mensajes</Text>
                <Text style={styles.emptySubtitle}>
                  Tus conversaciones activas aparecerán aquí
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: PROF.glassBorder,
    backgroundColor: PROF.bgElevated,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', color: PROF.textPrimary, fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.semibold },
  listContent: { paddingTop: SPACING.xs },
  // Item
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: PROF.glassBorder,
  },
  avatarWrap: { marginRight: SPACING.sm, position: 'relative' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: PROF.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: PROF.textPrimary, fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: PROF.available,
    borderWidth: 2, borderColor: PROF.bg,
  },
  itemContent: { flex: 1 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  nameText: { flex: 1, color: PROF.textPrimary, fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold },
  timeText: { color: PROF.textMuted, fontSize: TYPOGRAPHY.xs, marginLeft: SPACING.xs },
  itemBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  previewText: { flex: 1, color: PROF.textSecondary, fontSize: TYPOGRAPHY.xs },
  previewUnread: { color: PROF.textPrimary, fontWeight: TYPOGRAPHY.medium },
  badge: {
    backgroundColor: PROF.accent, borderRadius: BORDER_RADIUS.full,
    minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5, marginLeft: SPACING.xs,
  },
  badgeText: { color: PROF.bg, fontSize: 11, fontWeight: TYPOGRAPHY.bold },
  // Error / empty
  errorText: { color: PROF.error, fontSize: TYPOGRAPHY.sm, textAlign: 'center' },
  retryBtn: { marginTop: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: PROF.accent },
  retryText: { color: PROF.accent, fontSize: TYPOGRAPHY.sm },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: SPACING.sm },
  emptyTitle: { color: PROF.textPrimary, fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.semibold },
  emptySubtitle: { color: PROF.textSecondary, fontSize: TYPOGRAPHY.sm, textAlign: 'center', paddingHorizontal: SPACING.xl },
});
