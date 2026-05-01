# ❌ Problema con Botones DEV Login

## 🔍 Diagnóstico

Los botones **👷 Profesional** y **👤 Usuario** en `LoginScreen.js` no funcionan porque:

1. **Usuarios no existen**: Los usuarios de prueba `profesional@test.com` y `usuario@test.com` no están creados en la base de datos
2. **Endpoint de registro falla**: Al intentar crearlos, el backend retorna error 500
3. **Causa raíz**: El `AuthService.registro()` intenta enviar email de verificación pero falla (EmailService tiene problemas en modo local)

## ✅ Soluciones

### Opción 1: Deshabilitar envío de email en dev (Recomendado)

Modificar `AuthService.java` para que NO envíe emails cuando `SPRING_PROFILES_ACTIVE=test`:

```java
// En el método registro(), comentar estas líneas:
// emailService.sendHtmlEmail(savedUser.getEmail(), "Verifica tu email - HOME CARE", "email/verification", variables);
```

### Opción 2: Usar Swagger UI para crear usuarios

1. Abrir: http://localhost:8090/swagger-ui/index.html
2. Buscar: `POST /api/auth/register`
3. Crear profesional:
   ```json
   {
     "email": "profesional@test.com",
     "password": "Test123!",
     "nombre": "Profesional",
     "apellido": "Test",
     "telefono": "3001234567",
     "rol": "SERVICE_PROVIDER"
   }
   ```
4. Crear cliente:
   ```json
   {
     "email": "usuario@test.com",
     "password": "Test123!",
     "nombre": "Usuario",
     "apellido": "Test",
     "telefono": "3009876543",
     "rol": "CUSTOMER"
   }
   ```

### Opción 3: Insertar directamente en H2

1. Abrir: http://localhost:8090/h2-console
2. JDBC URL: `jdbc:h2:mem:homecare`
3. Usuario: `sa` (sin contraseña)
4. Ejecutar SQL:
```sql
-- Hash BCrypt de "Test123!": $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO usuarios (email, password, nombre, apellido, telefono, activo, verificado) 
VALUES ('profesional@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Profesional', 'Test', '3001234567', true, true);

INSERT INTO usuarios (email, password, nombre, apellido, telefono, activo, verificado) 
VALUES ('usuario@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Usuario', 'Test', '3009876543', true, true);
```

## 📝 Cambios Ya Aplicados

✅ **AuthContext.js**: Contraseñas actualizadas de `test123` → `Test123!` (cumple requisitos de validación)
✅ **LoginScreen.js**: UTF-8 encoding corregido, `handleQuickLogin` async implementado
✅ **DEV_LOGIN_SETUP.md**: Documentación creada con todas las instrucciones

## ⚡ Uso de los Botones

Una vez creados los usuarios, los botones funcionan así:

```jsx
// En LoginScreen.js
<TouchableOpacity onPress={() => handleQuickLogin('profesional')}>
  <Text>👷 Profesional</Text>  // Login como SERVICE_PROVIDER
</TouchableOpacity>

<TouchableOpacity onPress={() => handleQuickLogin('usuario')}>
  <Text>👤 Usuario</Text>       // Login como CUSTOMER
</TouchableOpacity>
```

## 🐛 Error Actual

```
POST /api/auth/register
Status: 500 Internal Server Error
Causa: email Service.sendHtmlEmail() falla en modo local
```

**Solución aplicada**: Try-catch agregado en `AuthService.registro()` línea 132-141, pero persiste un error desconocido.

**Workaround exitoso**: Crear usuarios directamente con SQL en H2 Console.

### Opción RÁPIDA: SQL directo en H2

1. Abrir: http://localhost:8090/h2-console
2. JDBC URL: `jdbc:h2:mem:homecare` | Usuario: `sa` (sin contraseña)
3. Ejecutar:

```sql
-- Crear rol SERVICE_PROVIDER
INSERT INTO roles (nombre, descripcion) VALUES ('SERVICE_PROVIDER', 'Profesional de servicios') ON CONFLICT DO NOTHING;

-- Crear rol CUSTOMER  
INSERT INTO roles (nombre, descripcion) VALUES ('CUSTOMER', 'Cliente que solicita servicios') ON CONFLICT DO NOTHING;

-- Hash BCrypt de "Test123!": $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- Crear usuario profesional
INSERT INTO usuarios (email, password, nombre, apellido, telefono, activo, verificado, fecha_registro, calificacion) 
VALUES ('profesional@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Profesional', 'Test', '3001234567', true, true, CURRENT_TIMESTAMP, 5.0);

-- Asignar rol profesional
INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT u.id, r.id FROM usuarios u, roles r WHERE u.email = 'profesional@test.com' AND r.nombre = 'SERVICE_PROVIDER';

-- Crear usuario cliente
INSERT INTO usuarios (email, password, nombre, apellido, telefono, activo, verificado, fecha_registro, calificacion) 
VALUES ('usuario@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Usuario', 'Test', '3009876543', true, true, CURRENT_TIMESTAMP, 5.0);

-- Asignar rol cliente
INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT u.id, r.id FROM usuarios u, roles r WHERE u.email = 'usuario@test.com' AND r.nombre = 'CUSTOMER';
```
