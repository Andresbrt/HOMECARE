# Mobile Architecture & Design Rules (React Native + Expo)

When modifying or creating files within the `mobile/` workspace:

## 1. Design System & Brand Identity
- **Palette Tokens**:
  - Primary Dark: `#001B38` (Midnight Navy)
  - Secondary Accent: `#0E4D68` (Deep Cyan)
  - Radiant Accent: `#49C0BC` (Vibrant Cyan Teal)
  - Dark Surface: `#0A1118` / Light Surface: `#F8FAFC`
- **Glassmorphism**: Use `GlassCard` for elevated containers, modals, and headers. Avoid solid, flat opaque cards where glassmorphic styling is expected.

## 2. 8-Point Grid Rhythm & Ergonomics
- Spacing, padding, and margins must strictly follow multiples of 4 and 8 (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`).
- **Touch Targets**: All interactive elements (buttons, chips, icons) must have a minimum touch target of **44x44 pt**. Use `hitSlop` when visual icon size is smaller.

## 3. State & Animation Standards
- **Global State**: Use `Zustand` for application-wide states (Auth, Solicitud, Tracking, Chat).
- **Animations**: Use `react-native-reanimated` with spring physics (`withSpring`) for 60fps gesture and layout transitions. Avoid un-workletted JS-thread animations for gestures.
- **Haptics**: Trigger subtle tactile feedback using `expo-haptics` on button presses and state transitions.

## 4. Security & Storage
- Never store tokens or PII in unencrypted `AsyncStorage`. Always use `expo-secure-store`.
- Sanitize and validate all input fields before submitting to backend REST or WebSocket endpoints.
