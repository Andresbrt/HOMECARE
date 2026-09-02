# Mobile Workspace Rules

1. **Brand Palette**:
   - Primary: `#001B38`
   - Secondary: `#0E4D68`
   - Radiant Highlight: `#49C0BC`
   - Surface: `#0A1118` / `#F8FAFC`
2. **Glassmorphism**: Always wrap card containers in `GlassCard` with subtle borders and elevation shadows.
3. **8-Point Grid**: All spacing, padding, and heights must be multiples of 4 and 8.
4. **Touch Targets**: Minimum 44x44pt target area for all interactive elements (use `hitSlop` where needed).
5. **Reanimated & Gestures**: Use `withSpring` physics and worklets for interactive gestures and transitions.
6. **State & Security**: Use `Zustand` for global state and `expo-secure-store` for tokens (never plain `AsyncStorage`).
