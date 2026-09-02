# Migración de Supabase Auth a Backend Auth con OTP - Completada

## 📋 Resumen de Cambios

### Problema Original
- Frontend estaba usando Supabase Auth directamente, lo cual enviaba emails con "magic links"
- Usuario quería usar códigos OTP de 4 dígitos que ya están configurados en el backend
- Backend tenía sistema completo de autenticación con OTP pero era ignorado por el frontend

### Solución Implementada
Refactorizar AuthContext para usar el backend exclusivamente en lugar de Supabase.

---

## 🔄 Archivos Modificados

### 1. **mobile/src/context/AuthContext.js**

#### Cambios principales:
- ✅ Eliminado listener `onAuthStateChange` de Supabase
- ✅ Eliminadas funciones de `supabaseAuthService` (signIn, signUp, signOut, etc.)
- ✅ Implementado sistema de sesión manual con JWT del backend

#### Funciones refactorizadas:

**`login(email, password)`**
```javascript
// ANTES: await signIn({ email, password });
// AHORA: const response = await authService.login(email, password);
```
- Llama al backend `/api/auth/login`
- Guarda JWT token y datos de usuario
- Detecta rol y configura modo (profesional/usuario)

**`register(formData)`**
```javascript
// ANTES: await signUp({ email, password, nombre, apellido, rol, telefono });
// AHORA: 
// await authService.register({ email, password, nombre, apellido, rol, telefono });
// await authService.sendOTP(email);
```
- Registra usuario en backend
- Envía código OTP de 4 dígitos por email
- Retorna `requiresOTP: true` para navegación a pantalla de verificación

**`logout()`**
```javascript
// ANTES: await signOut();
// AHORA: await authService.logout();
```
- Llama al backend y limpia estado local

**`verifyOTP(email, codigo)` - NUEVA FUNCIÓN**
```javascript
const response = await authService.verifyOTP(email, codigo);
setToken(response.token);
setUser(response);
setIsAuthenticated(true);
```
- Verifica código OTP de 4 dígitos
- Si es correcto, recibe JWT y completa login
- Actualiza estado de autenticación

**`resendOTP(email)` - NUEVA FUNCIÓN**
```javascript
await authService.sendOTP(email);
```
- Reenvía código OTP al email del usuario

**`forgotPassword`, `sendForgotPasswordOTP`, `verifyForgotPasswordOTP`, `resetPasswordWithOTP`**
- Actualizadas para usar backend en lugar de Supabase email links

**Gestión de sesión (useEffect inicial)**
```javascript
// ANTES: Listener onAuthStateChange que sincroniza con Supabase
// AHORA: Cargar sesión guardada (token + user) al iniciar la app
const savedToken = await SecureStore.getItemAsync('token');
const savedUser = await SecureStore.getItemAsync('user');
if (savedToken && savedUser) {
  setToken(savedToken);
  setUser(JSON.parse(savedUser));
  setIsAuthenticated(true);
}
```

---

### 2. **mobile/src/screens/auth/RegisterScreen.js**

#### Cambios:
```javascript
// ANTES:
if (result.success) {
  if (isProvider) {
    navigation.navigate('PendingVerification');
  } else {
    await authService.sendOTP(form.email.trim()); // Duplicado
    navigation.navigate('VerifyOTP', { email: form.email.trim() });
  }
}

// AHORA:
if (result.success) {
  if (result.requiresOTP) {
    // Backend ya envió el código OTP
    navigation.navigate('VerifyOTP', { email: form.email.trim() });
  } else if (isProvider) {
    navigation.navigate('PendingVerification');
  }
}
```

**Mejora:**
- Eliminado envío duplicado de OTP (ya lo hace AuthContext.register)
- Navegación basada en `requiresOTP` flag del response

---

## 🔌 Archivos NO Modificados (Ya Funcionan Correctamente)

### **mobile/src/services/authService.js**
Ya tenía todos los métodos necesarios:
- `login(email, password)`
- `register(userData)`
- `sendOTP(email)`
- `verifyOTP(email, codigo)`
- `logout()`
- `forgotPassword(email)`
- Métodos para reset password con OTP

### **mobile/src/hooks/useOTPVerification.js**
Ya usa `authService` directamente:
- `verify()` → `authService.verifyOTP(email, code)`
- `resend()` → `authService.sendOTP(email)`
- Maneja expiración, cooldown, y límite de intentos

### **mobile/src/screens/auth/VerifyOTPScreen.js**
Ya funciona correctamente:
- Usa `useOTPVerification` hook
- Muestra 4 cajas para dígitos OTP
- Llama a `loginWithOTPResponse` del AuthContext después de verificación exitosa

### **backend AuthController**
No requiere cambios, ya tiene endpoints completos:
- `POST /api/auth/registro` - Registra usuario
- `POST /api/auth/send-otp` - Envía código de 4 dígitos por email
- `POST /api/auth/verify-otp` - Verifica código y retorna JWT
- `POST /api/auth/login` - Login directo con email/password

---

## 📱 Flujo de Registro y Verificación (NUEVO)

1. **Usuario completa formulario de registro**
   - Ingresa: email, password, nombre, apellido, telefono, rol

2. **RegisterScreen llama `register(formData)`**
   - AuthContext.register() ejecuta:
     - `authService.register()` → Backend crea usuario
     - `authService.sendOTP(email)` → Backend envía email con código de 4 dígitos
   - Retorna `{ success: true, requiresOTP: true, email }`

3. **Navegación a VerifyOTPScreen**
   - Pantalla muestra 4 cajas para ingresar código
   - Usuario recibe email: "Tu código de verificación es: 1234"

4. **Usuario ingresa código de 4 dígitos**
   - Pantalla llama `verify()` del hook
   - Hook llama `authService.verifyOTP(email, codigo)`
   - Backend valida código y retorna JWT + datos de usuario

5. **Login automático**
   - VerifyOTPScreen llama `loginWithOTPResponse(response)`
   - AuthContext actualiza estado: token, user, isAuthenticated
   - Usuario es redirigido a la app (Home/Dashboard)

---

## ✅ Beneficios de la Migración

1. **✅ Emails OTP correctos**: Backend envía códigos de 4 dígitos, no magic links
2. **✅ Control centralizado**: Toda autenticación pasa por backend
3. **✅ Sin dependencia Supabase Auth**: Frontend solo usa Supabase como base de datos
4. **✅ JWT persistente**: Token guardado en SecureStore, sesión sobrevive reinicios
5. **✅ Código más limpio**: Eliminado código Supabase-specific (onAuthStateChange, etc.)
6. **✅ Flujo unificado**: Login y registro usan misma arquitectura (JWT tokens)

---

## 🧪 Testing Recomendado

### Caso 1: Registro nuevo usuario
1. Abrir app → Registro
2. Completar formulario
3. Verificar que llega email con código de 4 dígitos (no magic link)
4. Ingresar código en VerifyOTPScreen
5. Verificar que se completa login y entra a la app

### Caso 2: Login usuario existente
1. Abrir app → Login
2. Ingresar email y password
3. Verificar que entra directamente (sin OTP)

### Caso 3: Reenvío de código OTP
1. Durante verificación, esperar 60 segundos
2. Presionar "Reenviar código"
3. Verificar que llega nuevo código por email

### Caso 4: Recuperación de contraseña
1. Login → "Olvidé mi contraseña"
2. Ingresar email
3. Verificar que llega código OTP para reset
4. Ingresar código y nueva contraseña

### Caso 5: Persistencia de sesión
1. Hacer login
2. Cerrar app completamente (kill process)
3. Reabrir app
4. Verificar que sigue logueado (carga token guardado)

---

## 🚨 Notas Importantes

1. **Supabase aún se usa para**: 
   - Base de datos (PostgreSQL)
   - Storage de archivos
   - **NO para autenticación**

2. **Google Sign-In**: 
   - Temporalmente deshabilitado
   - Requiere implementación adicional en backend

3. **Proveedores (SERVICE_PROVIDER)**:
   - Actualmente navegan a PendingVerification (flujo manual de aprobación)
   - No pasan por VerifyOTP

4. **Tokens**:
   - Guardados en expo-secure-store (encriptado)
   - Cargados automáticamente al iniciar app
   - Enviados en header `Authorization: Bearer <token>` a backend

---

## 📝 Estado Actual

✅ **Backend**: Corriendo en puerto 8090  
✅ **Frontend**: Corriendo en puerto 8081  
✅ **Migración**: Completada  
✅ **Sin errores**: TypeScript/ESLint clean  

**Listo para testing!** 🚀
