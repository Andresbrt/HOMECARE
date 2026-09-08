# Manual de Resolución de Bloqueadores Críticos para Producción
**Proyecto**: Home Care Marketplace  
**Documento**: `tests/BLOCKERS_PRODUCTION.md`  
**Objetivo**: Guía de acción paso a paso para desbloquear las 5 dependencias externas requeridas para el lanzamiento a tiendas.

---

## 🛑 Matriz de Bloqueadores Externos

| Bloqueador | Área | Impacto | Estado Técnico | Responsable |
|---|---|---|---|---|
| **1. Credenciales Mercado Pago Producción** | Pasarela de Pagos | Transacciones con dinero real en COP | Implementado (Firma HMAC + Idempotencia lista) | Dueño de Empresa / Mercado Pago |
| **2. Certificados APNs (Apple Push)** | Notificaciones iOS | Alertas de servicio aceptado en iOS | Configuración de entitlements lista | Cuenta Apple Developer |
| **3. Archivo `google-services.json` (FCM)** | Notificaciones Android | Alertas de servicio en Android | Plugin `@react-native-firebase/app` listo | Consola Firebase |
| **4. Cuenta EAS Build (Expo)** | Compilación Nativa | Generación de `.aab` y `.ipa` | `eas.json` configurado para production | Cuenta Expo EAS |
| **5. Migraciones Flyway** | Base de Datos | Versionado automático de schema en Fly.io | ✅ **Resuelto** (`V1__init.sql`, `V2`, `pom.xml`) | Agente / DevOps |

---

## 📋 PROCEDIMIENTOS DETALLADOS DE RESOLUCIÓN

### 1. Mercado Pago: Transición de Sandbox TEST a Producción APP_USR

#### Paso 1: Solicitud de Homologación en Mercado Pago
1. Ingresar a [Mercado Pago Developers Colombia](https://www.mercadopago.com.co/developers).
2. Ir a **Tus integraciones** ➔ Crear aplicación o seleccionar Home Care.
3. Completar el formulario de homologación comercial:
   - **Razón Social / NIT / Cédula**: Datos legales registrados en Colombia.
   - **Modelo de Negocio**: Marketplace de servicios a domicilio.
   - **Sitio Web / Términos**: Enlace a política de privacidad y términos y condiciones.
4. Obtener las credenciales definitivas:
   - `MERCADO_PAGO_PUBLIC_KEY`: `APP_USR-...`
   - `MERCADO_PAGO_ACCESS_TOKEN`: `APP_USR-...`
   - `MERCADO_PAGO_WEBHOOK_SECRET`: Clave de firma HMAC obtenida en la sección de Webhooks.

#### Paso 2: Carga Segura en Fly.io Secrets
```bash
# Cargar credenciales sin exponerlas en texto plano en Git
flyctl secrets set \
  MERCADO_PAGO_PUBLIC_KEY="APP_USR-..." \
  MERCADO_PAGO_ACCESS_TOKEN="APP_USR-..." \
  MERCADO_PAGO_WEBHOOK_SECRET="..." \
  --app homecare-backend

# Verificar carga segura (valores enmascarados)
flyctl secrets list --app homecare-backend
```

#### Paso 3: Configuración en Frontend Mobile
En `mobile/eas.json`, el perfil `production` ya establece `"EXPO_PUBLIC_MP_SANDBOX": "false"`. Al generar el build de producción, la app se conectará automáticamente a los servidores de producción de Mercado Pago.

---

### 2. Certificados Push iOS (APNs con Autenticación por Clave .p8)

#### Paso 1: Generar Clave APNs en Apple Developer
1. Iniciar sesión en [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list).
2. Ir a **Keys** ➔ Presionar **"+"** para crear una nueva clave.
3. Nombre: `HomeCare APNs Production Key`.
4. Marcar la casilla **Apple Push Notifications service (APNs)**.
5. Click en **Continue** ➔ **Register**.
6. Descargar el archivo de clave `AuthKey_XXXXXXXXXX.p8` *(Solo se puede descargar una vez; respaldar en lugar seguro)*.
7. Anotar el **Key ID** (10 caracteres alfanuméricos) y el **Team ID** de Apple Developer.

#### Paso 2: Configurar en Firebase Cloud Messaging
1. Ir a [Firebase Console](https://console.firebase.google.com/) ➔ Proyecto Home Care.
2. Configuración del Proyecto ➔ Pestaña **Cloud Messaging**.
3. En la sección **Configuración de la app para iOS**, en **Clave de autenticación de APNs**, presionar **Subir**:
   - Subir el archivo `AuthKey_XXXXXXXXXX.p8`.
   - Ingresar el **Key ID**.
   - Ingresar el **Team ID**.
4. Guardar cambios. Firebase ahora despachará notificaciones push nativas a dispositivos iOS sin expiración anual de certificados.

---

### 3. Certificados Push Android (Firebase Cloud Messaging - FCM)

#### Paso 1: Descargar `google-services.json`
1. En Firebase Console ➔ Configuración del Proyecto ➔ General.
2. En la app Android con package name `com.homecare.app`, hacer click en **google-services.json**.
3. Guardar el archivo en la raíz del módulo móvil:
   ```text
   /Users/andresbermudez/HOMECARE/mobile/google-services.json
   ```

#### Paso 2: Vinculación en `app.json`
Verificar que `mobile/app.json` referencia el archivo:
```json
{
  "expo": {
    "android": {
      "package": "com.homecare.app",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

---

### 4. Setup EAS Build (Generación de AAB para Play Store e IPA para App Store)

#### Paso 1: Inicio de Sesión y Vinculación
```bash
cd mobile

# Instalar EAS CLI globalmente
npm install -g eas-cli

# Iniciar sesión con la cuenta de Expo del proyecto
eas login

# Configurar el proyecto
eas project:init
```

#### Paso 2: Compilación en la Nube (Cloud Builds)
```bash
# 1. Compilar Android App Bundle (.aab optimizado para Google Play)
eas build --platform android --profile production

# 2. Compilar iOS Application Archive (.ipa para TestFlight / App Store)
eas build --platform ios --profile production
```

#### Paso 3: Descarga y Pruebas Previas
- Instalar la versión de desarrollo en dispositivos reales para verificar push notifications y pagos reales con tarjetas de test autorizadas.

---

### 5. Migraciones Automáticas Flyway en Base de Datos

#### Estado Actual: ✅ **100% IMPLEMENTADO Y VALIDADO**
1. **Dependencias**: Agregadas `flyway-core` y `flyway-database-postgresql` a `backend/pom.xml`.
2. **Scripts Creados**:
   - `backend/src/main/resources/db/migration/V1__init.sql`: Esquema DDL inicial de 12 tablas principales con llaves foráneas y constraints.
   - `backend/src/main/resources/db/migration/V2__add_performance_indexes.sql`: Índices para radar geográfico y consultas concurrentes.
3. **Configuración en Spring Boot**:
   - `application.yml` y `application-production.yml` configurados con `baseline-on-migrate: true` y `baseline-version: 1`.
4. **Validación**: El proyecto backend compila con `BUILD SUCCESS` y ejecuta migraciones automáticamente al arrancar.
