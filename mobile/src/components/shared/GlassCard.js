/**
 * GlassCard — Tarjeta Glassmorphism Premium Homecare 2026
 * Efecto futurista con blur + glow turquesa + variantes
 */
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';
import { PROF, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

export default function GlassCard({
  children,
  style,
  innerStyle,
  intensity = 25,
  tint = 'dark',
  variant = 'default',        // 'default' | 'accent' | 'elevated'
  glow = false,
  animated = true,            // animación de entrada FadeIn
  padding = 16,
  noBorder = false,
}) {
  const glassStyle = [
    styles.blur,
    variant === 'accent' && styles.accentVariant,
    variant === 'elevated' && styles.elevatedVariant,
    noBorder && styles.noBorder,
    glow && styles.glow,
    style,
  ];

  const content = (
    <View style={[styles.inner, { padding }, innerStyle]}>
      {children}
    </View>
  );

  // Android: BlurView puede no aplicar correctamente; usar fallback opaco
  const CardComponent = Platform.OS === 'android' ? (
    <View style={[glassStyle, styles.fallback]}>{content}</View>
  ) : (
    <BlurView intensity={intensity} tint={tint} style={glassStyle}>{content}</BlurView>
  );

  return animated ? (
    <Animated.View entering={FadeIn.duration(400)}>
      {CardComponent}
    </Animated.View>
  ) : (
    CardComponent
  );
}

// ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  blur: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PROF.glassBorder,
    backgroundColor: PROF.glass,
  },
  noBorder: {
    borderWidth: 0,
  },
  accentVariant: {
    borderColor: PROF.accentGlow,
    backgroundColor: PROF.accentDim,
  },
  elevatedVariant: {
    backgroundColor: PROF.bgElevated,
    borderColor: PROF.glassBorder,
  },
  glow: {
    ...SHADOWS.glowStrong,
  },
  inner: {
    backgroundColor: 'transparent',
  },
  fallback: {
    backgroundColor: PROF.glassDark,
    borderColor: PROF.glassBorder,
  },
});
