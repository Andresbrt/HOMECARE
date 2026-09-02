/**
 * TypingIndicator — animated 3-dot typing bubble (WhatsApp style)
 * Shown when the other participant is composing a message.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { PROF, BORDER_RADIUS, SPACING } from '../../constants/theme';

const DOT_SIZE = 8;
const BOUNCE_DELAY = 180; // ms between dots

function Dot({ delay }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 300 }),
          withTiming(0, { duration: 300 }),
        ),
        -1, // infinite
        false,
      ),
    );
  }, [delay]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[styles.dot, animStyle]} />;
}

export default function TypingIndicator({ visible }) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(250)}
      style={styles.container}
    >
      <View style={styles.bubble}>
        <Dot delay={0} />
        <Dot delay={BOUNCE_DELAY} />
        <Dot delay={BOUNCE_DELAY * 2} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
    alignSelf: 'flex-start',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PROF.glass,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: PROF.accent,
    opacity: 0.85,
  },
});
