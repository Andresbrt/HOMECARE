# 🚀 QUICK START GUIDE - HomeCare Frontend 2026

Esta guía te permite comenzar a trabajar con el proyecto HomeCare actualizado a marzo 2026 en **5 minutos**.

---

## ⚡ INICIO RÁPIDO

### Prerrequisitos

Verifica que tienes instalado:

```bash
# Node.js 20+ (recomendado)
node --version  # Debe ser >= 18.0.0

# npm 10+
npm --version

# Git
git --version

# (Opcional) Yarn
yarn --version
```

### Instalación en 3 Comandos

```bash
# 1. Navegar al proyecto
cd "c:\Users\PC\Desktop\HOME CARE\frontend"

# 2. Instalar dependencias
npm install

# 3. Iniciar desarrollo
npx expo start --dev-client --clear
```

¡Listo! Ahora escanea el QR con **Expo Go** (desarrollo) o sigue los pasos avanzados abajo.

---

## 📱 DESARROLLO CON CUSTOM DEV CLIENT (Recomendado)

El custom dev client te permite usar módulos nativos en desarrollo.

### Primera Vez Setup

```bash
# 1. Limpiar todo
npm run clean  # o manualmente borrar node_modules
npm install

# 2. Generar archivos nativos con New Architecture
npx expo prebuild --clean

# Esto crea:
# ✅ android/ con New Architecture habilitada
# ✅ ios/ con New Architecture habilitada

# 3. Instalar pods (iOS, solo Mac)
cd ios
pod install
cd ..

# 4. Construir dev client
# Android
npx expo run:android

# iOS (Mac only)
npx expo run:ios

# Esto instala la app con dev client en tu dispositivo/emulador
```

### Desarrollo Diario

```bash
# Iniciar Metro bundler
npx expo start --dev-client

# En otra terminal, si necesitas reinstalar:
npx expo run:android  # Android
npx expo run:ios      # iOS
```

---

## 🔧 CONFIGURACIÓN EAS BUILD

Para builds profesionales en la nube.

### Setup EAS (Primera Vez)

```bash
# 1. Instalar EAS CLI globalmente
npm install -g eas-cli

# Verificar instalación
eas --version  # Debe ser >= 13.2.0

# 2. Login en Expo
eas login

# Usa tu cuenta de Expo o crea una nueva

# 3. Configurar proyecto
eas build:configure

# Esto actualiza app.json con projectId
```

### Primer Build

```bash
# Development build (para testing)
eas build --profile development --platform android

# Esto toma 10-15 minutos
# Al terminar, descarga el APK y acepta instalación

# Para iOS (requiere Apple Developer Account)
eas build --profile development --platform ios
```

### App.json - Actualizar Project ID

Después de `eas build:configure`, tu `app.json` debe tener:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "tu-project-id-generado-aqui"
      }
    }
  }
}
```

---

## 🌐 CONFIGURACIÓN BACKEND

### 1. Actualizar API Base URL

Edita `src/config/apiConfig.js`:

```javascript
// Para desarrollo local en Android emulator
const DEV_BASE_URL = 'http://10.0.2.2:8080/api';

// Para desarrollo local en iOS simulator
const DEV_BASE_URL = 'http://localhost:8080/api';

// Para dispositivo físico en misma red
const DEV_BASE_URL = 'http://192.168.1.100:8080/api'; // Usa tu IP local

export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? DEV_BASE_URL
    : 'https://api.homecare.com/api',  // Producción
  // ...
};
```

### 2. Obtener tu IP Local (Windows)

```bash
ipconfig

# Busca "Dirección IPv4" en tu adaptador de red WiFi/Ethernet
# Ejemplo: 192.168.1.100
```

Actualiza `DEV_BASE_URL` con esa IP si usas dispositivo físico.

---

## 🔐 MIGRAR TOKENS A SECURE STORE

**CRÍTICO:** AsyncStorage NO es seguro para tokens.

### Implementación

Reemplaza en `src/config/apiConfig.js`:

```javascript
// ❌ ANTES
import AsyncStorage from '@react-native-async-storage/async-storage';

export class TokenManager {
  static async setAccessToken(token) {
    await AsyncStorage.setItem('@homecare_access_token', token);
  }
  
  static async getAccessToken() {
    return await AsyncStorage.getItem('@homecare_access_token');
  }
}

// ✅ DESPUÉS
import * as SecureStore from 'expo-secure-store';

export class TokenManager {
  static async setAccessToken(token) {
    try {
      await SecureStore.setItemAsync('homecare_access_token', token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return true;
    } catch (error) {
      console.error('Error saving token:', error);
      return false;
    }
  }

  static async getAccessToken() {
    try {
      return await SecureStore.getItemAsync('homecare_access_token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  static async clearTokens() {
    try {
      await SecureStore.deleteItemAsync('homecare_access_token');
      await SecureStore.deleteItemAsync('homecare_refresh_token');
      return true;
    } catch (error) {
      console.error('Error clearing tokens:', error);
      return false;
    }
  }
}
```

**Buscar y reemplazar** todos los usos de `AsyncStorage` para tokens.

---

## 🌐 NETWORK DETECTION

Implementar detección de conexión a internet.

### 1. Crear NetworkContext

`src/context/NetworkContext.js`:

```javascript
import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

const NetworkContext = createContext({
  isConnected: true,
  isInternetReachable: true,
});

export function NetworkProvider({ children }) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);

      // Alerta cuando se pierde conexión
      if (!state.isConnected) {
        Alert.alert(
          'Sin conexión',
          'Verifica tu conexión a internet',
          [{ text: 'OK' }]
        );
      }
    });

    return unsubscribe;
  }, []);

  return (
    <NetworkContext value={{ isConnected, isInternetReachable }}>
      {children}
    </NetworkContext>
  );
}

export const useNetwork = () => useContext(NetworkContext);
```

### 2. Integrar en App.js

```javascript
import { NetworkProvider } from './src/context/NetworkContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NetworkProvider>
          <AuthProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </AuthProvider>
        </NetworkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

### 3. Usar en Pantallas

```javascript
import { useNetwork } from '../context/NetworkContext';

function ClientHomeScreen() {
  const { isConnected } = useNetwork();

  if (!isConnected) {
    return (
      <View style={styles.offline}>
        <Text>📡 Sin conexión</Text>
        <Text>Verifica tu internet</Text>
      </View>
    );
  }

  // Render normal
}
```

---

## 🧪 TESTING

### Unit Tests

```bash
# Ejecutar todos los tests
npm test

# Watch mode (desarrollo)
npm run test:watch

# Coverage report
npm run test:coverage

# Ver coverage en browser
start coverage/lcov-report/index.html
```

### E2E Tests (Detox)

```bash
# Build para E2E
npm run build:e2e:android

# Ejecutar E2E
npm run test:e2e:android

# iOS (Mac only)
npm run build:e2e:ios
npm run test:e2e:ios
```

---

## 🎨 REEMPLAZAR IMAGE POR EXPO-IMAGE

Para mejor performance y cache.

### Antes
```javascript
import { Image } from 'react-native';

<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode="cover"
/>
```

### Después
```javascript
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  contentFit="cover"          // Reemplaza resizeMode
  placeholder={blurhash}      // Placeholder mientras carga
  transition={200}            // Fade-in
  cachePolicy="memory-disk"   // Cache persistente
/>
```

**Buscar y reemplazar** todos los `import { Image } from 'react-native'`.

---

## 🔍 VERIFICAR NEW ARCHITECTURE

### En Tiempo de Ejecución

```javascript
// Agregar en App.js o cualquier pantalla
import { TurboModuleRegistry } from 'react-native';

useEffect(() => {
  const isFabricEnabled = global.nativeFabricUIManager != null;
  const isTurboModuleEnabled = TurboModuleRegistry != null;

  console.log('🏗️ Fabric (New Renderer):', isFabricEnabled);
  console.log('⚡ TurboModules:', isTurboModuleEnabled);
}, []);
```

### En Logs de Build

**Android:**
```bash
npx expo run:android --variant release

# Buscar en logs:
# ✅ "New architecture enabled: true"
# ✅ "Fabric enabled"
```

**iOS:**
```bash
npx expo run:ios --configuration Release

# Buscar en logs:
# ✅ "RCTFabricEnabled = YES"
# ✅ "New architecture is enabled"
```

---

## 📊 COMANDOS ÚTILES

### Limpiar Cache

```bash
# Limpiar todo
npx expo start --clear

# Limpiar Metro cache
npx react-native start --reset-cache

# Limpiar build Android
cd android && ./gradlew clean && cd ..

# Limpiar pods iOS
cd ios && pod deintegrate && pod install && cd ..
```

### Builds EAS

```bash
# Development (internal testing)
eas build --profile development --platform android

# Preview (stakeholders)
eas build --profile preview --platform all

# Production (stores)
eas build --profile production --platform all

# Local build (más rápido)
eas build --profile development --platform android --local
```

### OTA Updates

```bash
# Publicar update sin rebuild
eas update --branch development --message "Bug fixes"

# Ver updates publicados
eas update:list

# Rollback si algo sale mal
eas update:rollback
```

---

## ⚠️ TROUBLESHOOTING

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

### "New Architecture not enabled"

Verifica `app.json`:
```json
{
  "expo": {
    "newArchEnabled": true,
    "ios": { "newArchEnabled": true },
    "android": { "newArchEnabled": true },
    "plugins": [
      ["expo-build-properties", {
        "android": { "newArchEnabled": true },
        "ios": { "newArchEnabled": true }
      }]
    ]
  }
}
```

Luego:
```bash
npx expo prebuild --clean
```

---

## 🎯 CHECKLIST FINAL

Antes de considerar el proyecto production-ready:

- [ ] ✅ Dependencias instaladas (`npm install`)
- [ ] ✅ New Architecture verificada (logs de build)
- [ ] ✅ Tokens migrados a SecureStore
- [ ] ✅ Network detection implementado
- [ ] ✅ Backend URL configurada correctamente
- [ ] ✅ API keys configuradas (Google Maps, etc.)
- [ ] ✅ Permisos configurados (location, camera, etc.)
- [ ] ✅ Images reemplazadas por expo-image
- [ ] ✅ Accesibilidad completa (todos los componentes)
- [ ] ✅ Tests pasando (>80% coverage)
- [ ] ✅ Error boundaries implementados
- [ ] ✅ Dark mode (opcional)
- [ ] ✅ Build exitoso en EAS
- [ ] ✅ Testing en dispositivos reales (iOS + Android)

---

## 📚 RECURSOS

- [Documentación completa](./AUDIT_REPORT_2026.md)
- [React Native 0.84 Docs](https://reactnative.dev/docs/0.84/)
- [Expo SDK 55 Docs](https://docs.expo.dev/versions/v55.0.0/)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)

---

**¡Listo para desarrollar! 🚀**

Si tienes dudas, revisa `AUDIT_REPORT_2026.md` para detalles técnicos completos.
