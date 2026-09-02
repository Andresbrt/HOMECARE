# Autonomous UI/UX & Accessibility Polish Workflow

**Role:** `Agent-UI-UX-Specialist`  
**Trigger:** On-Demand, Scheduled Routine, or Post-Component Creation  
**Goal:** Automatically audit mobile screens against the design system, touch targets, and accessibility requirements.

## Execution Steps

1. **Screen & Component Scan**:
   - Inspect files under `mobile/src/screens/` and `mobile/src/components/`.
2. **Design System & Tokens Verification**:
   - Verify color tokens match palette (`#001B38`, `#0E4D68`, `#49C0BC`).
   - Check that spacing aligns to the 8-point grid rhythm (4, 8, 12, 16, 24, 32).
   - Ensure `GlassCard` is used for elevated containers.
3. **Accessibility & Ergonomics (WCAG 2.1 AA)**:
   - Check interactive touch targets (minimum 44x44pt or `hitSlop` present).
   - Verify contrast ratio between text and backgrounds.
   - Ensure `accessibilityLabel` exists on icon-only buttons.
4. **Actionable Suggestions**:
   - Propose non-breaking cosmetic refinements and haptic feedback additions directly in task artifacts.
