/**
 * CTAButton — Botón CTA animado con glow turquesa
 * Spring physics en press + glow shadow iOS
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

const AnimatedView = Animated.View;

export default function CTAButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'outline' | 'ghost'
  size = 'md',          // 'sm' | 'md' | 'lg'
  icon,
  disabled = false,
  style,
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.955, { damping: 18, stiffness: 450 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 450 });
  };

  const sizeStyle = sizes[size];

  if (variant === 'outline') {
    return (
      <AnimatedView style={[animStyle, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={1}
          style={[styles.outlineBtn, sizeStyle, disabled && styles.disabled]}
        >
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.outlineText, textSizes[size]]}>{title}</Text>
        </TouchableOpacity>
      </AnimatedView>
    );
  }

  if (variant === 'ghost') {
    return (
      <AnimatedView style={[animStyle, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={1}
          style={[styles.ghostBtn, sizeStyle]}
        >
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.ghostText, textSizes[size]]}>{title}</Text>
        </TouchableOpacity>
      </AnimatedView>
    );
  }

  // Primary — gradiente turquesa + glow
  return (
    <AnimatedView style={[SHADOWS.glow, animStyle, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        style={[styles.touchable, disabled && styles.disabled]}
      >
        <LinearGradient
          colors={disabled ? ['#555', '#444'] : PROF.gradAccent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, sizeStyle]}
        >
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.primaryText, textSizes[size]]}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </AnimatedView>
  );
}

const sizes = {
  sm: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.sm },
  md: { paddingVertical: 14, paddingHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.md },
  lg: { paddingVertical: 18, paddingHorizontal: SPACING.xl, borderRadius: BORDER_RADIUS.lg },
};

const textSizes = {
  sm: { fontSize: TYPOGRAPHY.sm },
  md: { fontSize: TYPOGRAPHY.md },
  lg: { fontSize: TYPOGRAPHY.lg },
};

const styles = StyleSheet.create({
  touchable: { borderRadius: BORDER_RADIUS.md, overflow: 'hidden' },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#fff',
    fontFamily: TYPOGRAPHY.fontBold,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 0.3,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: PROF.accent,
    backgroundColor: 'transparent',
  },
  outlineText: {
    color: PROF.accent,
    fontFamily: TYPOGRAPHY.fontSemibold,
    fontWeight: TYPOGRAPHY.semibold,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PROF.accentDim,
    borderRadius: BORDER_RADIUS.md,
  },
  ghostText: {
    color: PROF.accent,
    fontFamily: TYPOGRAPHY.fontSemibold,
    fontWeight: TYPOGRAPHY.semibold,
  },
  iconWrap: { marginRight: SPACING.sm },
  disabled: { opacity: 0.45 },
});
