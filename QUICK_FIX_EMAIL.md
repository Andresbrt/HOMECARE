# Solución Rápida: Hacer Funcionar el Email de Verificación AHORA

## 🎯 Objetivo
Que `andresbermu211@gmail.com` reciba el email de verificación para poder continuar con el testing.

---

## ✅ Pasos a Seguir (5 minutos)

### 1. Deshabilitar Brevo Custom SMTP (Temporalmente)

**Por qué**: El SMTP de Supabase por defecto tiene mejor entregabilidad con Gmail

**Cómo**:
1. Abre: https://mowqzkjbggfqfrnxgobn.supabase.co
2. Ve a: `Project Settings` → `Authentication`
3. Scroll hasta: `SMTP Settings`
4. **Desmarcar**: ☐ Enable Custom SMTP
5. **Clic**: `Save`

✅ Ahora Supabase usará su propio servidor SMTP (muy confiable)

---

### 2. Eliminar el Usuario Actual

**Por qué**: Para poder registrarlo de nuevo y que envíe un nuevo email

**Cómo**:
1. En Supabase: `Authentication` → `Users`
2. Busca: `andresbermu211@gmail.com`
3. Clic en el menú `...` → `Delete User`
4. Confirma la eliminación

---

### 3. Registrar de Nuevo

#### Opción A: Desde la App (Recomendado)

1. Abre la app Expo en tu móvil (escanea el QR)
2. Ve a la pantalla de registro
3. Completa el formulario:
   - Email: `andresbermu211@gmail.com`
   - Contraseña: (la que quieras, mín 6 caracteres)
   - Nombre: Andres
   - Apellido: Bermudez
   - Rol: Cliente o Profesional
4. Clic en "Registrarse"

#### Opción B: Desde PowerShell

```powershell
# Desde cualquier carpeta
try {
  $body = @{
    email = "andresbermu211@gmail.com"
    password = "Test123456!"
    data = @{
      nombre = "Andres"
      apellido = "Bermudez"
    }
  } | ConvertTo-Json -Depth 3
  
  $response = Invoke-RestMethod `
    -Uri "https://mowqzkjbggfqfrnxgobn.supabase.co/auth/v1/signup" `
    -Method Post `
    -Headers @{
      "apikey" = "sb_publishable_hMkwDI_JwDQBy8MdNuA2ow_BJAs9pT_"
      "Content-Type" = "application/json"
    } `
    -Body $body
  
  Write-Host "✅ Registro exitoso! Revisa tu email en 1-2 minutos" -ForegroundColor Green
} catch {
  Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails.Message) {
    $_.ErrorDetails.Message | ConvertFrom-Json | Format-List
  }
}
```

---

### 4. Revisar el Email

**Espera 1-3 minutos** y revisa:
1. ✅ Bandeja de entrada (Principal)
2. ✅ Promociones / Social (pestañas de Gmail)
3. ✅ Spam / Correo no deseado
4. ✅ Buscar: `from:@supabase.io` o `subject:confirm`

📧 **El email vendrá de**: `noreply@mail.supabase.io` (no de info@homecare.com)

---

### 5. Confirmar el Email

1. Abre el email de Supabase
2. Clic en el botón "Confirm your mail"
3. Te redirigirá a una página de Supabase que dice "Email confirmed"
4. Listo! Ahora puedes hacer login en la app

---

## ⏱️ Timeline Esperado

- **0:00** - Deshabilitar Custom SMTP en Supabase
- **0:30** - Eliminar usuario
- **1:00** - Registrar de nuevo (desde app o PowerShell)
- **2:00** - Email llega a Gmail
- **3:00** - Confirmar email
- **3:30** - ✅ Todo funcionando!

---

## 🔍 Verificación

### Confirmar que el email está confirmado:

1. Supabase → `Authentication` → `Users`
2. Buscar: `andresbermu211@gmail.com`
3. Ver columna: `Email Confirmed At`
4. ✅ Debe tener una fecha/hora (no NULL)

### Confirmar que el perfil se creó:

1. Supabase → `Table Editor` → tabla `usuarios`
2. Buscar: `andresbermu211@gmail.com`
3. ✅ Debe aparecer con nombre y apellido

---

## 🚀 Después de Confirmar el Email

### Hacer Login en la App:

1. En la app, ve a la pantalla de Login
2. Ingresa:
   - Email: `andresbermu211@gmail.com`
   - Contraseña: la que usaste al registrarte
3. Clic en "Iniciar Sesión"
4. ✅ Deberías entrar a la app!

---

## 🔧 Para Más Tarde: Reactivar Brevo (Opcional)

Una vez que hayas confirmado que todo funciona con el SMTP de Supabase, si quieres volver a usar Brevo con tu dominio:

1. Verifica que el dominio esté autenticado en Brevo
2. Verifica que `info@homecare.com` esté verificado en Brevo
3. Espera 48 horas para propagación DNS completa
4. Vuelve a habilitar Custom SMTP en Supabase
5. Prueba con otro email de prueba

**Por ahora, el SMTP de Supabase es suficiente para testing y desarrollo.**

---

## ❓ Si Algo Falla

### El email no llega después de 5 minutos:

1. Verifica que Custom SMTP está realmente deshabilitado en Supabase
2. Elimina el usuario y regístralo de nuevo
3. Revisa todas las carpetas de Gmail (especialmente Spam)

### Error al registrar ("429 Too Many Requests"):

- Espera 60 segundos y vuelve a intentar
- O elimina el usuario y prueba de nuevo

### Email llega pero el link no funciona:

- Copia y pega el link completo en el navegador
- O confirma manualmente desde Supabase: Users → ... → Confirm email

---

## 📋 Checklist Final

- [ ] Custom SMTP deshabilitado en Supabase
- [ ] Usuario `andresbermu211@gmail.com` eliminado
- [ ] Registrado de nuevo (desde app o PowerShell)
- [ ] Email recibido en Gmail (de @supabase.io)
- [ ] Email confirmado (clic en el link)
- [ ] Usuario aparece confirmado en Supabase (Email Confirmed At tiene fecha)
- [ ] Perfil creado en tabla `usuarios`
- [ ] Login funciona en la app

---

## 🎉 Resultado Final

Al completar estos pasos:
- ✅ El usuario estará registrado
- ✅ El email estará verificado
- ✅ El perfil estará en la base de datos
- ✅ Podrás hacer login y usar la app
- ✅ El trigger `handle_new_user` funcionando
- ✅ Todo el flujo de registro operativo

**Tiempo total**: ~5 minutos
