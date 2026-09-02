import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../services/apiClient';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

const NOTIF_ICONS = {
  NUEVA_OFERTA: { name: 'pricetag', color: COLORS.accent },
  OFERTA_ACEPTADA: { name: 'checkmark-circle', color: COLORS.success },
  NUEVA_SOLICITUD: { name: 'document-text', color: COLORS.info },
  SERVICIO_ACTUALIZADO: { name: 'sync', color: COLORS.warning },
  MENSAJE: { name: 'chatbubble', color: COLORS.accent },
  PAGO: { name: 'cash', color: COLORS.success },
  CALIFICACION: { name: 'star', color: COLORS.warning },
  DEFAULT: { name: 'notifications', color: COLORS.textSecondary },
};

function NotificationItem({ item, onPress }) {
  const icon = NOTIF_ICONS[item.tipo] || NOTIF_ICONS.DEFAULT;
  const timeAgo = getTimeAgo(item.createdAt);

  return (
    <TouchableOpacity
      style={[styles.notifCard, !item.leida && styles.notifUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: icon.color + '20' }]}>
        <Ionicons name={icon.name} size={22} color={icon.color} />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !item.leida && styles.notifTitleUnread]} numberOfLines={1}>
          {item.titulo}
        </Text>
        <Text style={styles.notifMessage} numberOfLines={2}>{item.mensaje}</Text>
        <Text style={styles.notifTime}>{timeAgo}</Text>
      </View>
      {!item.leida && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return date.toLocaleDateString();
}

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/notificaciones');
      setNotifications(data);
    } catch (error) {
      // Silent fail on refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleRefresh = () => { setRefreshing(true); fetchNotifications(); };

  const handlePress = async (notif) => {
    // Mark as read
    if (!notif.leida) {
      try {
        await apiClient.put(`/notificaciones/${notif.id}/leer`);
        setNotifications(prev =>
          prev.map(n => n.id === notif.id ? { ...n, leida: true } : n)
        );
      } catch (error) { /* ignore */ }
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.put('/notificaciones/leer-todas');
      setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
    } catch (error) { /* ignore */ }
  };

  const unreadCount = notifications.filter(n => !n.leida).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Leer todas</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <NotificationItem item={item} onPress={handlePress} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color={COLORS.textDisabled} />
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptyDesc}>Aquí verás actualizaciones de tus servicios y ofertas.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  headerTitle: { flex: 1, fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.bold, color: COLORS.textPrimary },
  markAllText: { fontSize: TYPOGRAPHY.sm, color: COLORS.accent, fontWeight: TYPOGRAPHY.semibold },
  listContent: { paddingHorizontal: SPACING.lg, gap: SPACING.xs },
  notifCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, gap: SPACING.md },
  notifUnread: { backgroundColor: COLORS.accent + '08' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.medium, color: COLORS.textPrimary },
  notifTitleUnread: { fontWeight: TYPOGRAPHY.bold },
  notifMessage: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, marginTop: 2 },
  notifTime: { fontSize: TYPOGRAPHY.xs, color: COLORS.textDisabled, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  emptyState: { alignItems: 'center', paddingTop: SPACING.xxl * 2 },
  emptyTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.semibold, color: COLORS.textPrimary, marginTop: SPACING.md },
  emptyDesc: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs, paddingHorizontal: SPACING.xl },
});
