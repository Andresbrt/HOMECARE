/**
 * MessageBubble — Premium glassmorphism chat bubble
 *
 * Own messages  → right-aligned, gradient accent background
 * Other messages → left-aligned, glass dark background + avatar initial
 *
 * Features:
 * - Text content with linkify-compatible styling
 * - Image messages  → tappable thumbnail → ImageViewer
 * - Read receipts  → double-check turquoise when leido=true
 * - Long-press     → emoji reaction picker (❤️ 👍 😂 👎 🔥)
 * - Quick reactions displayed below bubble
 * - Relative timestamps
 * - Reanimated FadeInDown entering animation
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PROF, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { formatChatTime } from '../../utils/chatUtils';
import useChatStore from '../../store/chatStore';
import ImageViewer from './ImageViewer';

const REACTIONS = ['❤️', '👍', '😂', '👎', '🔥'];

// ─── Avatar initial for other-user messages ───────────────────────────────────
function AvatarInitial({ name }) {
  const letter = (name || '?')[0].toUpperCase();
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{letter}</Text>
    </View>
  );
}

// ─── Reaction row below bubble ────────────────────────────────────────────────
function ReactionRow({ reactions, onToggle }) {
  if (!reactions || reactions.size === 0) return null;

  return (
    <View style={styles.reactionRow}>
      {Array.from(reactions.entries()).map(([emoji, users]) =>
        users.length > 0 ? (
          <TouchableOpacity
            key={emoji}
            style={styles.reactionPill}
            onPress={() => onToggle(emoji)}
            activeOpacity={0.7}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            {users.length > 1 && <Text style={styles.reactionCount}>{users.length}</Text>}
          </TouchableOpacity>
        ) : null,
      )}
    </View>
  );
}

// ─── Emoji picker modal ───────────────────────────────────────────────────────
function EmojiPicker({ visible, onSelect, onClose }) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.pickerOverlay} onPress={onClose}>
        <View style={styles.pickerContainer}>
          {REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.pickerEmoji}
              onPress={() => {
                Haptics.selectionAsync();
                onSelect(emoji);
              }}
            >
              <Text style={styles.pickerEmojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Main bubble ──────────────────────────────────────────────────────────────
export default function MessageBubble({ message, isOwn, senderName, index = 0 }) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const { toggleReaction, getReactions } = useChatStore();
  const scaleAnim = useSharedValue(1);

  const reactions = getReactions(message.id);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scaleAnim.value = withSpring(0.97, { damping: 10 });
    setTimeout(() => { scaleAnim.value = withSpring(1); }, 200);
    setPickerVisible(true);
  }, []);

  const handleReactionSelect = useCallback((emoji) => {
    toggleReaction(message.id, emoji, 'me'); // 'me' as own userId placeholder
    setPickerVisible(false);
  }, [message.id]);

  const handleToggleReaction = useCallback((emoji) => {
    Haptics.selectionAsync();
    toggleReaction(message.id, emoji, 'me');
  }, [message.id]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const isImage = message.tipo === 'IMAGEN';
  const timestamp = formatChatTime(message.fechaEnvio || message.createdAt);

  const BubbleContent = (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 30, 300)).duration(280).springify()}
      style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}
    >
      {!isOwn && <AvatarInitial name={senderName} />}

      <View style={styles.bubbleWrapper}>
        <Animated.View style={animStyle}>
          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={handleLongPress}
            delayLongPress={400}
            onPress={isImage ? () => setImageViewerVisible(true) : undefined}
          >
            {isOwn ? (
              <LinearGradient
                colors={PROF.gradAccent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.bubble, styles.bubbleOwn]}
              >
                <BubbleInner
                  message={message}
                  isOwn={isOwn}
                  isImage={isImage}
                  timestamp={timestamp}
                />
              </LinearGradient>
            ) : (
              <View style={[styles.bubble, styles.bubbleOther]}>
                {!isOwn && senderName && (
                  <Text style={styles.senderLabel}>{senderName}</Text>
                )}
                <BubbleInner
                  message={message}
                  isOwn={isOwn}
                  isImage={isImage}
                  timestamp={timestamp}
                />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        <ReactionRow
          reactions={reactions}
          onToggle={handleToggleReaction}
        />
      </View>
    </Animated.View>
  );

  return (
    <>
      {BubbleContent}

      <EmojiPicker
        visible={pickerVisible}
        onSelect={handleReactionSelect}
        onClose={() => setPickerVisible(false)}
      />

      {isImage && (
        <ImageViewer
          visible={imageViewerVisible}
          uri={message.contenido}
          onClose={() => setImageViewerVisible(false)}
        />
      )}
    </>
  );
}

// ─── Inner bubble content (text or image + time row) ─────────────────────────
function BubbleInner({ message, isOwn, isImage, timestamp }) {
  if (isImage) {
    return (
      <>
        <Image
          source={{ uri: message.contenido }}
          style={styles.imageThumb}
          resizeMode="cover"
        />
        <TimeRow isOwn={isOwn} timestamp={timestamp} leido={message.leido} />
      </>
    );
  }

  return (
    <>
      <Text
        style={[styles.messageText, isOwn ? styles.textOwn : styles.textOther]}
        selectable
      >
        {message.contenido}
      </Text>
      <TimeRow isOwn={isOwn} timestamp={timestamp} leido={message.leido} />
    </>
  );
}

function TimeRow({ isOwn, timestamp, leido }) {
  return (
    <View style={styles.timeRow}>
      <Text style={[styles.timeText, isOwn ? styles.timeOwn : styles.timeOther]}>
        {timestamp}
      </Text>
      {isOwn && (
        <Ionicons
          name={leido ? 'checkmark-done' : 'checkmark'}
          size={13}
          color={leido ? '#FFFFFF' : 'rgba(255,255,255,0.6)'}
          style={styles.checkmark}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 2,
    paddingHorizontal: SPACING.sm,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PROF.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
    marginBottom: 4,
  },
  avatarText: {
    color: PROF.textPrimary,
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
  },
  bubbleWrapper: {
    maxWidth: '78%',
  },
  bubble: {
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm + 2,
    paddingTop: SPACING.xs + 2,
    paddingBottom: SPACING.xs,
    overflow: 'hidden',
  },
  bubbleOwn: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: PROF.glassDark,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    borderBottomLeftRadius: 4,
  },
  senderLabel: {
    color: PROF.accent,
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    marginBottom: 2,
  },
  messageText: {
    fontSize: TYPOGRAPHY.sm,
    lineHeight: 20,
  },
  textOwn: {
    color: '#FFFFFF',
  },
  textOther: {
    color: PROF.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
    gap: 3,
  },
  timeText: {
    fontSize: 10,
  },
  timeOwn: {
    color: 'rgba(255,255,255,0.75)',
  },
  timeOther: {
    color: PROF.textSecondary,
  },
  checkmark: {
    marginLeft: 1,
  },
  imageThumb: {
    width: 200,
    height: 160,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: 4,
  },
  // Reaction row
  reactionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PROF.glass,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    color: PROF.textSecondary,
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
  },
  // Emoji picker
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    backgroundColor: PROF.bgElevated,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  pickerEmoji: {
    padding: SPACING.xs,
  },
  pickerEmojiText: {
    fontSize: 26,
  },
});
