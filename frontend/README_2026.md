# 📱 HomeCare Frontend - React Native 0.84.3 + Expo SDK 55

**Versión:** 1.0.0  
**Última actualización:** Marzo 2026  
**New Architecture:** ✅ Habilitada

---

## 🚀 Stack Tecnológico (Marzo 2026)

| Tecnología | Versión | Estado |
|------------|---------|--------|
| **React** | 19.2.0 | ✅ Actualizado |
| **React Native** | 0.84.3 | ✅ Actualizado |
| **Expo SDK** | 55.0.0 | ✅ Actualizado |
| **React Navigation** | 7.2.0 | ✅ Actualizado |
| **TypeScript** | 5.7.2 | ✅ Actualizado |
| **New Architecture** | Habilitada | ✅ Configurado |

---

## ⚡ Inicio Rápido

### Prerrequisitos

- **Node.js:** 20+ (recomendado) o 18+
- **npm:** 10+
- **Expo CLI:** Se instala automáticamente
- **Git:** Para control de versiones

### Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Generar archivos nativos (Primera vez)
npx expo prebuild --clean

# 3. Iniciar desarrollo
npx expo start --dev-client --clear
```

### Ejecutar en Dispositivo/Emulador

```bash
# Android
npx expo run:android

# iOS (Mac only)
npx expo run:ios
```

---

## 📂 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── Button.js        # ✅ Optimizado
│   │   ├── Input.js         # ✅ Optimizado
│   │   ├── Card.js
│   │   ├── Header.js
│   │   ├── ErrorBoundary.js # ✅ NUEVO
│   │   └── ...
│   ├── screens/             # Pantallas de la app
│   │   ├── client/          # Pantallas de cliente
│   │   ├── provider/        # Pantallas de proveedor
│   │   ├── admin/           # Pantallas de admin
│   │   └── auth/            # Login, Register, etc.
│   ├── services/            # API services
│   │   ├── apiClient.js     # Cliente HTTP
│   │   ├── authService.js   # Autenticación
│   │   └── ...
│   ├── context/             # React Contexts
│   │   ├── AuthContext.js   # Auth state
│   │   └── NetworkContext.js # ✅ NUEVO - Network detection
│   ├── config/              # Configuración
│   │   ├── apiConfig.js     # API endpoints
│   │   └── secureStorage.js # ✅ NUEVO - Secure token storage
│   ├── navigation/          # React Navigation
│   │   ├── AppNavigator.js  # Main navigator
│   │   └── DeepLinking.js   # Deep links
│   └── theme/               # Estilos globales
│       └── index.js
├── android/                 # Android native code
│   └── gradle.properties    # ✅ New Architecture enabled
├── ios/                     # iOS native code
│   └── Podfile              # ✅ New Architecture enabled
├── app.json                 # ✅ Expo config (New Arch)
├── babel.config.js          # ✅ Babel + Hermes
├── metro.config.js          # ✅ Metro bundler config
├── eas.json                 # ✅ EAS Build config
├── package.json             # ✅ Dependencies actualizadas
└── README.md                # Este archivo
```

---

## 🏗️ New Architecture

Este proyecto tiene **React Native New Architecture habilitada obligatoriamente**.

### ¿Qué es New Architecture?

- **Fabric:** Nuevo renderizador de UI (más rápido, más fluido)
- **TurboModules:** Carga lazy de módulos nativos
- **JSI (JavaScript Interface):** Comunicación directa JS ↔ C++ sin bridge
- **Hermes V1:** Motor JavaScript optimizado

### Beneficios

- ⚡ **40% más rápido** en startup time
- 🎨 **60fps estables** en UI complejas
- 💾 **25% menos uso de memoria**
- 🔋 **Mejor eficiencia energética**

### Verificar New Architecture

```javascript
// En cualquier componente
import { TurboModuleRegistry } from 'react-native';

useEffect(() => {
  console.log('Fabric enabled:', global.nativeFabricUIManager != null);
  console.log('TurboModules enabled:', TurboModuleRegistry != null);
}, []);
```

---

## 🔐 Seguridad

### Almacenamiento Seguro de Tokens

**NO usar AsyncStorage para tokens JWT**. Este proyecto usa **expo-secure-store**.

```javascript
import { tokenManager } from './src/config/secureStorage';

// Guardar tokens
await tokenManager.setAccessToken(token);

// Obtener tokens
const token = await tokenManager.getAccessToken();

// Limpiar en logout
await tokenManager.clearTokens();
```

Más detalles en [src/config/secureStorage.js](src/config/secureStorage.js).

---

## 🌐 Network Detection

Detección en tiempo real de conexión a internet.

```javascript
import { useNetwork } from './src/context/NetworkContext';

function MyScreen() {
  const { isConnected, isInternetReachable } = useNetwork();

  if (!isConnected) {
    return <OfflineScreen />;
  }

  return <NormalContent />;
}
```

Más detalles en [src/context/NetworkContext.js](src/context/NetworkContext.js).

---

## 🛡️ Error Boundaries

Captura errores en componentes y muestra UI de fallback.

```javascript
import ErrorBoundary from './src/components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Más detalles en [src/components/ErrorBoundary.js](src/components/ErrorBoundary.js).

---

## 🎨 Componentes Optimizados

### Button Component

✅ **Optimizado para New Architecture + React 19.2**

```javascript
import Button from './src/components/Button';

<Button
  title="Solicitar Servicio"
  onPress={handlePress}
  variant="primary"  // primary | secondary | outline | danger
  loading={isLoading}
  disabled={isDisabled}
/>
```

### Input Component

✅ **Con validación y máscaras**

```javascript
import Input from './src/components/Input';

<Input
  label="Teléfono"
  value={phone}
  onChangeText={setPhone}
  mask="phone"  // phone | currency | date
  keyboardType="phone-pad"
  required
/>
```

---

## 🧪 Testing

### Unit Tests

```bash
# Ejecutar todos los tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### E2E Tests (Detox)

```bash
# Build para E2E
npm run build:e2e:android

# Ejecutar tests E2E
npm run test:e2e:android
```

---

## 📦 Build con EAS

### Setup Inicial

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar proyecto
eas build:configure
```

### Builds

```bash
# Development (internal testing)
eas build --profile development --platform android

# Preview (stakeholders/beta)
eas build --profile preview --platform all

# Production (app stores)
eas build --profile production --platform all
```

### OTA Updates

```bash
# Publicar update sin rebuild
eas update --branch production --message "Bug fixes"

# Rollback si es necesario
eas update:rollback
```

---

## 🔧 Configuración del Backend

Actualiza la URL del backend en `src/config/apiConfig.js`:

```javascript
// Desarrollo local
const DEV_BASE_URL = 'http://10.0.2.2:8080/api'; // Android emulator
// const DEV_BASE_URL = 'http://localhost:8080/api'; // iOS simulator
// const DEV_BASE_URL = 'http://192.168.1.100:8080/api'; // Dispositivo físico (usa tu IP)

// Producción
const PROD_BASE_URL = 'https://api.homecare.com/api';

export const API_CONFIG = {
  BASE_URL: __DEV__ ? DEV_BASE_URL : PROD_BASE_URL,
  TIMEOUT: 30000,
};
```

Para obtener tu IP local en Windows:

```bash
ipconfig
# Busca "Dirección IPv4"
```

---

## 📊 Performance Monitoring

### Flipper (Debugging Avanzado)

```bash
# Instalar Flipper
# https://fbflipper.com/

# Ejecutar app en modo debug
npx expo run:android --variant debug
```

### Bundle Size Analysis

```bash
# Generar bundle
npx expo export --dump-sourcemap

# Visualizar
npx react-native-bundle-visualizer
```

---

## 🚨 Troubleshooting

### "Unable to resolve module"

```bash
npm install
npx expo start --clear
```

### "Build failed: duplicate class"

```bash
cd android
./gradlew clean
cd ..
npx expo prebuild --clean
```

### "Pod install failed" (iOS)

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### New Architecture no está habilitada

Verifica `app.json`:

```json
{
  "expo": {
    "newArchEnabled": true,
    "ios": { "newArchEnabled": true },
    "android": { "newArchEnabled": true }
  }
}
```

Luego:

```bash
npx expo prebuild --clean
```

---

## 📚 Documentación

- [📄 Auditoría Técnica Completa](../AUDIT_REPORT_2026.md)
- [🚀 Quick Start Guide](../QUICK_START_2026.md)
- [⚙️ Secure Storage](src/config/secureStorage.js)
- [🌐 Network Context](src/context/NetworkContext.js)
- [🛡️ Error Boundary](src/components/ErrorBoundary.js)

### Enlaces Externos

- [React Native 0.84 Docs](https://reactnative.dev/docs/0.84/getting-started)
- [Expo SDK 55 Docs](https://docs.expo.dev/versions/v55.0.0/)
- [React 19.2 Docs](https://react.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [New Architecture Guide](https://reactnative.dev/docs/new-architecture-intro)

---

## 🤝 Contribuir

### Workflow

1. Crear feature branch: `git checkout -b feature/nueva-funcionalidad`
2. Commit cambios: `git commit -m "feat: descripción"`
3. Push branch: `git push origin feature/nueva-funcionalidad`
4. Crear Pull Request

### Coding Standards

- ✅ Usar Pressable en lugar de TouchableOpacity
- ✅ Usar expo-image en lugar de Image
- ✅ Memoizar componentes pesados con React.memo
- ✅ Usar useCallback/useMemo para optimizaciones
- ✅ FlatList con renderingMode="adaptive" para listas
- ✅ Agregar accesibilidad completa (accessible, accessibilityLabel)
- ✅ Tests unitarios para nuevas funciones
- ✅ Documentar funciones complejas

---

## 📝 Licencia

MIT License

---

## 👥 Equipo

**Desarrollado por:** [Tu equipo]  
**Contacto:** [tu-email@example.com]  
**Última actualización:** Marzo 2026

---

## 🎯 Roadmap

- [x] Actualizar a React Native 0.84.3 + Expo SDK 55
- [x] Habilitar New Architecture
- [x] Implementar SecureStore para tokens
- [x] Agregar Network detection
- [x] Error Boundaries
- [ ] Migrar a Expo Router v4 (opcional)
- [ ] Completar accesibilidad (100%)
- [ ] Dark Mode completo
- [ ] Cobertura de tests >80%
- [ ] CI/CD con GitHub Actions
- [ ] Sentry integration

---

**🚀 HomeCare - Servicios del hogar, modernizados para 2026**
