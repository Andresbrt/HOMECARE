# 🚀 Guía de Configuración: Neon PostgreSQL

Esta guía te ayudará a conectar tu backend Spring Boot con Neon, una base de datos PostgreSQL serverless.

---

## ¿Qué es Neon?

[Neon](https://neon.tech) es PostgreSQL serverless con:
- ✅ **Escala automática** — no necesitas gestionar conexiones
- ✅ **Capa gratuita generosa** — ideal para desarrollo y proyectos pequeños
- ✅ **Rápido** — latencia baja y conexiones rápidas
- ✅ **SSL por defecto** — seguridad sin configuración extra

---

## 📋 Paso 1: Crear tu Base de Datos en Neon

1. Ve a [https://console.neon.tech](https://console.neon.tech) y crea una cuenta (gratis).
2. Crea un nuevo proyecto:
   - Nombre: `homecare` (o el que prefieras)
   - Región: Elige la más cercana a tu servidor (ej: `us-east-2`)
3. Neon creará automáticamente:
   - Una base de datos llamada `neondb`
   - Un usuario llamado `neondb_owner`
   - Una contraseña segura

---

## 🔑 Paso 2: Obtener Credenciales de Conexión

En el panel de Neon, ve a **"Connection Details"**:

Verás algo como:

```
Host: ep-cool-waterfall-123456.us-east-2.aws.neon.tech
Database: neondb
User: neondb_owner
Password: [haz clic en el ojo para ver]
```

**Copia estos valores**, los necesitarás en el siguiente paso.

---

## 🛠️ Paso 3: Configurar Variables de Entorno

### Para Render (o cualquier plataforma de despliegue):

Ve a **Environment** en tu servicio de Render y agrega estas 3 variables:

| Variable | Valor |
|----------|-------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<HOST>/<DATABASE>?user=<USER>&password=<PASSWORD>&sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `<USER>` |
| `SPRING_DATASOURCE_PASSWORD` | `<PASSWORD>` |

**Ejemplo real:**
```
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-cool-waterfall-123456.us-east-2.aws.neon.tech/neondb?user=neondb_owner&password=SuperSecretPassword123&sslmode=require

SPRING_DATASOURCE_USERNAME=neondb_owner

SPRING_DATASOURCE_PASSWORD=SuperSecretPassword123
```

**⚠️ IMPORTANTE:**
- El nombre de la variable debe ser **EXACTAMENTE** `SPRING_DATASOURCE_URL` (sin comillas, sin espacios).
- **SIEMPRE incluye** `sslmode=require` al final de la URL.
- No pongas comillas alrededor del valor en Render.

### Para desarrollo local:

Crea un archivo `.env` en `/backend` (copiando `.env.example`) y edita:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-cool-waterfall-123456.us-east-2.aws.neon.tech/neondb?user=neondb_owner&password=SuperSecretPassword123&sslmode=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=SuperSecretPassword123
```

---

## ✅ Paso 4: Verificar la Conexión

### Opción 1: Revisar logs de Render

Después de hacer deploy, revisa los logs:

```
✅ BIEN:
HikariPool-1 - Starting...
HikariPool-1 - Start completed.
Hibernate: create table if not exists...

❌ MAL:
Failed to obtain JDBC Connection
${SPRING_DATASOURCE_URL}  ← Si ves esto, la variable no se expandió
```

### Opción 2: Probar endpoint de salud

Accede a:
```
https://tu-app.onrender.com/actuator/health
```

Si responde `{"status":"UP"}`, ¡todo funciona! 🎉

### Opción 3: Ver actividad en Neon

En el panel de Neon, ve a **"Activity"** o **"Query log"** para ver las conexiones desde tu backend.

---

## 🎯 Configuración Optimizada para Neon

El archivo `application-production.yml` ya está optimizado para Neon con:

- **Pool pequeño** (max 5 conexiones) — Neon escala automáticamente
- **Timeouts cortos** — conexiones rápidas en serverless
- **Keepalive** — mantiene conexiones vivas
- **Leak detection** — detecta conexiones no cerradas

No necesitas cambiar nada más. 👍

---

## 🔒 Seguridad

### Variables Privadas vs Públicas

| Dato | Tipo | ¿Compartir? |
|------|------|-------------|
| Host | Público | ⚠️ Solo si es necesario |
| Database | Público | ⚠️ Solo si es necesario |
| Usuario | Sensible | ❌ No compartir |
| Contraseña | **PRIVADO** | ❌ **NUNCA compartir** |

### Buenas Prácticas

✅ **SÍ:**
- Guarda las credenciales en variables de entorno
- Usa `.env` en desarrollo (nunca lo comitees)
- Rota la contraseña periódicamente en Neon

❌ **NO:**
- Nunca comitees credenciales a Git
- No compartas la contraseña por chat/email
- No uses la misma contraseña en desarrollo y producción

---

## 🆘 Solución de Problemas

### Error: `${SPRING_DATASOURCE_URL}` aparece en los logs

**Causa:** La variable de entorno no está definida o tiene el nombre incorrecto.

**Solución:**
1. Ve a Render → Environment
2. Verifica que la variable se llame **exactamente** `SPRING_DATASOURCE_URL`
3. Verifica que no tenga comillas ni espacios
4. Guarda y redeploya

---

### Error: `Connection refused` o `SSL error`

**Causa:** Falta `sslmode=require` en la URL o hay un problema de red.

**Solución:**
1. Verifica que la URL tenga `?user=...&password=...&sslmode=require` al final
2. Verifica que el host sea correcto (debe terminar en `.neon.tech`)
3. Verifica que la contraseña sea correcta (sin espacios al inicio/final)

---

### Error: `Authentication failed`

**Causa:** Usuario o contraseña incorrectos.

**Solución:**
1. Copia nuevamente las credenciales desde el panel de Neon
2. Asegúrate de no tener espacios al inicio/final
3. Si olvidaste la contraseña, puedes resetearla en Neon

---

### El backend arranca pero no crea tablas

**Causa:** Hibernate no tiene permisos o el usuario no es owner.

**Solución:**
1. Usa el usuario `<database>_owner` (no un usuario secundario)
2. Verifica que `ddl-auto: update` esté en `application-production.yml`
3. Revisa los logs para ver errores de Hibernate

---

## 📊 Monitoreo y Métricas

En el panel de Neon puedes ver:
- **Conexiones activas** — cuántas conexiones tiene tu backend
- **Uso de CPU/RAM** — rendimiento de tu base de datos
- **Query log** — todas las consultas ejecutadas
- **Métricas de storage** — espacio usado

---

## 💡 Tips y Mejores Prácticas

### 1. Usa connection pooling inteligente
El HikariCP está optimizado para Neon (5 conexiones máx). No aumentes este valor sin necesidad.

### 2. Monitorea el uso
Neon tiene límites en la capa gratuita:
- 0.5 GB storage
- 3 GB de transferencia
- 100 horas de compute al mes

### 3. Escala cuando sea necesario
Si llegas a los límites, Neon tiene planes pagos desde $19/mes con más recursos.

### 4. Backups automáticos
Neon hace backups automáticos. Puedes restaurar desde el panel en caso de error.

---

## 🎓 Recursos Adicionales

- [Documentación de Neon](https://neon.tech/docs)
- [Neon con Spring Boot](https://neon.tech/docs/guides/spring-boot)
- [Troubleshooting Neon](https://neon.tech/docs/troubleshooting)

---

## ✅ Checklist Final

Antes de marcar esto como completo, verifica:

- [ ] Cuenta de Neon creada
- [ ] Proyecto y base de datos creados
- [ ] Credenciales copiadas desde el panel
- [ ] Variables de entorno configuradas en Render
- [ ] `sslmode=require` incluido en la URL
- [ ] Deploy exitoso sin errores de conexión
- [ ] Endpoint de salud responde OK
- [ ] Actividad visible en el panel de Neon

---

🎉 **¡Listo!** Tu backend Spring Boot está conectado a Neon y funcionando.

Si tienes problemas, revisa la sección de [Solución de Problemas](#-solución-de-problemas) o consulta los logs de Render.
