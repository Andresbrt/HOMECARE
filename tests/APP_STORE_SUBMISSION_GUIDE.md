# Guía Maestra de Publicación en Tiendas: App Store & Google Play
**Proyecto**: Home Care Marketplace  
**Documento**: `tests/APP_STORE_SUBMISSION_GUIDE.md`  
**Objetivo**: Cumplir al 100% las directrices de revisión de Apple App Review y Google Play Console para aprobación sin rechazos.

---

## 🍎 1. Apple App Store (Directrices de Revisión Críticas)

### 1.1 Exención de In-App Purchases (Guideline 3.1.5 - Bienes y Servicios del Mundo Real)
- **Norma**: Los servicios prestados físicamente fuera del dispositivo (como limpieza del hogar, desinfección, mantenimiento) **NO requieren compras dentro de la app (In-App Purchases de Apple con comisión del 30%)**.
- **Justificación para el Revisor de Apple**:
  > *"Home Care facilitates physical home cleaning and domestic maintenance services delivered on-site at the user's residence. Under Apple Review Guideline 3.1.5 (Physical Goods and Services Outside of the App), transactions are processed via Mercado Pago web gateway and do not utilize Apple In-App Purchase."*

### 1.2 Eliminación de Cuentas Iniciada por el Usuario (Guideline 5.1.1.v)
- **Requisito Obligatorio**: Si una app permite crear cuentas, debe permitir al usuario eliminar su cuenta y todos sus datos personales desde la propia aplicación.
- **Implementación Home Care**:
  - Ubicación: `Perfil ➔ Configuración ➔ Cuenta ➔ Botón rojo "Eliminar cuenta"`.
  - Flujo: Diálogo de confirmación con contraseña + llamado a `DELETE /api/usuarios/me`.
  - Backend: Anonimización de datos personales y revocación inmediata de tokens activos.

### 1.3 Textos de Justificación de Permisos (`app.json` / `Info.plist`)
Deben ser explicaciones claras en español orientadas al beneficio del usuario:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Home Care utiliza tu ubicación para encontrar profesionales de limpieza cercanos a tu domicilio y calcular tarifas precisas.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Permite al cliente ver en tiempo real la llegada del profesional asignado a su hogar.",
        "NSCameraUsageDescription": "Permite tomar fotos de evidencia del estado del hogar antes y después del servicio de limpieza.",
        "NSPhotoLibraryUsageDescription": "Permite subir una foto de perfil y adjuntar imágenes en el chat de soporte."
      }
    }
  }
}
```

### 1.4 Privacy Nutrition Labels (Etiquetas de Privacidad de Datos)
En App Store Connect, declarar:
- **Datos Recopilados Vinculados al Usuario**:
  - *Ubicación precisa*: Para despacho del servicio.
  - *Información de contacto (Nombre, Email, Teléfono)*: Para autenticación y comunicación.
  - *Datos financieros (ID de transacción Mercado Pago)*: No se almacenan números de tarjeta de crédito (PCI-DSS delegado en Mercado Pago).
  - *Contenido de usuario*: Mensajes de chat y fotos de evidencia.

---

## 🤖 2. Google Play Store (Políticas de Desarrollador)

### 2.1 Sección de Seguridad de los Datos (Data Safety Section)
- **Cifrado en Tránsito**: Sí, todos los datos se transmiten sobre HTTPS/TLS 1.3 y WebSockets seguros (WSS).
- **Mecanismo de Solicitud de Borrado de Datos**: URL pública disponible para solicitud web y botón nativo en la app.
- **Compartición con Terceros**:
  - Mercado Pago (procesamiento de pagos).
  - Brevo (envío de correos transaccionales).
  - Supabase / AWS S3 (almacenamiento de fotos de evidencia).

### 2.2 Política de Permisos de Ubicación en Segundo Plano
- Google Play exige un video demostrativo si se solicita `ACCESS_BACKGROUND_LOCATION`.
- **Enfoque Recomendado**: Utilizar **Foreground Service** (`FOREGROUND_SERVICE_LOCATION`) activo solo mientras el servicio está en estado `EN_CAMINO`. Esto evita escrutinio adicional y acelera la aprobación.

---

## 📝 3. Metadatos de Publicación (Español - Colombia)

| Campo | Valor Recomendado | Límite de Caracteres |
|---|---|---|
| **Nombre de la App** | Home Care: Servicios del Hogar | 30 caracteres |
| **Subtítulo** | Limpieza y profesionales confiables | 30 caracteres |
| **Categoría Principal** | Estilo de vida (Lifestyle) / Casa y Hogar | — |
| **Categoría Secundaria** | Productividad / Negocios | — |
| **Palabras Clave (Keywords)** | limpieza hogar, aseo casa, empleada doméstica, servicios domicilio, bogotá, fontanero, desinfección | 100 caracteres |
| **URL de Soporte** | `https://homecare.co/soporte` | — |
| **URL de Privacidad** | `https://homecare.co/privacidad` | — |

### Descripción Larga (Store Description)
```text
Home Care conecta a los mejores profesionales independientes de limpieza y mantenimiento con hogares y oficinas en minutos.

¿POR QUÉ ELEGIR HOME CARE?
• Profesionales verificados: Validación rigurosa de identidad y antecedentes.
• Cotizaciones transparentes: Precios justos sin sorpresas ni cobros ocultos.
• Pago seguro garantizado: Tus fondos quedan protegidos en custodia hasta que el servicio finaliza a tu entera satisfacción.
• Chat en tiempo real: Comunícate directamente con tu profesional asignado.
• Seguimiento en vivo: Monitorea la llegada de tu profesional en el mapa.

SERVICIOS DISPONIBLES:
- Limpieza estándar y profunda para apartamentos y casas.
- Limpieza de mudanza y desocupación.
- Aseo por horas para oficinas y locales comerciales.
- Mantenimiento puntual del hogar.

Descarga Home Care hoy y disfruta de un hogar impecable con solo presionar un botón.
```

---

## 🚀 4. Comandos para Envío Automatizado con EAS Submit

```bash
cd mobile

# Enviar build más reciente de iOS a TestFlight / App Store Connect
eas submit --platform ios --latest

# Enviar build más reciente de Android a Google Play Internal Track
eas submit --platform android --latest
```
