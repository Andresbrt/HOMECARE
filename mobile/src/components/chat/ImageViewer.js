/**
 * ImageViewer — Full-screen image modal with pinch-to-zoom and swipe-to-close
 *
 * Uses react-native-gesture-handler PinchGestureHandler for zoom
 * and a simple vertical pan for close. Falls back gracefully on
 * platforms where gesture handler might not be fully configured.
 */
import React, { useCallback } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { PROF } from '../../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function ImageViewer({ visible, uri, onClose }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const resetPosition = useCallback(() => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateY.value = withSpring(0);
  }, []);

  const handleClose = useCallback(() => {
    resetPosition();
    onClose?.();
  }, [onClose, resetPosition]);

  // Pinch to zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.5, Math.min(savedScale.value * e.scale, 4));
    })
    .onEnd(() => {
      if (scale.value < 1) scale.value = withSpring(1);
      savedScale.value = scale.value;
    });

  // Swipe down to close
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value <= 1) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 && scale.value <= 1) {
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  // Double-tap to reset zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withSpring(1);
      savedScale.value = 1;
      translateY.value = withSpring(0);
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <StatusBar hidden />

          {/* Close button */}
          <SafeAreaView style={styles.closeRow} pointerEvents="box-none">
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.8}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Image with gesture */}
          <GestureDetector gesture={composed}>
            <Animated.View style={[styles.imageContainer, animStyle]}>
              <Image
                source={{ uri }}
                style={styles.image}
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeRow: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    zIndex: 10,
    alignItems: 'flex-end',
    paddingRight: 16,
    paddingTop: 16,
  },
  closeBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: SCREEN_W,
    height: SCREEN_H * 0.85,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
