import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BORDER_RADIUS } from '../../constants/theme';

/**
 * SkeletonLoader — Componente de carga visual suave con efecto Shimmer.
 * Ideal para reemplazar spinners y dar sensación de carga instantánea.
 */
export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = BORDER_RADIUS.md,
  style,
}) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1300, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-200, 200]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={[
        styles.skeletonContainer,
        { width, height, borderRadius },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.02)',
            'rgba(73, 192, 188, 0.12)',
            'rgba(255, 255, 255, 0.02)',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    backgroundColor: 'rgba(14, 77, 104, 0.2)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(73, 192, 188, 0.1)',
  },
});
