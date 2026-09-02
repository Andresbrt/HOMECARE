# Configuración de usuarios de prueba para DEV Login

## 🎯 Problema Resuelto

1. ✅ **Error "devLogin is not a function"** → Función `devLogin` agregada al AuthContext
2. ✅ **Caracteres raros (Ã³, Ã±, etc.)** → Todos los textos UTF-8 corregidos en LoginScreen

## 📱 Cambios Realizados

### AuthContext.js
- Agregada función `devLogin(role)` que permite login rápido con credenciales de prueba
- Exportada en el Provider para que esté disponible en toda la app

### LoginScreen.js
- Corregidos todos los caracteres UTF-8 mal codificados:
  - ✅ "Correo electrónico" (antes: "Correo electrÃ³nico")
  - ✅ "Contraseña" (antes: "ContraseÃ±a")
  - ✅ "¿Olvidaste tu contraseña?" (antes: "Â¿Olvidaste tu contraseÃ±a?")
  - ✅ "Iniciar sesión" (antes: "Iniciar sesiÃ³n")
  - ✅ "o continúa con" (antes: "o continÃºa con")
  - ✅ "¿No tienes cuenta? Regístrate" (antes: "Â¿No tienes cuenta? RegÃ­strate")
  - ✅ "⚡ DEV" (antes: "âš¡ DEV")
  - ✅ "👷 Profesional" (antes: "ðŸ'· Profesional")
  - ✅ "👤 Usuario" (antes: "ðŸ'¤ Usuario")
- Actualizado `handleQuickLogin` para ser asíncrono y manejar errores

## 🔧 Usuarios de Prueba Requeridos

Para que funcione el botón **"⚡ DEV"**, necesitas crear estos usuarios en el backend:

### 1. Usuario Profesional
```
Email: profesional@test.com
Password: test123
Rol: SERVICE_PROVIDER
```

### 2. Usuario Cliente
```
Email: usuario@test.com
Password: test123
Rol: CUSTOMER
```

## 🚀 Cómo Crear los Usuarios de Prueba

### Opción A: Usando Postman/Insomnia

**Endpoint:** `POST http://localhost:8090/api/auth/register`

**Body (Profesional):**
```json
{
  "nombre": "Test",
  "apellido": "Profesional",
  "email": "profesional@test.com",
  "password": "test123",
  "telefono": "+57300123456",
  "tipoDocumento": "CC",
  "numeroDocumento": "1000000001",
  "rol": "SERVICE_PROVIDER",
  "direccion": "Calle Test 123"
}
```

**Body (Usuario):**
```json
{
  "nombre": "Test",
  "apellido": "Usuario",
  "email": "usuario@test.com",
  "password": "test123",
  "telefono": "+57300789456",
  "tipoDocumento": "CC",
  "numeroDocumento": "1000000002",
  "rol": "CUSTOMER",
  "direccion": "Calle Test 456"
}
```

### Opción B: Directamente en la Base de Datos

Si usas H2 en desarrollo, puedes insertar directamente:

```sql
-- Nota: Asegúrate de encriptar las contraseñas con BCrypt
-- El hash para "test123" es: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO usuarios (email, password, nombre, apellido, rol, telefono, tipo_documento, numero_documento, direccion, email_verified, activo)
VALUES 
  ('profesional@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Test', 'Profesional', 'SERVICE_PROVIDER', '+57300123456', 'CC', '1000000001', 'Calle Test 123', true, true),
  ('usuario@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Test', 'Usuario', 'CUSTOMER', '+57300789456', 'CC', '1000000002', 'Calle Test 456', true, true);
```

### Opción C: Desde la App (Recomendado)

1. Abre la app en modo desarrollo
2. Haz clic en "Regístrate"
3. Crea manualmente los dos usuarios con los datos de arriba
4. Verifica los emails (o marca como verificados en la BD)

## ✅ Verificación

Una vez creados los usuarios, los botones DEV deberían funcionar:

1. **👷 Profesional** → Login automático como `profesional@test.com`
2. **👤 Usuario** → Login automático como `usuario@test.com`

## 🔒 Seguridad

⚠️ **IMPORTANTE:** La función `devLogin` **solo funciona en modo desarrollo** (`__DEV__ === true`). En producción está deshabilitada automáticamente.

## 📝 Notas

- Los botones DEV solo aparecen en la pantalla de login
- No requieren verificación de email
- Ideales para testing rápido durante desarrollo
- Evitan tener que escribir credenciales cada vez

## 🐛 Solución de Problemas

### Error: "Usuario no encontrado"
→ Los usuarios de prueba no están creados en el backend. Sigue los pasos de arriba.

### Error: "Contraseña incorrecta"
→ Verifica que la contraseña en BD esté encriptada con BCrypt correctamente.

### Error: "devLogin is not a function"
→ Actualiza el código desde el último commit (77409cf).

### Caracteres raros en la UI
→ Reinicia Metro Bundler con `npm start --reset-cache`.

---

✅ **Commit:** `77409cf - fix: agregar devLogin y corregir encoding UTF-8 en LoginScreen`
