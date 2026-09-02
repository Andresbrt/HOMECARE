---
name: mobile-ui-ux-design-pro
description: >-
  Expert mobile UI/UX design intelligence based on 8-point grid rhythm, visual hierarchy,
  Glassmorphism aesthetics, color tokens (#001B38, #0E4D68, #49C0BC), and high-conversion UX psychology.
---

# Mobile UI/UX Design Pro Skill

Use this skill when designing, redesigning, or refining screens, navigation components, modals, and card elements for the Homecare mobile application.

## 1. Visual Hierarchy & 8-Point Grid System
- **Spacing Rhythm**: All margins, paddings, and component heights must align to multiples of 4 and 8 (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`).
- **Typography Scale**:
  - Display / Hero Title: `28px` - `32px` (Bold / Heavy, tight letter spacing `-0.5px`)
  - Screen Header (`H1`): `22px` - `24px` (SemiBold)
  - Section Header (`H2`): `18px` - `20px` (Medium / SemiBold)
  - Body Text: `14px` - `16px` (Regular, line-height 1.4x)
  - Captions / Micro-copy: `12px` - `13px` (Medium, higher contrast)

## 2. Palette & Glassmorphism Tokens
- **Brand Colors**:
  - Primary Base: `#001B38` (Deep Midnight Blue)
  - Secondary Accent: `#0E4D68` (Deep Ocean Cyan)
  - Radiant Highlight: `#49C0BC` (Vibrant Cyan Teal)
  - Background Neutral: `#0A1118` (Dark mode background) / `#F8FAFC` (Light surface)
  - Success / Active: `#10B981`
  - Warning / Bidding: `#F59E0B`
  - Danger / Cancel: `#EF4444`
- **GlassCard Formula**:
  - Background: `rgba(14, 77, 104, 0.25)` or `rgba(255, 255, 255, 0.08)`
  - Border: `1px solid rgba(73, 192, 188, 0.2)`
  - Backdrop blur / overlay with soft drop shadow: `shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16`.

## 3. UX Principles & Interaction Psychology
- **Peak-End Rule**: Ensure critical actions (e.g. accepting an inDriver offer, confirming a payment, rating a provider) end with satisfying visual confirmation and celebration animations.
- **Empty States**: Never leave blank screens. Always provide engaging illustrations, helpful microcopy, and a prominent primary action button.
- **Progressive Disclosure**: Keep primary cards clean and readable; expose deeper details via expandable accordions or bottom sheets.
