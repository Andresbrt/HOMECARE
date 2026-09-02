---
name: micro-interactions-and-gestures
description: >-
  Advanced React Native and Reanimated micro-interactions, spring physics, gesture handling,
  skeleton loading states, and haptic feedback to elevate the app's tactile feel.
---

# Micro-Interactions & Gestures Skill

Use this skill when building interactive buttons, swipeable cards, modal transitions, pull-to-refresh animations, and real-time state feedback.

## 1. Physics-Based Spring Animations
- Avoid linear or abrupt transitions. Use `withSpring` from `react-native-reanimated` with natural damping configurations:
  ```javascript
  const scale = useSharedValue(1);
  const onPressIn = () => { scale.value = withSpring(0.96, { damping: 15, stiffness: 200 }); };
  const onPressOut = () => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }); };
  ```
- Apply micro-press scaling to all primary action buttons, bid cards, and navigation chips.

## 2. Skeleton Loaders & Progressive Rendering
- Replace raw spinners with shimmering skeleton cards matching the exact layout of incoming content.
- Keep shimmer animations at 1.5s linear loop with subtle gradient sweep (`rgba(255,255,255,0.05)` -> `rgba(255,255,255,0.15)` -> `rgba(255,255,255,0.05)`).

## 3. Gestures & Swipeable Cards
- Use `react-native-gesture-handler` (`GestureDetector` / `PanGestureHandler`) for offer swipe dismissals, bottom sheet dragging, and drawer interactions.
- Provide clear visual resistance thresholds before committing irreversible swipe actions (e.g. Reject offer).

## 4. Haptic Feedback Integration
- Trigger light haptics (`expo-haptics`) on button tap, selection changes, and pull-to-refresh triggers.
- Trigger medium/success haptics on payment completion and offer acceptance.
- Trigger warning/error haptics on failed inputs or canceled requests.
