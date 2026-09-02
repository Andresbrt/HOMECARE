# Configuración de Email SMTP en Supabase Auth

## Proveedores Soportados: Brevo (recomendado) y Zoho

---

## OPCIÓN A: Brevo (antiguo Sendinblue) — RECOMENDADO

### 1. Obtener credenciales SMTP de Brevo

1. Ve a [https://app.brevo.com](https://app.brevo.com) → Inicia sesión
2. `SMTP & API` → `SMTP` → Copia:
   - **Host:** `smtp-relay.brevo.com`
   - **Port:** `587` (TLS)
   - **Login:** tu email de Brevo
   - **Password:** la clave SMTP (no tu contraseña de cuenta)

### 2. Configurar en Supabase Dashboard

1. Ve a tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. `Settings` → `Authentication` → `SMTP Settings`
3. Activa `Enable Custom SMTP`
4. Rellena:

```
Host:        smtp-relay.brevo.com
Port:        587
Username:    tu-email@tudominio.com
Password:    (tu clave SMTP de Brevo)
Sender name: Homecare
Sender email: noreply@homecare.works
```

5. Haz clic en `Save`
6. Prueba con `Send test email`

---

## OPCIÓN B: Zoho Mail

### 1. Obtener credenciales SMTP de Zoho

1. Ve a [https://mail.zoho.com](https://mail.zoho.com) → tu cuenta
2. `Settings` → `Mail Accounts` → tu cuenta → `Configure Account` → `SMTP`
3. Datos:
   - **Host:** `smtp.zoho.com`
   - **Port:** `587` (TLS) o `465` (SSL)
   - **Username:** tu email de Zoho
   - **Password:** tu contraseña de Zoho (o App Password si usas 2FA)

### 2. Configurar en Supabase Dashboard

```
Host:        smtp.zoho.com
Port:        587
Username:    noreply@homecare.works
Password:    (tu contraseña de Zoho / App Password)
Sender name: Homecare
Sender email: noreply@homecare.works
```

---

## Plantillas de Email en Supabase

Ve a `Settings` → `Authentication` → `Email Templates` y personaliza:

### Confirm Signup
```html
<h2>Bienvenido a Homecare</h2>
<p>Confirma tu correo haciendo clic en el enlace:</p>
<a href="{{ .ConfirmationURL }}">Confirmar mi cuenta</a>
```

### Reset Password
```html
<h2>Recuperar contraseña - Homecare</h2>
<p>Haz clic para restablecer tu contraseña:</p>
<a href="{{ .ConfirmationURL }}">Restablecer contraseña</a>
<p>Este enlace expira en 1 hora.</p>
```

---

## Variables de Entorno Requeridas en el Backend

Agrega en tu `.env` o en las variables de entorno de tu plataforma de hosting:

```env
# Supabase
SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key  # Solo para admin backend

# Base de datos Supabase (PostgreSQL)
SPRING_DATASOURCE_URL=jdbc:postgresql://db.TU_PROJECT_REF.supabase.co:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=tu_db_password
```

---

## Variables en app.json del Móvil

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://TU_PROJECT_REF.supabase.co",
      "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    }
  }
}
```

> ⚠️ **Nunca** pongas la `service_role_key` en el cliente móvil.
> Solo usa la `anon_key` en el frontend.

---

## Google OAuth en Supabase (para loginWithGoogle)

1. Supabase Dashboard → `Authentication` → `Providers` → `Google` → Activa
2. Agrega:
   - `Client ID`: `630129948671-plv7lfm8e13lr8df1pec2fs9r5ppkf7i.apps.googleusercontent.com`
   - `Client Secret`: (obtenlo de Google Cloud Console)
3. En Google Cloud Console → `Credentials` → tu OAuth Client → `Authorized redirect URIs`:
   ```
   https://TU_PROJECT_REF.supabase.co/auth/v1/callback
   ```

---

## Buckets de Storage Requeridos

Crea estos buckets en `Storage` → `New bucket`:

| Bucket | Tipo | Descripción |
|--------|------|-------------|
| `avatares` | Público | Fotos de perfil de usuarios |
| `evidencias` | Privado | Fotos antes/después de servicios |

### Política RLS para `evidencias` (SQL Editor):
```sql
-- Solo el proveedor del servicio puede subir fotos
CREATE POLICY "Proveedores pueden subir evidencias"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidencias'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Cliente y proveedor pueden ver sus evidencias
CREATE POLICY "Ver evidencias propias"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'evidencias');
```
