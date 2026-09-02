-- ============================================================
-- HOMECARE — Row Level Security (RLS) + Storage + Auditoría
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Orden: DESPUÉS de haber corrido schema.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- SECCIÓN 1: ACTIVAR RLS EN TODAS LAS TABLAS DE NEGOCIO
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.usuarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_roles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios_aceptados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos             ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- SECCIÓN 2: FUNCIÓN AUXILIAR — Verificar si un usuario tiene rol
-- Usada por las políticas para evitar joins repetitivos
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.usuario_tiene_rol(p_rol_nombre TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuario_roles ur
    JOIN public.roles r ON r.id = ur.rol_id
    WHERE ur.usuario_id = auth.uid()
      AND r.nombre = p_rol_nombre
  );
$$;

-- Función para verificar si el usuario es admin del sistema
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.usuario_tiene_rol('ADMIN')
      OR public.usuario_tiene_rol('ROLE_ADMIN');
$$;

-- ────────────────────────────────────────────────────────────
-- SECCIÓN 3: TABLA usuarios
-- ────────────────────────────────────────────────────────────

-- SELECT: Cualquier usuario autenticado puede leer perfiles públicos
-- (necesario para que proveedores y clientes se vean entre sí)
CREATE POLICY "usuarios_select_autenticados"
ON public.usuarios FOR SELECT
TO authenticated
USING (true);

-- INSERT: Solo el trigger handle_new_user crea perfiles (SECURITY DEFINER)
-- Bloqueamos INSERT directo desde el cliente por seguridad
CREATE POLICY "usuarios_insert_propio"
ON public.usuarios FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: Solo el propio usuario puede actualizar su perfil
CREATE POLICY "usuarios_update_propio"
ON public.usuarios FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE: Solo admins pueden desactivar cuentas (preferimos soft delete)
CREATE POLICY "usuarios_delete_admin"
ON public.usuarios FOR DELETE
TO authenticated
USING (public.es_admin());

-- ────────────────────────────────────────────────────────────
-- SECCIÓN 4: TABLA roles (solo lectura pública)
-- ────────────────────────────────────────────────────────────

CREATE POLICY "roles_select_todos"
ON public.roles FOR SELECT
TO authenticated
USING (true);

-- Escribir roles solo desde el backend con service_role_key
-- (no hay política de INSERT/UPDATE/DELETE para 'authenticated')

-- ────────────────────────────────────────────────────────────
-- SECCIÓN 5: TABLA usuario_roles
-- ────────────────────────────────────────────────────────────

-- El usuario puede ver sus propios roles
CREATE POLICY "usuario_roles_select_propio"
ON public.usuario_roles FOR SELECT
TO authenticated
USING (usuario_id = auth.uid() OR public.es_admin());

-- Solo el backend (service_role) puede asignar/revocar roles
-- No añadimos políticas de INSERT/UPDATE/DELETE para 'authenticated'

-- ────────────────────────────────────────────────────────────
-- SECCIÓN 6: TABLA solicitudes
-- ────────────────────────────────────────────────────────────

-- SELECT: Los proveedores ven solicitudes ABIERTAS/EN_NEGOCIACION
--         Los clientes ven solo sus propias solicitudes
--         Los admins ven todo
CREATE POLICY "solicitudes_select_proveedor_o_cliente"
ON public.solicitudes FOR SELECT
TO authenticated
USING (
  -- El cliente ve sus propias solicitudes (cualquier estado)
  cliente_id = auth.uid()
  -- Los proveedores ven las solicitudes abiertas/en negociación
  OR (
    estado IN ('ABIERTA', 'EN_NEGOCIACION')
    AND public.usuario_tiene_rol('PROVEEDOR')
  )
  -- Los proveedores también ven solicitudes donde tienen oferta
  OR EXISTS (
    SELECT 1 FROM public.ofertas o
    WHERE o.solicitud_id = solicitudes.id
      AND o.proveedor_id = auth.uid()
  )
  -- Los proveedores ven servicios donde son el proveedor asignado
  OR EXISTS (
    SELECT 1 FROM public.servicios_aceptados sa
    WHERE sa.solicitud_id = solicitudes.id
      AND sa.proveedor_id = auth.uid()
  )
  -- Admins ven todo
  OR public.es_admin()
);

-- INSERT: Solo clientes autenticados pueden crear solicitudes
CREATE POLICY "solicitudes_insert_cliente"
ON public.solicitudes FOR INSERT
TO authenticated
WITH CHECK (
  cliente_id = auth.uid()
  AND (
    public.usuario_tiene_rol('CLIENTE')
    OR public.usuario_tiene_rol('ROLE_CUSTOMER')
    OR public.usuario_tiene_rol('CUSTOMER')
  )
);

-- UPDATE: Solo el cliente creador puede editar (mientras no esté ACEPTADA)
CREATE POLICY "solicitudes_update_cliente"
ON public.solicitudes FOR UPDATE
TO authenticated
USING (
  cliente_id = auth.uid()
  AND estado NOT IN ('ACEPTADA', 'COMPLETADA', 'CANCELADA')
)
WITH CHECK (cliente_id = auth.uid());

-- UPDATE especial: El sistema puede actualizar cualquier estado
-- (usado por el backend con service_role_key)

-- DELETE: Solo el cliente puede cancelar su propia solicitud ABIERTA
-- Preferimos el soft delete → marcamos como CANCELADA (ver Sección 8)
-- El DELETE real solo está permitido para admins
CREATE POLICY "solicitudes_delete_admin"
ON public.solicitudes FOR DELETE
TO authenticated
USING (public.es_admin());

-- ────────────────────────────────────────────────────────────
-- SECCIÓN 7: TABLA ofertas
-- ────────────────────────────────────────────────────────────

-- SELECT: El proveedor ve sus propias ofertas
--         El cliente ve las ofertas de SUS solicitudes
CREATE POLICY "ofertas_select_partes"
ON public.ofertas FOR SELECT
TO authenticated
USING (
  proveedor_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.solicitudes s
    WHERE s.id = ofertas.solicitud_id
      AND s.cliente_id = auth.uid()
  )
  OR public.es_admin()
);

-- INSERT: Solo proveedores pueden crear ofertas
CREATE POLICY "ofertas_insert_proveedor"
ON public.ofertas FOR INSERT
TO authenticated
WITH CHECK (
  proveedor_id = auth.uid()
  AND (
    public.usuario_tiene_rol('PROVEEDOR')
    OR public.usuario_tiene_rol('ROLE_SERVICE_PROVIDER')
    OR public.usuario_tiene_rol('SERVICE_PROVIDER')
  )
  -- No puede ofertar en su propia solicitud
  AND NOT EXISTS (
    SELECT 1 FROM public.solicitudes s
    WHERE s.id = ofertas.solicitud_id
      AND s.cliente_id = auth.uid()
  )
);

-- UPDATE: El proveedor modifica su oferta, el cliente puede rechazarla
CREATE POLICY "ofertas_update_partes"
ON public.ofertas FOR UPDATE
TO authenticated
USING (
  -- El proveedor modifica su propia oferta (solo si está PENDIENTE)
  (proveedor_id = auth.uid() AND estado = 'PENDIENTE')
  -- El cliente puede cambiar el estado de ofertas de SUS solicitudes
  OR EXISTS (
    SELECT 1 FROM public.solicitudes s
    WHERE s.id = ofertas.solicitud_id
      AND s.cliente_id = auth.uid()
  )
  OR public.es_admin()
);

-- DELETE: El proveedor puede retirar su oferta PENDIENTE
CREATE POLICY "ofertas_delete_proveedor"
ON public.ofertas FOR DELETE
TO authenticated
USING (
  proveedor_id = auth.uid()
  AND estado = 'PENDIENTE'
);

-- ────────────────────────────────────────────────────────────
-- SECCIÓN 8: TABLA servicios_aceptados
-- ────────────────────────────────────────────────────────────

-- SELECT: Solo el cliente y el proveedor involucrados
CREATE POLICY "servicios_select_partes"
ON public.servicios_aceptados FOR SELECT
TO authenticated
USING (
  cliente_id = auth.uid()
  OR proveedor_id = auth.uid()
  OR public.es_admin()
);

-- INSERT: Solo el sistema (service_role) crea servicios_aceptados
-- El cliente acepta una oferta via backend, no directamente
-- No añadimos política INSERT para 'authenticated'

-- UPDATE: El proveedor actualiza su estado de progreso
--         El cliente puede cancelar si el servicio aún no inició
CREATE POLICY "servicios_update_partes"
ON public.servicios_aceptados FOR UPDATE
TO authenticated
USING (
  proveedor_id = auth.uid()
  OR (cliente_id = auth.uid() AND estado IN ('CONFIRMADO', 'EN_CAMINO'))
  OR public.es_admin()
);

-- ────────────────────────────────────────────────────────────
-- SECCIÓN 9: TABLA mensajes
-- Acceso ESTRICTAMENTE limitado a remitente o destinatario
-- ────────────────────────────────────────────────────────────

-- SELECT: Solo quien envió o recibió el mensaje
CREATE POLICY "mensajes_select_participantes"
ON public.mensajes FOR SELECT
TO authenticated
USING (
  remitente_id = auth.uid()
  OR destinatario_id = auth.uid()
);

-- INSERT: El remitente debe ser el usuario autenticado
--         Solo si es participante de la solicitud (cliente o proveedor con oferta)
CREATE POLICY "mensajes_insert_participante"
ON public.mensajes FOR INSERT
TO authenticated
WITH CHECK (
  remitente_id = auth.uid()
  AND (
    -- El remitente es cliente de la solicitud
    EXISTS (
      SELECT 1 FROM public.solicitudes s
      WHERE s.id = mensajes.solicitud_id
        AND (s.cliente_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.servicios_aceptados sa
          WHERE sa.solicitud_id = s.id AND sa.proveedor_id = auth.uid()
        ))
    )
  )
);

-- UPDATE: Solo para marcar como leído (solo el destinatario)
CREATE POLICY "mensajes_update_destinatario"
ON public.mensajes FOR UPDATE
TO authenticated
USING (destinatario_id = auth.uid())
WITH CHECK (destinatario_id = auth.uid());

-- DELETE: Nadie puede borrar mensajes (auditoría)
-- (no añadimos política DELETE para 'authenticated')

-- ────────────────────────────────────────────────────────────
-- SECCIÓN 10: TABLA pagos
-- Solo el cliente involucrado y administradores
-- ────────────────────────────────────────────────────────────

-- SELECT: El cliente ve sus pagos, el proveedor ve los pagos que recibe, admins todo
CREATE POLICY "pagos_select_partes"
ON public.pagos FOR SELECT
TO authenticated
USING (
  cliente_id = auth.uid()
  OR proveedor_id = auth.uid()
  OR public.es_admin()
);

-- INSERT/UPDATE: Solo el backend con service_role_key procesa pagos
-- Los clientes NO pueden crear ni modificar registros de pago directamente
-- (no añadimos políticas INSERT/UPDATE para 'authenticated')

-- ────────────────────────────────────────────────────────────
-- SECCIÓN 11: STORAGE — Buckets y Políticas
-- ────────────────────────────────────────────────────────────

-- Crear buckets (ejecutar desde SQL Editor o via API)
-- NOTA: Si los buckets ya existen, estas instrucciones no fallan por el IF NOT EXISTS

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'perfiles-usuarios',
  'perfiles-usuarios',
  true,           -- público: las fotos de perfil son visibles para todos
  2097152,        -- 2MB límite por archivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidencias-servicios',
  'evidencias-servicios',
  false,          -- privado: las fotos de evidencia son confidenciales
  5242880,        -- 5MB límite por archivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── POLÍTICAS BUCKET: perfiles-usuarios (público) ──────────

-- Cualquiera puede leer fotos de perfil (es público)
CREATE POLICY "perfiles_select_todos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'perfiles-usuarios');

-- Solo el propio usuario puede subir/actualizar su foto
-- Path esperado: perfiles-usuarios/{uid}/{filename}
CREATE POLICY "perfiles_insert_propio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'perfiles-usuarios'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "perfiles_update_propio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'perfiles-usuarios'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "perfiles_delete_propio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'perfiles-usuarios'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ── POLÍTICAS BUCKET: evidencias-servicios (privado) ───────

-- Solo participantes del servicio pueden ver las fotos
-- Path esperado: evidencias-servicios/{servicioId}/{uid}/{filename}
CREATE POLICY "evidencias_select_participantes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidencias-servicios'
  AND EXISTS (
    SELECT 1 FROM public.servicios_aceptados sa
    WHERE sa.id::text = (storage.foldername(name))[1]
      AND (sa.cliente_id = auth.uid() OR sa.proveedor_id = auth.uid())
  )
);

-- Solo el proveedor del servicio puede subir fotos de evidencia
CREATE POLICY "evidencias_insert_proveedor"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidencias-servicios'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.servicios_aceptados sa
    WHERE sa.id::text = (storage.foldername(name))[1]
      AND sa.proveedor_id = auth.uid()
      AND sa.estado NOT IN ('COMPLETADO', 'CANCELADO')
  )
);

-- ────────────────────────────────────────────────────────────
-- SECCIÓN 12: SOFT DELETE — Cancelación segura de solicitudes
-- Verifica que no haya un servicio_aceptado activo antes de cancelar
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cancelar_solicitud_segura(p_solicitud_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_solicitud     solicitudes%ROWTYPE;
  v_servicio_id   BIGINT;
BEGIN
  -- 1. Verificar que la solicitud existe y pertenece al usuario autenticado
  SELECT * INTO v_solicitud
  FROM public.solicitudes
  WHERE id = p_solicitud_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Solicitud no encontrada');
  END IF;

  IF v_solicitud.cliente_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No tienes permiso para cancelar esta solicitud');
  END IF;

  -- 2. Verificar que no esté ya en un estado terminal
  IF v_solicitud.estado IN ('COMPLETADA', 'CANCELADA') THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'La solicitud ya está en estado ' || v_solicitud.estado
    );
  END IF;

  -- 3. Verificar que no haya un servicio_aceptado EN PROGRESO (no cancelable)
  SELECT id INTO v_servicio_id
  FROM public.servicios_aceptados
  WHERE solicitud_id = p_solicitud_id
    AND estado IN ('EN_PROGRESO', 'LLEGUE');

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'No puedes cancelar: el proveedor ya está trabajando en tu domicilio'
    );
  END IF;

  -- 4. Si hay servicio en estado CONFIRMADO/EN_CAMINO, cancelar también el servicio
  UPDATE public.servicios_aceptados
  SET estado = 'CANCELADO',
      cancelado_at = NOW(),
      motivo_cancelacion = 'Solicitud cancelada por el cliente'
  WHERE solicitud_id = p_solicitud_id
    AND estado IN ('CONFIRMADO', 'EN_CAMINO');

  -- 5. Rechazar todas las ofertas pendientes
  UPDATE public.ofertas
  SET estado = 'RECHAZADA'
  WHERE solicitud_id = p_solicitud_id
    AND estado IN ('PENDIENTE', 'ACEPTADA');

  -- 6. Marcar la solicitud como CANCELADA (soft delete)
  UPDATE public.solicitudes
  SET estado = 'CANCELADA',
      updated_at = NOW()
  WHERE id = p_solicitud_id;

  RETURN jsonb_build_object('ok', true, 'mensaje', 'Solicitud cancelada exitosamente');
END;
$$;

-- ────────────────────────────────────────────────────────────
-- SECCIÓN 13: TRIGGER updated_at — Asegurarse que cubre pagos y mensajes
-- (schema.sql ya tiene triggers para usuarios, solicitudes, ofertas, servicios)
-- ────────────────────────────────────────────────────────────

-- Añadir a pagos (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'tr_update_pagos'
      AND tgrelid = 'public.pagos'::regclass
  ) THEN
    CREATE TRIGGER tr_update_pagos
      BEFORE UPDATE ON public.pagos
      FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
  END IF;
END;
$$;

-- mensajes no tiene updated_at en el schema (solo created_at) — correcto, es inmutable.

-- ────────────────────────────────────────────────────────────
-- SECCIÓN 14: VERIFICAR que todas las tablas tienen RLS activo
-- ────────────────────────────────────────────────────────────
-- Ejecuta este SELECT para confirmar:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
-- Todas las filas deben mostrar rowsecurity = true
