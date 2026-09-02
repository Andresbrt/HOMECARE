---
name: mobile-accessibility-and-contrast
description: >-
  WCAG 2.1 AA/AAA accessibility guidelines, contrast ratio optimization, minimum touch targets (44x44),
  screen reader semantics, and safe area handling for React Native.
---

# Mobile Accessibility & Usability Skill

Use this skill when auditing UI contrast, optimizing screen readability, refining touch target ergonomics, and ensuring accessibility compliance.

## 1. Touch Targets & Ergonomics (Fitts's Law)
- Minimum touch target for all interactive elements is **44x44 pt** (Android standard: 48x48 dp).
- For compact icons, expand touch bounds using `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}` to avoid accidental missed taps.
- Position primary thumb actions (e.g. "Publicar Solicitud", "Aceptar Oferta", "Pagar") in the lower two-thirds of the screen (natural thumb zone).

## 2. Contrast & Readability (WCAG 2.1 AA)
- Text vs Background contrast ratio must exceed **4.5:1** for standard body text and **3.0:1** for large text / icons.
- Avoid pure white `#FFFFFF` on pitch black `#000000` to prevent eye strain; use soft whites `#F1F5F9` and deep midnight blues `#001B38`.
- Ensure active cyan highlight `#49C0BC` is paired with dark backgrounds (`#001B38`, `#0A1118`) for optimal contrast.

## 3. Screen Reader Semantics & Focus
- Provide meaningful `accessibilityLabel` and `accessibilityHint` for icon-only buttons (e.g., Back button, Profile avatar, Chat send).
- Use `accessibilityRole="button"`, `accessibilityRole="header"`, or `accessibilityRole="tab"` explicitly.
- Mark decorative blur backgrounds and background gradients with `accessible={false}` to avoid noisy screen reader navigation.

## 4. Safe Area & Device Notches
- Always wrap screen roots with `SafeAreaProvider` and use `useSafeAreaInsets()` for notch, dynamic island, and home indicator margins.
