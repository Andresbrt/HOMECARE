# 🔍 Reporte de Errores y Advertencias - HomeCare

**Fecha:** 20 de abril de 2026  
**Estado del Sistema:** ✅ Backend funcionando | ⚠️ Frontend con advertencias

---

## 📋 Índice

1. [Problema de Encoding (Caracteres Extraños)](#1-problema-de-encoding-caracteres-extraños)
2. [Errores del Backend](#2-errores-del-backend)
3. [Errores del Frontend](#3-errores-del-frontend)
4. [Nombre del Proyecto](#4-nombre-del-proyecto)
5. [Soluciones Recomendadas](#5-soluciones-recomendadas)

---

## 1. Problema de Encoding (Caracteres Extraños)

### 🐛 **Síntoma**
En los logs del backend aparecen caracteres extraños en lugar de emojis:

```
ƒöì Validando configuraci├│n de variables de entorno...
Ô£à Validaci├│n de variables de entorno completada
ƒÜÇ Entorno: development | JWT: Ô£ô | Google Maps: Ô£ô | Firebase: Ô£ô | Wompi: Ô£ô
```

**Debería verse así:**
```
🔍 Validando configuración de variables de entorno...
✅ Validación de variables de entorno completada
🚀 Entorno: development | JWT: ✓ | Google Maps: ✓ | Firebase: ✓ | Wompi: ✓
```

### 🔍 **Causa**
PowerShell en Windows no está configurado para mostrar caracteres UTF-8 correctamente. El código Java está bien, el problema es la consola.

### ✅ **Solución**
El código funciona correctamente. Para ver los emojis bien en PowerShell:

```powershell
# Opción 1: Cambiar encoding temporalmente
chcp 65001

# Opción 2: Usar el nuevo Windows Terminal (recomendado)
# Descargar de Microsoft Store: "Windows Terminal"
```

### 📌 **Impacto**
- **Severidad:** 🟢 Baja (cosmético)
- **Funcionalidad:** No afecta el funcionamiento de la app
- **Estado del código:** ✅ Código correcto (problema de visualización)

---

## 2. Errores del Backend

### ⚠️ **Advertencias (WARN)**

#### 2.1. H2 Dialect Deprecation
```
WARN org.hibernate.orm.deprecation: HHH90000025: H2Dialect does not need to be specified explicitly
```

**Causa:** Hibernate detecta automáticamente el dialecto de H2.  
**Impacto:** 🟡 Bajo - Solo una advertencia  
**Solución:** Remover `hibernate.dialect` del run-local.cmd (línea 11)

```batch
REM Remover esta línea:
SET SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT=org.hibernate.dialect.H2Dialect
```

---

#### 2.2. Spring Data Redis Repository Warnings
```
WARN Spring Data Redis - Could not safely identify store assignment for repository candidate interface...
```

**Causa:** Spring Data Redis intenta registrar todos los repositories como Redis repositories.  
**Impacto:** 🟢 Muy bajo - Son solo advertencias informativas  
**Estado:** Normal en una app con JPA + Redis mixtos

---

#### 2.3. JPA Open-in-View Warning
```
WARN spring.jpa.open-in-view is enabled by default. Therefore, database queries may be performed during view rendering.
```

**Causa:** Configuración por defecto de Spring Boot.  
**Impacto:** 🟡 Medio - Puede causar lazy loading issues  
**Solución:** Agregar a `application.yml`:

```yaml
spring:
  jpa:
    open-in-view: false
```

---

#### 2.4. Commons Logging Conflict
```
Standard Commons Logging discovery in action with spring-jcl: please remove commons-logging.jar from classpath
```

**Causa:** Dependencia duplicada en el classpath.  
**Impacto:** 🟡 Bajo - Puede causar conflictos de logging  
**Solución:** Agregar exclusión en `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>commons-logging</groupId>
            <artifactId>commons-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

---

### ✅ **Estado General del Backend**

- ✅ Backend iniciado correctamente
- ✅ Tomcat en puerto 8090
- ✅ H2 database conectada
- ✅ HikariCP funcionando
- ✅ Firebase inicializado
- ✅ Mercado Pago configurado
- ✅ WebSocket broker activo
- ✅ Endpoints funcionando

**Conclusión:** Las advertencias son normales y no impiden el funcionamiento.

---

## 3. Errores del Frontend

### 🔴 **Errores Críticos**

#### 3.1. expo-notifications en Expo Go
```
ERROR expo-notifications: Android Push notifications (remote notifications) functionality 
provided by expo-notifications was removed from Expo Go with the release of SDK 53. 
Use a development build instead of Expo Go.
```

**Causa:** Expo Go ya no soporta notificaciones push nativas.  
**Impacto:** 🔴 Alto - Las notificaciones push NO funcionarán en Expo Go  
**Solución:**

**Opción 1 (Desarrollo rápido):** Comentar el código de notificaciones para pruebas:
```javascript
// Comentar imports y uso de expo-notifications en desarrollo
```

**Opción 2 (Producción):** Crear un development build:
```bash
npm install -g eas-cli
eas build --profile development --platform android
```

---

#### 3.2. Google Auth sin Client ID
```
ERROR [Error: Client Id property `androidClientId` must be defined to use Google auth on this platform.]
```

**Causa:** Falta configurar `androidClientId` en `app.json`.  
**Impacto:** 🔴 Alto - Google Sign-In no funciona en Android  
**Solución:**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Habilita Google Sign-In API
3. Crea un OAuth Client ID para Android
4. Agrega a `app.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "config": {
        "googleSignIn": {
          "apiKey": "YOUR_ANDROID_API_KEY",
          "certificateHash": "YOUR_SHA1_HASH"
        }
      }
    },
    "extra": {
      "androidClientId": "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com"
    }
  }
}
```

---

### ⚠️ **Advertencias**

#### 3.3. Paquetes Desactualizados
```
expo-image-manipulator@13.0.6 - expected version: ~14.0.8
react-native-webview@13.16.1 - expected version: 13.15.0
```

**Impacto:** 🟡 Medio - Puede causar incompatibilidades  
**Solución:**

```bash
cd mobile
npx expo install expo-image-manipulator@~14.0.8
npx expo install react-native-webview@13.15.0
```

---

#### 3.4. SafeAreaView Deprecated
```
WARN SafeAreaView has been deprecated and will be removed in a future release. 
Please use 'react-native-safe-area-context' instead.
```

**Impacto:** 🟡 Medio - Dejará de funcionar en futuras versiones  
**Solución:** Reemplazar `SafeAreaView` de React Native por el de `react-native-safe-area-context`:

```javascript
// Antes
import { SafeAreaView } from 'react-native';

// Después
import { SafeAreaView } from 'react-native-safe-area-context';
```

---

#### 3.5. Notificaciones sin cuenta Expo
```
WARN `expo-notifications` functionality is not fully supported in Expo Go
ERROR Fetching the token failed: SERVICE_NOT_AVAILABLE
```

**Impacto:** 🟡 Medio - Notificaciones no funcionan en desarrollo  
**Solución:** Para desarrollo, usa un development build o mock las notificaciones.

---

### ✅ **Estado General del Frontend**

- ✅ Metro Bundler iniciado
- ✅ Servidor en `http://localhost:8081`
- ✅ QR Code generado para Expo Go
- ✅ Android bundle completado (45 segundos)
- ⚠️ Notificaciones push no funcionan (limitación de Expo Go)
- ⚠️ Google Sign-In sin configurar

**Conclusión:** La app funciona pero sin notificaciones ni Google login en Expo Go.

---

## 4. Nombre del Proyecto

### 🔍 **Estado Actual**

#### ✅ **Frontend (Correcto)**
En `mobile/app.json`:
```json
{
  "expo": {
    "name": "Homecare Colorimetría",
    "slug": "homecare"
  }
}
```

**Estado:** ✅ **Correcto** - El nombre completo está bien configurado.

---

#### ⚠️ **Backend (Incompleto)**
En `backend/pom.xml`:
```xml
<name>HOMECARE Backend API</name>
<description>Plataforma de servicios de limpieza - Modelo inDriver</description>
```

**Estado:** ⚠️ **Falta "Colorimetría"** en el nombre

---

#### 📝 **README.md**
En `backend/README.md`:
```markdown
# 🏠 HomeCare API - Backend
API RESTful para plataforma de servicios del hogar
```

**Estado:** ⚠️ **Falta "Colorimetría"**

---

### ✅ **Solución**

#### Actualizar `pom.xml`:
```xml
<name>HOMECARE Colorimetría - Backend API</name>
<description>Plataforma de servicios de colorimetría y limpieza del hogar - Modelo inDriver</description>
```

#### Actualizar `README.md`:
```markdown
# 🏠 HomeCare Colorimetría - Backend API
API RESTful para plataforma de servicios de colorimetría y limpieza del hogar
```

#### Actualizar banner de inicio en `EnvironmentValidator.java`:
```java
║              🏠 HOMECARE COLORIMETRÍA API INICIADA      ║
```

---

## 5. Soluciones Recomendadas

### 🚨 **Prioridad Alta (Hacer ahora)**

#### ✅ **1. Actualizar nombre del proyecto**
```bash
# Actualizar pom.xml, README.md y EnvironmentValidator.java
```

#### ✅ **2. Actualizar paquetes desactualizados**
```bash
cd mobile
npx expo install expo-image-manipulator@~14.0.8
npx expo install react-native-webview@13.15.0
```

#### ✅ **3. Configurar Google Sign-In**
- Obtener `androidClientId` de Google Cloud Console
- Agregar a `app.json`

---

### 🟡 **Prioridad Media (Hacer pronto)**

#### ✅ **4. Deshabilitar JPA open-in-view**
Agregar a `application.yml`:
```yaml
spring:
  jpa:
    open-in-view: false
```

#### ✅ **5. Reemplazar SafeAreaView deprecated**
Buscar y reemplazar en todos los archivos `.js/.tsx`

#### ✅ **6. Crear development build para notificaciones**
Solo si necesitas notificaciones push en desarrollo.

---

### 🟢 **Prioridad Baja (Opcional)**

#### ✅ **7. Remover H2Dialect explícito**
En `run-local.cmd`, remover línea del dialecto.

#### ✅ **8. Excluir commons-logging**
Agregar exclusión en `pom.xml` para evitar warning.

#### ✅ **9. Configurar Windows Terminal**
Para ver emojis correctamente en logs.

---

## 📊 Resumen Ejecutivo

### Backend
- **Estado:** ✅ Funcionando correctamente
- **Errores críticos:** 0
- **Advertencias:** 4 (normales, no bloquean)
- **Acción requerida:** Actualizar nombre del proyecto

### Frontend
- **Estado:** ⚠️ Funcionando con limitaciones
- **Errores críticos:** 2 (notificaciones, Google auth)
- **Advertencias:** 3 (paquetes, SafeAreaView)
- **Acción requerida:** Actualizar paquetes, configurar Google auth

### Conclusión General
✅ **El proyecto NO está corrupto** - Todos los errores son normales y tienen solución.  
⚠️ **Acción principal:** Actualizar el nombre completo "HomeCare Colorimetría" en backend.  
🚀 **La app funciona** - Las limitaciones son esperadas en modo desarrollo con Expo Go.

---

## 🔧 Scripts de Solución Rápida

### Backend - Actualizar nombre
```bash
# Editar manualmente:
# - backend/pom.xml (línea 17)
# - backend/README.md (línea 1)
# - backend/src/main/java/com/homecare/config/EnvironmentValidator.java (línea 127)
```

### Frontend - Actualizar paquetes
```bash
cd mobile
npx expo install expo-image-manipulator@~14.0.8
npx expo install react-native-webview@13.15.0
npm install
```

### Frontend - Deshabilitar notificaciones temporalmente
```javascript
// En App.js o donde se registren notificaciones:
// Comentar temporalmente el código de expo-notifications
```

---

**¿Quieres que aplique alguna de estas soluciones automáticamente?**
