/* eslint-disable no-undef */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock SafeAreaContext
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }) => require('react').createElement(View, props, children),
  };
});


// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const { View, Text, Image, ScrollView, FlatList } = require('react-native');
  const chainable = () => ({
    duration: chainable,
    delay: chainable,
    springify: chainable,
    damping: chainable,
    stiffness: chainable,
  });

  return {
    __esModule: true,
    default: {
      View,
      Text,
      Image,
      ScrollView,
      FlatList,
      createAnimatedComponent: (c) => c,
    },
    View,
    Text,
    Image,
    ScrollView,
    FlatList,
    createAnimatedComponent: (c) => c,
    useSharedValue: (init) => ({ value: init }),
    useAnimatedStyle: (fn) => {
      try {
        return fn() || {};
      } catch {
        return {};
      }
    },
    withSpring: (toValue) => toValue,
    withTiming: (toValue) => toValue,
    withRepeat: (anim) => anim,
    withSequence: (...anims) => anims[0],
    withDelay: (_, anim) => anim,
    interpolate: (val, input, output) => output[0],
    interpolateColor: () => '#000000',
    FadeIn: chainable(),
    FadeInDown: chainable(),
    FadeInUp: chainable(),
    FadeOut: chainable(),
    FadeOutDown: chainable(),
    FadeOutUp: chainable(),
    ZoomIn: chainable(),
    SlideInRight: chainable(),
    SlideInUp: chainable(),
    Layout: chainable(),
    Easing: {
      bezier: () => ({}),
      linear: () => ({}),
      ease: () => ({}),
      in: () => ({}),
      out: () => ({}),
      inOut: () => ({}),
    },
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
  };
});

// Mock Worklets
jest.mock('react-native-worklets', () => ({
  useWorklet: jest.fn(),
  createSerializable: (fn) => fn,
  isWorklet: jest.fn(() => false),
  WorkletsModule: {},
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockIcon = (props) => React.createElement(Text, null, props.name || 'icon');
  return {
    Ionicons: MockIcon,
    MaterialIcons: MockIcon,
    MaterialCommunityIcons: MockIcon,
    FontAwesome: MockIcon,
    Feather: MockIcon,
  };
});
