# 🔥 FLUJOS COMPLETOS DEL SISTEMA HOMECARE

## Modelo inDriver: Ofertas Competitivas

---

## FLUJO 1: Registro y Autenticación

### Cliente - Registro

```mermaid
sequenceDiagram
    participant C as Cliente Mobile
    participant B as Backend
    participant DB as PostgreSQL

    C->>B: POST /api/auth/registro
    Note over C,B: { email, password, nombre, rol: "CUSTOMER" }
    
    B->>DB: Verificar email único
    DB-->>B: Email disponible
    
    B->>B: Hash password (BCrypt)
    B->>DB: Guardar usuario
    B->>DB: Asignar ROL_CUSTOMER
    
    B->>B: Generar JWT
    B-->>C: { token, refreshToken, user }
    
    C->>C: Guardar token (AsyncStorage)
    C->>C: Navegar a Home
```

### Proveedor - Registro

```mermaid
sequenceDiagram
    participant P as Proveedor Mobile
    participant B as Backend
    participant DB as PostgreSQL

    P->>B: POST /api/auth/registro
    Note over P,B: { email, password, nombre, rol: "SERVICE_PROVIDER",<br/>documento, experiencia, descripción }
    
    B->>DB: Verificar email único
    DB-->>B: Email disponible
    
    B->>B: Hash password
    B->>DB: Guardar usuario
    B->>DB: Asignar ROL_SERVICE_PROVIDER
    
    B->>B: Generar JWT
    B-->>P: { token, refreshToken, user }
    
    P->>P: Solicitar permisos ubicación
    P->>B: PUT /api/usuarios/ubicacion
    Note over P,B: { latitud, longitud, direccion }
    
    B->>DB: Actualizar ubicación
    B-->>P: Usuario actualizado
```

---

## FLUJO 2: Crear Solicitud (Cliente)

```mermaid
sequenceDiagram
    participant C as Cliente Mobile
    participant B as Backend
    participant DB as PostgreSQL
    participant N as NotificationService
    participant P as Proveedores Cercanos

    C->>C: Formulario de solicitud
    Note over C: - Tipo limpieza<br/>- Ubicación (mapa)<br/>- Fecha/hora<br/>- Detalles lugar<br/>- Precio máximo (opcional)
    
    C->>B: POST /api/solicitudes
    Note over C,B: Authorization: Bearer {token}
    
    B->>B: Validar JWT
    B->>B: Verificar rol CUSTOMER
    B->>B: Validar datos
    
    B->>DB: Guardar solicitud
    B->>DB: Estado: ABIERTA
    DB-->>B: Solicitud creada
    
    B->>DB: Buscar proveedores cercanos
    Note over B,DB: SELECT * FROM usuarios<br/>WHERE rol = 'SERVICE_PROVIDER'<br/>AND distancia <= 10km
    
    DB-->>B: Lista proveedores
    
    B->>N: Enviar notificaciones
    N->>P: Push: "Nueva solicitud cerca de ti"
    
    B-->>C: Solicitud creada exitosamente
    C->>C: Mostrar "Esperando ofertas..."
```

---

## FLUJO 3: Proveedor Ve Solicitudes Cercanas

```mermaid
sequenceDiagram
    participant P as Proveedor Mobile
    participant B as Backend
    participant DB as PostgreSQL

    P->>P: Actualizar ubicación actual
    P->>B: GET /api/solicitudes/cercanas?radio=10
    Note over P,B: Authorization: Bearer {token}
    
    B->>B: Validar JWT
    B->>B: Verificar rol SERVICE_PROVIDER
    B->>B: Obtener ubicación del proveedor
    
    B->>DB: Query geolocalización
    Note over B,DB: Haversine formula:<br/>distancia <= 10km<br/>estado IN ('ABIERTA', 'EN_NEGOCIACION')
    
    DB-->>B: Lista solicitudes
    
    B->>B: Calcular distancia a cada una
    B->>DB: Verificar si ya ofertó
    DB-->>B: Estado de ofertas
    
    B-->>P: Lista de solicitudes
    Note over P: Cada solicitud muestra:<br/>- Título y descripción<br/>- Tipo de limpieza<br/>- Fecha y hora<br/>- Distancia<br/>- Precio máximo (si existe)<br/>- Cantidad de ofertas<br/>- "Ya ofertaste" badge
    
    P->>P: Seleccionar solicitud
    P->>P: Ver detalles completos
```

---

## FLUJO 4: Enviar Oferta (Modelo inDriver)

```mermaid
sequenceDiagram
    participant P as Proveedor Mobile
    participant B as Backend
    participant DB as PostgreSQL
    participant N as NotificationService
    participant C as Cliente

    P->>P: Ver detalle de solicitud
    P->>P: Decidir participar
    
    P->>P: Formulario de oferta
    Note over P: EL PROVEEDOR DEFINE:<br/>- Su precio (competitivo)<br/>- Mensaje personalizado<br/>- Tiempo de llegada<br/>- Si incluye materiales
    
    P->>B: POST /api/ofertas
    Note over P,B: {<br/>  solicitudId,<br/>  precioOfrecido: 80000,<br/>  mensajeOferta: "...",<br/>  tiempoLlegadaMinutos: 30,<br/>  materialesIncluidos: true<br/>}
    
    B->>B: Validar JWT
    B->>B: Verificar rol SERVICE_PROVIDER
    
    B->>DB: Verificar que solicitud esté ABIERTA
    DB-->>B: Estado válido
    
    B->>DB: Verificar que no haya ofertado antes
    DB-->>B: Sin ofertas previas
    
    B->>DB: Guardar oferta
    B->>DB: Estado: PENDIENTE
    B->>DB: Incrementar contador de ofertas
    
    DB-->>B: Oferta creada
    
    B->>N: Notificar al cliente
    N->>C: Push: "Nueva oferta recibida"
    N->>C: Email: "Tienes 1 nueva oferta"
    
    B-->>P: Oferta enviada exitosamente
    P->>P: Mostrar "Oferta enviada, espera respuesta"
```

---

## FLUJO 5: Cliente Ve Ofertas (Elección Manual)

```mermaid
sequenceDiagram
    participant C as Cliente Mobile
    participant B as Backend
    participant DB as PostgreSQL

    C->>C: Push notification: "Nueva oferta"
    C->>C: Abrir solicitud
    
    C->>B: GET /api/ofertas/solicitud/{id}
    Note over C,B: Authorization: Bearer {token}
    
    B->>B: Validar JWT
    B->>B: Verificar que sea el cliente de la solicitud
    
    B->>DB: Obtener todas las ofertas PENDIENTES
    B->>DB: JOIN con datos del proveedor
    Note over DB: SELECT o.*, u.nombre, u.calificacion,<br/>u.servicios_completados<br/>FROM ofertas o<br/>JOIN usuarios u ON o.proveedor_id = u.id<br/>WHERE solicitud_id = {id}<br/>ORDER BY precio ASC
    
    DB-->>B: Lista de ofertas con datos
    B->>B: Calcular distancia proveedores
    
    B-->>C: Ofertas ordenadas por precio
    
    C->>C: Mostrar comparador de ofertas
    Note over C: Cada oferta muestra:<br/>- Precio ofrecido<br/>- Foto y nombre proveedor<br/>- Calificación (estrellas)<br/>- Servicios completados<br/>- Distancia<br/>- Mensaje<br/>- Tiempo llegada<br/>- Materiales incluidos<br/><br/>Botones:<br/>- [Chatear]<br/>- [Aceptar]
    
    C->>C: Cliente DECIDE manualmente
    Note over C: Compara:<br/>✓ Precio<br/>✓ Calificación<br/>✓ Experiencia<br/>✓ Cercanía<br/>✓ Mensaje
```

---

## FLUJO 6: Negociación por Chat

```mermaid
sequenceDiagram
    participant C as Cliente
    participant WS as WebSocket Server
    participant DB as PostgreSQL
    participant P as Proveedor

    C->>WS: Conectar WebSocket
    Note over C,WS: ws://api/ws
    
    P->>WS: Conectar WebSocket
    
    C->>C: Click en "Chatear" con proveedor
    C->>WS: Subscribe /topic/chat/{solicitudId}
    P->>WS: Subscribe /topic/chat/{solicitudId}
    
    C->>WS: Enviar mensaje
    Note over C,WS: "¿Puedes bajar el precio a $70,000?"
    
    WS->>DB: Guardar mensaje
    WS->>P: Mensaje en tiempo real
    
    P->>WS: Responder
    Note over P,WS: "Puedo ofrecerte $75,000 con materiales"
    
    WS->>DB: Guardar mensaje
    WS->>C: Mensaje en tiempo real
    
    Note over C,P: NEGOCIACIÓN DIRECTA<br/>Sin intermediarios<br/>Chat en vivo
    
    alt Cliente acepta contraoferta
        P->>WS: "Acepto $75,000"
        WS->>C: Mensaje recibido
        C->>C: Proceder a aceptar oferta
    end
```

---

## FLUJO 7: Aceptar Oferta (Cliente Elige)

```mermaid
sequenceDiagram
    participant C as Cliente Mobile
    participant B as Backend
    participant DB as PostgreSQL
    participant N as NotificationService
    participant P as Proveedor

    C->>C: Seleccionar oferta ganadora
    C->>C: Click "Aceptar Oferta"
    
    C->>B: POST /api/ofertas/aceptar
    Note over C,B: { ofertaId: 123 }
    
    B->>B: Validar JWT
    B->>B: Verificar rol CUSTOMER
    
    B->>DB: Obtener oferta
    DB-->>B: Oferta data
    
    B->>B: Verificar que sea cliente de solicitud
    B->>B: Verificar oferta esté PENDIENTE
    
    B->>DB: BEGIN TRANSACTION
    
    B->>DB: Actualizar oferta → ACEPTADA
    B->>DB: Actualizar otras ofertas → RECHAZADAS
    B->>DB: Actualizar solicitud → ACEPTADA
    B->>DB: Crear ServicioAceptado
    Note over DB: {<br/>  solicitudId,<br/>  ofertaId,<br/>  clienteId,<br/>  proveedorId,<br/>  precioAcordado,<br/>  estado: 'CONFIRMADO'<br/>}
    
    B->>DB: COMMIT TRANSACTION
    
    B->>N: Notificar al proveedor ganador
    N->>P: Push: "¡Tu oferta fue aceptada!"
    
    B->>N: Notificar a otros proveedores
    N-->>P: Push: "El cliente eligió otra oferta"
    
    B-->>C: Servicio confirmado
    C->>C: Navegar a ServiceTracking
```

---

## FLUJO 8: Tracking del Servicio

```mermaid
sequenceDiagram
    participant P as Proveedor
    participant B as Backend
    participant DB as PostgreSQL
    participant WS as WebSocket
    participant C as Cliente

    Note over P,C: ESTADO: CONFIRMADO
    
    P->>P: "Estoy en camino"
    P->>B: PUT /api/servicios/{id}/estado
    Note over P,B: { estado: "EN_CAMINO" }
    
    B->>DB: Actualizar estado
    B->>DB: Set en_camino_at = NOW()
    B->>WS: Broadcast estado
    WS->>C: Actualización en tiempo real
    C->>C: Mostrar "Proveedor en camino"
    
    Note over P,C: ESTADO: EN_CAMINO
    
    P->>P: "Ya llegué"
    P->>B: PUT /api/servicios/{id}/estado
    Note over P,B: { estado: "LLEGUE" }
    
    B->>DB: Set llegue_at = NOW()
    B->>WS: Broadcast
    WS->>C: "Proveedor ha llegado"
    
    Note over P,C: ESTADO: LLEGUE
    
    P->>P: "Iniciar servicio"
    P->>B: PUT /api/servicios/{id}/estado
    Note over P,B: { estado: "EN_PROGRESO" }
    
    B->>DB: Set iniciado_at = NOW()
    B->>WS: Broadcast
    WS->>C: "Servicio en progreso"
    
    Note over P,C: ESTADO: EN_PROGRESO
    
    P->>P: Tomar fotos antes
    P->>B: POST /api/servicios/{id}/fotos
    Note over P,B: { tipo: "ANTES", urls: [...] }
    
    P->>P: Realizar limpieza
    
    P->>P: Tomar fotos después
    P->>B: POST /api/servicios/{id}/fotos
    Note over P,B: { tipo: "DESPUES", urls: [...] }
    
    P->>P: "Servicio completado"
    P->>B: PUT /api/servicios/{id}/estado
    Note over P,B: { estado: "COMPLETADO" }
    
    B->>DB: Set completado_at = NOW()
    B->>WS: Broadcast
    WS->>C: "Servicio completado"
    
    Note over P,C: ESTADO: COMPLETADO
    
    C->>C: Ver fotos del trabajo
    C->>C: Confirmar satisfacción
```

---

## FLUJO 9: Pago con Wompi

```mermaid
sequenceDiagram
    participant C as Cliente
    participant B as Backend
    participant DB as PostgreSQL
    participant W as Wompi API
    participant P as Proveedor

    Note over C: Servicio COMPLETADO
    
    C->>C: Click "Proceder a pagar"
    
    C->>B: GET /api/pagos/crear
    Note over C,B: { servicioId }
    
    B->>DB: Obtener servicio
    B->>B: Calcular montos
    Note over B: precioAcordado = 75000<br/>comision = 7500 (10%)<br/>montoProveedor = 67500
    
    B->>DB: Crear registro de pago
    Note over DB: estado: PENDIENTE
    
    B->>W: Crear transacción
    Note over B,W: {<br/>  amount: 75000,<br/>  reference: "HC-{id}",<br/>  customer_email: "..."<br/>}
    
    W-->>B: { transaction_id, payment_link }
    
    B->>DB: Guardar transaction_id
    
    B-->>C: { paymentUrl }
    
    C->>W: Abrir Wompi checkout
    C->>W: Seleccionar método de pago
    Note over C: PSE, Tarjeta, Nequi
    
    C->>W: Completar pago
    
    W->>B: Webhook: /api/webhooks/wompi
    Note over W,B: {<br/>  event: "transaction.updated",<br/>  status: "APPROVED"<br/>}
    
    B->>DB: Actualizar pago → APROBADO
    B->>DB: Set aprobado_at = NOW()
    
    B->>DB: Actualizar estadísticas proveedor
    B->>DB: Incrementar servicios_completados
    
    B-->>C: Pago aprobado
    C->>C: Mostrar "Pago exitoso"
    C->>C: Navegar a Calificación
```

---

## FLUJO 10: Calificación Mutua

```mermaid
sequenceDiagram
    participant C as Cliente
    participant B as Backend
    participant DB as PostgreSQL
    participant P as Proveedor

    Note over C,P: Servicio COMPLETADO y PAGADO
    
    C->>C: Formulario calificación
    Note over C: - Estrellas (1-5)<br/>- Comentario<br/>- Aspectos: puntualidad,<br/>  calidad, profesionalismo
    
    C->>B: POST /api/calificaciones
    Note over C,B: {<br/>  servicioId,<br/>  calificadoId: proveedorId,<br/>  puntuacion: 5,<br/>  comentario: "Excelente",<br/>  tipo: "CLIENTE_A_PROVEEDOR"<br/>}
    
    B->>DB: Guardar calificación
    B->>DB: Trigger: actualizar_calificacion_usuario()
    Note over DB: Recalcula promedio<br/>del proveedor
    
    B->>DB: UPDATE usuarios<br/>SET calificacion = AVG(puntuacion)
    
    B-->>C: Calificación guardada
    C->>C: "Gracias por tu feedback"
    
    P->>P: Notificación: "Has sido calificado"
    P->>P: Ver calificación
    
    P->>P: Formulario calificación cliente
    Note over P: - Estrellas<br/>- Comentario<br/>- "Cliente cortés y claro"
    
    P->>B: POST /api/calificaciones
    Note over P,B: {<br/>  servicioId,<br/>  calificadoId: clienteId,<br/>  puntuacion: 5,<br/>  tipo: "PROVEEDOR_A_CLIENTE"<br/>}
    
    B->>DB: Guardar calificación
    B->>DB: Actualizar promedio cliente
    
    B-->>P: Calificación guardada
    
    Note over C,P: SERVICIO FINALIZADO<br/>Calificación mutua completada
```

---

## FLUJO 11: Proveedor - Dashboard y Estadísticas

```mermaid
sequenceDiagram
    participant P as Proveedor Mobile
    participant B as Backend
    participant DB as PostgreSQL

    P->>B: GET /api/proveedores/estadisticas
    
    B->>DB: Query estadísticas
    Note over DB: SELECT<br/>  COUNT(*) servicios_completados,<br/>  AVG(calificacion) promedio,<br/>  SUM(monto_proveedor) ganancia_total,<br/>  AVG(monto_proveedor) ganancia_promedio<br/>FROM servicios_aceptados sa<br/>JOIN pagos p ON sa.id = p.servicio_id<br/>WHERE proveedor_id = {id}<br/>AND estado = 'COMPLETADO'
    
    DB-->>B: Datos estadísticas
    
    B->>DB: Obtener ofertas pendientes
    B->>DB: Obtener servicios activos
    B->>DB: Gráfico ganancias mensuales
    
    B-->>P: Dashboard completo
    
    P->>P: Mostrar dashboard
    Note over P: 📊 Dashboard<br/>- Servicios completados: 47<br/>- Calificación: 4.8⭐<br/>- Ganancia total: $2,350,000<br/>- Ganancia promedio: $50,000<br/>- Ofertas pendientes: 3<br/>- Servicios activos: 1<br/>- Gráfico de ganancias<br/>- Últimas calificaciones
```

---

## FLUJO 12: Admin - Métricas del Sistema

```mermaid
sequenceDiagram
    participant A as Admin Web
    participant B as Backend
    participant DB as PostgreSQL

    A->>B: GET /api/admin/dashboard
    Note over A,B: Authorization: Bearer {admin_token}
    
    B->>B: Validar rol ADMIN
    
    B->>DB: Métricas generales
    Note over DB: - Total usuarios (clientes/proveedores)<br/>- Solicitudes activas<br/>- Servicios completados hoy<br/>- Ofertas promedio por solicitud<br/>- Comisiones generadas<br/>- Tasa de conversión
    
    B->>DB: Modelo inDriver metrics
    Note over DB: - Competencia promedio<br/>  (ofertas por solicitud)<br/>- Variación de precios<br/>- Tasa de negociación (chats)<br/>- Tiempo promedio de elección
    
    B->>DB: Top proveedores
    B->>DB: Mapa de calor (geolocalización)
    B->>DB: Gráficos de actividad
    
    DB-->>B: Datos completos
    
    B-->>A: Dashboard admin
    
    A->>A: Visualizar métricas
    Note over A: 📈 Métricas HOMECARE<br/>- 2,450 usuarios activos<br/>- 127 solicitudes activas<br/>- 89 servicios completados hoy<br/>- 4.2 ofertas promedio<br/>- $1,245,000 comisiones mes<br/>- 87% tasa conversión<br/><br/>Modelo inDriver:<br/>- Competencia: 4.2 ofertas/solicitud<br/>- Variación: 15% precio promedio<br/>- Negociación: 68% usan chat<br/>- Elección: 2.3 horas promedio
```

---

## VALIDACIÓN FINAL: Modelo inDriver

### ✅ Confirmación de Características

| Característica | Estado | Implementación |
|----------------|--------|----------------|
| Cliente publica solicitud | ✅ | POST /api/solicitudes |
| Proveedores compiten | ✅ | Múltiples POST /api/ofertas |
| Proveedor define SU precio | ✅ | Campo `precioOfrecido` libre |
| Ofertas privadas | ✅ | Solo cliente ve todas |
| Proveedores ven cantidad | ✅ | Campo `cantidadOfertas` |
| Cliente elige manualmente | ✅ | GET /api/ofertas + botón Aceptar |
| Negociación por chat | ✅ | WebSocket + mensajes |
| NO asignación automática | ✅ | Sin algoritmo de matching |
| NO precios fijos | ✅ | Proveedor propone libremente |

### 🎯 Diferencias vs Uber/Rappi

| Aspecto | HOMECARE (inDriver) | Uber/Rappi |
|---------|---------------------|------------|
| Precio | Proveedor lo define | App lo calcula |
| Asignación | Cliente elige | Automática |
| Ofertas | Múltiples visibles | Una invisible |
| Negociación | Sí, por chat | No |
| Competencia | Explícita | Implícita |
| Control | Cliente total | Algoritmo |

---

**🏠 HOMECARE - Modelo inDriver Validado ✅**

*Mercado libre • Competencia transparente • Elección del usuario*
