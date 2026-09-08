# 📋 HOMECARE — Guión Oficial de Demostración (Demo Runbook)

Este documento contiene el guión paso a paso, credenciales y flujo cronometrado para presentar la plataforma **HOMECARE** ante inversores, evaluadores o clientes en un demo en vivo de **3 a 5 minutos sin fallos**.

---

## 🎯 Resumen Ejecutivo para la Presentación
> **HOMECARE** es la plataforma tecnológica que conecta servicios para el hogar (limpieza, mantenimiento, belleza y bienestar) combinando el **modelo de subasta/negociación estilo InDriver** con **pagos en garantía (Escrow) respaldados por Mercado Pago**, **geolocalización en tiempo real** y **chat cifrado**.

---

## 🔑 Credenciales y Datos de Prueba (Sandbox)

### 1. Cuentas de Acceso

| Rol | Correo Electrónico | Contraseña | Perfil / Datos |
| :--- | :--- | :--- | :--- |
| **Cliente** | `usuario@test.com` | `Test123!` | Juan Cliente (Bogotá, Zona T) |
| **Profesional** | `profesional.demo@test.com` | `Test123!` | Carlos Profesional (4.9★, Verificado) |

---

### 2. Tarjetas de Prueba de Mercado Pago (Sandbox Colombia)

| Escenario | Número de Tarjeta | Vencimiento | CVV | Titular |
| :--- | :--- | :--- | :--- | :--- |
| **Aprobado (Recomendado para Demo)** | `4509 9535 6623 3704` | `11/25` (o futuro) | `123` | `APRO` |
| **Fondos Insuficientes (Rechazo)** | `5031 7557 3453 0604` | `11/25` | `123` | `FUND` |
| **En Revisión / Pendiente** | `4000 0000 0000 0002` | `11/25` | `123` | `CONT` |

---

## ⏱️ Guión de Demostración Paso a Paso (3-4 Minutos)

```
[0:00 - 0:45]  Acto 1: El Cliente crea la necesidad (Modelo InDriver)
[0:45 - 1:45]  Acto 2: El Profesional recibe y envía su contraoferta
[1:45 - 2:30]  Acto 3: Aceptación y Chat en Tiempo Real
[2:30 - 3:30]  Acto 4: Culminación y Pago Seguro con Mercado Pago
[3:30 - 4:15]  Acto 5: Métricas y Economía del Negocio (Dashboard)
```

---

### Acto 1: El Cliente Crea la Solicitud (0:00 - 0:45)
1. **Iniciar sesión como Cliente:** Ingresar con `usuario@test.com` / `Test123!`.
2. **Crear Servicio:**
   - Tocar en la categoría **Limpieza General / Básica**.
   - Tipo de Propiedad: **Apartamento** (60 m²).
   - Ubicación: Detecta automáticamente Bogotá (Zona T / Chicó).
   - Presupuesto propuesto por el cliente: **$65.000 COP**.
   - Tocar **⚡ SOLICITAR OFERTAS AHORA**.
3. **Punto clave a decir:**
   > *"A diferencia de las plataformas tradicionales de precio fijo rígido, HOMECARE empodera al cliente para proponer su presupuesto según el tamaño del hogar y la urgencia."*

---

### Acto 2: El Profesional Evalúa y Oferta (0:45 - 1:45)
1. **Cambiar al rol Profesional:** Ingresar con `profesional.demo@test.com` / `Test123!`.
2. **Abrir "Solicitudes Cercanas":**
   - El profesional ve el radar de 10 km a la redonda en Bogotá.
   - Aparece la solicitud recién creada por Juan Cliente.
3. **Enviar Oferta:**
   - Tocar sobre la solicitud.
   - Precio ofrecido: **$65.000 COP** (o contraofertar $70.000 COP).
   - Tiempo estimado de llegada: **15 minutos**.
   - Mensaje: *"Cuento con todos los implementos y certificación de bioseguridad."*
   - Tocar **Enviar Oferta**.
4. **Punto clave a decir:**
   > *"El profesional es dueño de su tiempo y de su tarifa. Recibe notificaciones geolocalizadas y puede aceptar el precio o contraofertar en tiempo real."*

---

### Acto 3: Aceptación y Chat en Vivo (1:45 - 2:30)
1. **Regresar a la app del Cliente:**
   - En la sección "Ofertas Recibidas", el cliente ve la tarjeta de Carlos Profesional:
     - Calificación: **4.9 ★**
     - Sello de **Proveedor Verificado**
     - Tarifa: **$65.000 COP**
2. **Aceptar Oferta:**
   - Tocar **Contratar a Carlos**.
3. **Chat en Vivo:**
   - La app abre automáticamente la sala de chat en tiempo real.
   - Escribir: *"Hola Carlos, te espero en portería del edificio."*
   - Ver el indicador de entrega en tiempo real.
4. **Punto clave a decir:**
   > *"Al aceptar la oferta, se activa inmediatamente un canal de comunicación directo y seguro entre ambas partes, protegiendo los números personales."*

---

### Acto 4: Ejecución del Servicio y Pago con Mercado Pago (2:30 - 3:30)
1. **Seguimiento del Servicio:**
   - En la pantalla de seguimiento (`ServiceTracking`), se observa el progreso del servicio (`EN_PROGRESO` → `COMPLETADO`).
2. **Pagar con Mercado Pago:**
   - Al marcarse completado, se habilita el botón verde **Pagar con Mercado Pago**.
   - Se abre el formulario seguro de **Mercado Pago Checkout Bricks**:
     - Número: `4509 9535 6623 3704`
     - Vencimiento: `11/25`
     - CVV: `123`
     - Titular: `APRO`
   - Presionar **Pagar**.
3. **Confirmación Inmediata:**
   - Aparece la alerta verde: **"¡Pago aprobado! ✓ Tu pago de $65.000 COP fue procesado exitosamente."**
4. **Punto clave a decir:**
   > *"El pago cuenta con protección Escrow: la plataforma retiene el monto de forma segura y solo lo libera al profesional cuando el servicio ha sido verificado a satisfacción, eliminando fraudes para ambas partes."*

---

### Acto 5: Métricas y Modelo de Negocio (3:30 - 4:15)
1. **Mostrar Dashboard Financiero del Profesional:**
   - Entrar al módulo de **Finanzas y Rendimiento** del profesional.
   - Mostrar:
     - Ingresos del mes: **$1.450.000 COP**
     - Calificación promedio: **4.9 ★** con **128 servicios completados**
     - Tasa de éxito: **98%**
   - Mostrar el desglose de comisión: **10% de comisión para HOMECARE**, **90% neto para el profesional**.
2. **Cierre de Oro:**
   > *"HOMECARE resuelve la informalidad del sector de servicios domésticos en Latinoamérica mediante tecnología fluida, confianza mutua y una monetización transparente basada en comisiones y suscripciones premium."*

---

## 🛠️ Plan de Contingencia / Resolución Rápida en Vivo

| Situación | Causa | Solución Rápida |
| :--- | :--- | :--- |
| **No veo las solicitudes en el mapa** | Emulador tomó coordenadas de EE.UU. | Presionar el botón de refrescar (`Pull to refresh`). La app tiene inyectado el fallback automático a Bogotá (Zona T). |
| **Error en pago con tarjeta** | Se digitó mal el número de prueba | Usar la tarjeta `4509 9535 6623 3704` / CVV `123` / Titular `APRO`. |
| **La app móvil se desconectó de Expo** | Pérdida de red local | En la terminal presionar `r` para recargar Expo Go en el emulador. |
| **Verificar salud del backend** | Chequeo previo al demo | Abrir `https://homecare-backend.fly.dev/actuator/health` (debe retornar `{"status":"UP"}`). |
