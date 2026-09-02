---
name: react-native-expo-expert
description: >-
  Expert guidelines and workflows for React Native development with Expo SDK, Reanimated animations,
  Glassmorphism styling, Zustand state management, and mobile UI/UX optimization in the Homecare app.
---

# React Native & Expo Development Skill

Use this skill when implementing, refactoring, or optimizing React Native components and screens within the Expo ecosystem.

## Core Architectural Principles

1. **Design System & Palette Tokens**:
   - Primary Dark: `#001B38`
   - Accent Medium: `#0E4D68`
   - Highlight Cyan: `#49C0BC`
   - Backgrounds & Cards: Utilize `GlassCard` and blur views with proper fallback opacities.
2. **State Management**:
   - Use `Zustand` for global reactive states (Auth, Service Requests, Live GPS tracking).
   - Use React local state (`useState`, `useReducer`) exclusively for ephemeral UI interactions.
3. **Animations with Reanimated**:
   - Always prefer `react-native-reanimated` worklets over JS-thread animations for 60fps gestures and transitions.
   - Use `useSharedValue`, `useAnimatedStyle`, and `withTiming`/`withSpring`.
4. **Navigation**:
   - Maintain route integrity in `AppNavigator` / React Navigation stacks and drawer layouts.
   - Ensure parameterized screens have strict TypeScript / JS prop validation.
5. **Assets & Storage**:
   - Use `expo-image-picker` with `ImageManipulator` for resizing before uploading to cloud storage.

## Validation Checklist
- Run typecheck and linting on mobile components.
- Check responsive layout across Android and iOS screen dimensions and safe areas (`useSafeAreaInsets`).
