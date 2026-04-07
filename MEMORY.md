# MEMORY.md - Long-Term Memory

## Project: Homecare Colorimetría
- **Stack:** React Native + Expo SDK 55
- **State:** Zustand
- **Auth/Backend:** Firebase
- **Animations:** Reanimated
- **Design:** Premium con GlassCard
- **Modes:** Usuario + Profesional
- **Lead Dev:** Andres (Owner)
- **Role:** Senior Architect

## Key Decisions
- 2026-04-04: Se extrajo `computeLevel()` a `utils/levelUtils.js` (antes duplicado en ProfileScreen + ProfileHeader)
- 2026-04-04: Se creó `services/storageService.js` para upload de avatares a Firebase Storage (usa ImageManipulator para resize)
- 2026-04-04: Se agregó `updateUser()` a AuthContext para reflejar cambios de perfil sin re-login
- 2026-04-04: Se creó `EditProfileScreen` con formulario real + selección de foto (galería/cámara)
- 2026-04-04: ProfileScreen ahora navega a EditProfile en vez de mostrar Alert placeholder
- 2026-04-04: Se eliminó ruta rota `CityToCity` del Drawer profesional (no existía en AppNavigator)
- 2026-04-04: Se integró `QuickActionButtons` component (existía pero no se usaba desde ProfileScreen)

## Lessons Learned
- expo-image-picker ya estaba instalado (~17.0.10) — verificar antes de instalar deps
- Firebase Storage ya estaba configurado (`getStorage` en config/firebase.js)
