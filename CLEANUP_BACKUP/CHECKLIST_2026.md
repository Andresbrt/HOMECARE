# ✅ CHECKLIST POST-ACTUALIZACIÓN - HomeCare Frontend

**Proyecto:** HomeCare Mobile App  
**Actualización:** Expo SDK 55, React Native 0.84.3, React 19.2  
**Fecha:** Marzo 2026  
**Modo:** New Architecture Habilitada  

---

## 📋 FASE 1: INSTALACIÓN Y SETUP (CRÍTICO)

### 1. Limpiar Proyecto

```bash
cd "c:\Users\PC\Desktop\HOME CARE\frontend"

# Borrar node_modules y caches
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# Limpiar builds nativos (si existen)
Remove-Item -Recurse -Force android\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\.gradle -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ios\Pods -ErrorAction SilentlyContinue
Remove-Item -Force ios\Podfile.lock -ErrorAction SilentlyContinue
```

- [ ] ✅ Limpieza completada

### 2. Instalar Dependencias Actualizadas

```bash
# Instalar todas las nuevas dependencias
npm install

# Si hay warnings de peer dependencies, usar:
# npm install --legacy-peer-deps
```

- [ ] ✅ `npm install` completado sin errores críticos
- [ ] ⚠️ Si hay peer dependency warnings, anotar aquí: ___________________

### 3. Generar Archivos Nativos con New Architecture

```bash
# Esto genera android/ e ios/ con New Architecture habilitada
npx expo prebuild --clean
```

**IMPORTANTE:** Este comando creará/actualizará:
- `android/gradle.properties` con `newArchEnabled=true`
- `ios/Podfile` con Fabric habilitado
- Configuración nativa completa

- [ ] ✅ `npx expo prebuild --clean` completado
- [ ] ✅ Carpeta `android/` generada
- [ ] ✅ Carpeta `ios/` generada (solo Mac)

### 4. Verificar New Architecture

```bash
# Verificar que New Architecture está habilitada
node scripts/verify-new-arch.js
```

Si no funciona el script, verificar manualmente:

```bash
# Android
Get-Content android\gradle.properties | Select-String "newArchEnabled"
# Debe mostrar: newArchEnabled=true

# iOS (Mac only)
Get-Content ios\Podfile | Select-String "new_arch_enabled"
# Debe mostrar: new_arch_enabled => true
```

- [ ] ✅ New Architecture verificada en Android
- [ ] ✅ New Architecture verificada en iOS (Mac only)

### 5. Instalar Pods (iOS - Solo Mac)

```bash
cd ios
pod install
cd ..
```

- [ ] ✅ Pods instalados (Mac) o N/A (Windows)

---

## 📋 FASE 2: CONFIGURACIÓN DEL PROYECTO

### 6. Configurar Backend URL

Editar `src/config/apiConfig.js`:

```javascript
// 1. Obtener tu IP local (Windows)
// Ejecutar en CMD: ipconfig
// Buscar "Dirección IPv4" → Ejemplo: 192.168.1.100

// 2. Actualizar DEV_BASE_URL
const DEV_BASE_URL = 'http://TU_IP_AQUI:8080/api';
// Ejemplo: 'http://192.168.1.100:8080/api'
```

- [ ] ✅ IP local obtenida: ___________________
- [ ] ✅ `apiConfig.js` actualizado con IP correcta

### 7. Integrar NetworkContext

Editar `App.js` para agregar NetworkProvider:

```javascript
import { NetworkProvider } from './src/context/NetworkContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NetworkProvider showAlerts={true}>  {/* <-- AGREGAR */}
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

- [ ] ✅ NetworkProvider integrado en `App.js`

### 8. Integrar ErrorBoundary

Editar `App.js` para agregar ErrorBoundary:

```javascript
import ErrorBoundary from './src/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>  {/* <-- AGREGAR */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* ... resto del código */}
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
```

- [ ] ✅ ErrorBoundary integrado en `App.js`

---

## 📋 FASE 3: MIGRACIÓN DE SEGURIDAD (CRÍTICO)

### 9. Migrar Tokens a SecureStore

Buscar en TODO el proyecto usos de `AsyncStorage` para tokens:

```bash
# Buscar archivos que usan AsyncStorage para tokens
Get-ChildItem -Recurse -Filter "*.js" | Select-String -Pattern "AsyncStorage.*token" -CaseSensitive
```

Reemplazar en cada archivo:

```javascript
// ❌ ANTES
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('@homecare_access_token', token);
const token = await AsyncStorage.getItem('@homecare_access_token');

// ✅ DESPUÉS
import { tokenManager } from './config/secureStorage';
await tokenManager.setAccessToken(token);
const token = await tokenManager.getAccessToken();
```

**Archivos a revisar:**
- [ ] ✅ `src/config/apiConfig.js`
- [ ] ✅ `src/context/AuthContext.js`
- [ ] ✅ `src/services/authService.js`
- [ ] ✅ Otros (listar): ___________________

### 10. Actualizar apiClient con SecureStore

Editar `src/config/apiConfig.js` o `src/services/apiClient.js`:

```javascript
import { tokenManager } from './secureStorage';  // Si está en config/
// import { tokenManager } from '../config/secureStorage';  // Si está en services/

// En interceptor de request
apiClient.interceptors.request.use(async (config) => {
  const token = await tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

- [ ] ✅ `apiClient` actualizado con `tokenManager`

---

## 📋 FASE 4: OPTIMIZACIÓN DE IMÁGENES

### 11. Reemplazar Image por expo-image

Buscar todos los usos de `react-native` Image:

```bash
Get-ChildItem -Recurse -Filter "*.js" | Select-String -Pattern "from 'react-native'" | Select-String -Pattern "Image"
```

Reemplazar en cada archivo:

```javascript
// ❌ ANTES
import { View, Text, Image } from 'react-native';
<Image source={{ uri: url }} style={styles.image} resizeMode="cover" />

// ✅ DESPUÉS
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
<Image 
  source={{ uri: url }} 
  style={styles.image} 
  contentFit="cover"
  cachePolicy="memory-disk"
  transition={200}
/>
```

**Archivos comunes:**
- [ ] ⏳ `src/screens/client/ClientHomeScreen.js` (usar versión optimizada)
- [ ] ⏳ `src/screens/provider/ProviderHomeScreen.js`
- [ ] ⏳ `src/components/Card.js`
- [ ] ⏳ Otros (listar): ___________________

---

## 📋 FASE 5: TESTING INICIAL

### 12. Test en Modo Desarrollo

```bash
# Iniciar Metro bundler
npx expo start --dev-client --clear
```

- [ ] ✅ Metro inicia sin errores
- [ ] ✅ QR code visible (para Expo Go, si aplica)

### 13. Build y Run en Android

```bash
# Build y ejecutar en Android
npx expo run:android
```

**Verificar en logs:**
- Buscar: `New architecture enabled: true`
- Buscar: `Fabric enabled`
- Buscar: `Hermes enabled`

- [ ] ✅ App compila sin errores
- [ ] ✅ App se instala en dispositivo/emulador
- [ ] ✅ App abre correctamente
- [ ] ✅ New Architecture confirmada en logs

### 14. Test Funcionalidad Básica

Probar en dispositivo/emulador:

- [ ] ✅ Splash screen se muestra
- [ ] ✅ Login screen carga
- [ ] ✅ Login funciona (si backend disponible)
- [ ] ✅ Navegación entre pantallas funciona
- [ ] ✅ Network detection funciona (activar/desactivar WiFi)
- [ ] ✅ Imágenes cargan correctamente
- [ ] ✅ Sin crashes al usar la app

### 15. Test de Performance

- [ ] ✅ UI fluida (60fps en scroll)
- [ ] ✅ Startup time < 3 segundos
- [ ] ✅ Sin memory leaks evidentes

---

## 📋 FASE 6: ACCESIBILIDAD (MEDIA PRIORIDAD)

### 16. Completar Accesibilidad en Componentes

Archivos que necesitan accesibilidad:

- [ ] ⏳ `src/components/Card.js`
- [ ] ⏳ `src/components/Header.js`
- [ ] ⏳ `src/components/NavHeader.js`
- [ ] ⏳ `src/components/common/Icon.js`

Agregar a cada componente touchable:

```javascript
<Pressable
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Descripción del elemento"
  accessibilityHint="Lo que pasa al tocar"
  onPress={handlePress}
>
  {/* contenido */}
</Pressable>
```

### 17. Probar con TalkBack/VoiceOver

**Android - TalkBack:**
```
Settings > Accessibility > TalkBack > ON
Volume Up + Volume Down para activar/desactivar
```

**iOS - VoiceOver (Mac):**
```
Settings > Accessibility > VoiceOver > ON
Triple-click botón lateral para activar/desactivar
```

- [ ] ⏳ Probado con TalkBack (Android)
- [ ] ⏳ Probado con VoiceOver (iOS)
- [ ] ⏳ Todos los elementos importantes son anunciados

---

## 📋 FASE 7: EAS BUILD SETUP (PARA DISTRIBUCIÓN)

### 18. Configurar EAS CLI

```bash
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Verificar instalación
eas --version
# Debe mostrar >= 13.2.0

# Login
eas login
```

- [ ] ⏳ EAS CLI instalado
- [ ] ⏳ Login completado

### 19. Primer Build con EAS

```bash
# Build de desarrollo para testing interno
eas build --profile development --platform android
```

**NOTA:** Este proceso toma 10-15 minutos.

- [ ] ⏳ Build completado en EAS
- [ ] ⏳ APK descargado e instalado
- [ ] ⏳ App funciona desde build de EAS

---

## 📋 FASE 8: TESTING AVANZADO (OPCIONAL)

### 20. Unit Tests

```bash
npm test
```

- [ ] ⏳ Tests pasan sin errores
- [ ] ⏳ Coverage > 80%

### 21. E2E Tests (Detox)

```bash
npm run build:e2e:android
npm run test:e2e:android
```

- [ ] ⏳ E2E tests pasan

---

## 📋 FASE 9: OPTIMIZACIONES ADICIONALES (OPCIONAL)

### 22. Migrar a Expo Router v4 (Opcional)

Si quieres usar file-based routing en lugar de React Navigation.

- [ ] ⏳ Considerado/Investigado
- [ ] ⏳ Migración planificada para: ___________________

### 23. Dark Mode

Implementar soporte completo para modo oscuro.

- [ ] ⏳ ThemeProvider implementado
- [ ] ⏳ Todos los componentes soportan dark mode

### 24. Analytics y Monitoring

- [ ] ⏳ Firebase Analytics integrado
- [ ] ⏳ Sentry/Bugsnag para crash reporting

---

## 📋 PROBLEMAS COMUNES

### ❌ Error: "Unable to resolve module"

**Solución:**
```bash
npm install
npx expo start --clear
```

### ❌ Error: "New Architecture not enabled"

**Solución:**
```bash
npx expo prebuild --clean
```

Verificar en `app.json` que `newArchEnabled: true` esté presente.

### ❌ Error: "Build failed: duplicate class"

**Solución:**
```bash
cd android
./gradlew clean
cd ..
npx expo prebuild --clean
```

### ❌ Error: "Pod install failed" (iOS)

**Solución:**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### ❌ Error: "Cannot connect to backend"

**Verificar:**
1. Backend está corriendo en `http://localhost:8080`
2. IP en `apiConfig.js` es correcta
3. Dispositivo y PC están en la misma red WiFi
4. Firewall no bloquea conexión

---

## 🎯 CHECKLIST RESUMEN

### Crítico (DEBE completarse antes de desarrollo)
- [ ] ✅ npm install
- [ ] ✅ npx expo prebuild --clean
- [ ] ✅ New Architecture verificada
- [ ] ✅ Backend URL configurada
- [ ] ✅ Tokens migrados a SecureStore
- [ ] ✅ NetworkContext integrado
- [ ] ✅ ErrorBoundary integrado
- [ ] ✅ App funciona en dispositivo/emulador

### Alta Prioridad (Próximos días)
- [ ] ⏳ expo-image implementado
- [ ] ⏳ Accesibilidad completada
- [ ] ⏳ Tests unitarios > 80%
- [ ] ⏳ EAS Build exitoso

### Media Prioridad (Próximas semanas)
- [ ] ⏳ Dark mode
- [ ] ⏳ Analytics
- [ ] ⏳ E2E tests

### Baja Prioridad (Futuro)
- [ ] ⏳ Expo Router v4
- [ ] ⏳ CI/CD automation

---

## 📞 SOPORTE

Si encuentras problemas:

1. **Revisar documentación:**
   - [AUDIT_REPORT_2026.md](../AUDIT_REPORT_2026.md) - Auditoría completa
   - [QUICK_START_2026.md](../QUICK_START_2026.md) - Guía rápida
   - [README_2026.md](README_2026.md) - Documentación principal

2. **Verificar logs:**
   ```bash
   # Android
   npx react-native log-android
   
   # iOS
   npx react-native log-ios
   ```

3. **Limpiar y reintentar:**
   ```bash
   npm install
   npx expo start --clear
   ```

4. **Buscar en documentación oficial:**
   - [Expo Docs](https://docs.expo.dev/)
   - [React Native Docs](https://reactnative.dev/)

---

**✅ ¡Éxito en tu desarrollo con las tecnologías más modernas de marzo 2026!**
