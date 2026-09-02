/**
 * serviciosAceptadosService.js
 * Gestión del ciclo de vida de servicios confirmados.
 * Maneja: confirmación, progreso, completado y cancelación.
 */

import { supabase } from '../config/supabase';

// ─── ACEPTAR OFERTA ───────────────────────────────────────────────────────────

/**
 * El cliente acepta una oferta, creando el servicio_aceptado.
 * Opera en una transacción lógica: actualiza oferta + solicitud + crea servicio.
 *
 * @param {number} ofertaId
 * @param {string} clienteId - UUID del cliente para validación
 */
export async function aceptarOferta(ofertaId, clienteId) {
  // 1. Obtener la oferta con datos completos
  const { data: oferta, error: ofertaError } = await supabase
    .from('ofertas')
    .select(`
      *,
      solicitud:solicitudes!ofertas_solicitud_id_fkey (
        id, cliente_id, estado
      )
    `)
    .eq('id', ofertaId)
    .single();

  if (ofertaError || !oferta) throw new Error('Oferta no encontrada');
  if (oferta.solicitud.cliente_id !== clienteId) throw new Error('No autorizado');
  if (oferta.estado !== 'PENDIENTE') throw new Error('Esta oferta ya no está disponible');
  if (!['ABIERTA', 'EN_NEGOCIACION'].includes(oferta.solicitud.estado)) {
    throw new Error('La solicitud ya no acepta ofertas');
  }

  // 2. Marcar la oferta como ACEPTADA
  const { error: actualizarOfertaError } = await supabase
    .from('ofertas')
    .update({ estado: 'ACEPTADA' })
    .eq('id', ofertaId);

  if (actualizarOfertaError) throw new Error(actualizarOfertaError.message);

  // 3. Rechazar todas las demás ofertas pendientes de la misma solicitud
  await supabase
    .from('ofertas')
    .update({ estado: 'RECHAZADA' })
    .eq('solicitud_id', oferta.solicitud_id)
    .eq('estado', 'PENDIENTE')
    .neq('id', ofertaId);

  // 4. Actualizar la solicitud (ACEPTADA + guardar referencia a oferta ganadora)
  const { error: actualizarSolicitudError } = await supabase
    .from('solicitudes')
    .update({
      estado: 'ACEPTADA',
      oferta_aceptada_id: ofertaId,
    })
    .eq('id', oferta.solicitud_id);

  if (actualizarSolicitudError) throw new Error(actualizarSolicitudError.message);

  // 5. Crear el registro de servicio_aceptado
  const { data: servicio, error: servicioError } = await supabase
    .from('servicios_aceptados')
    .insert({
      solicitud_id: oferta.solicitud_id,
      oferta_id: ofertaId,
      cliente_id: clienteId,
      proveedor_id: oferta.proveedor_id,
      precio_acordado: oferta.precio_ofrecido,
      estado: 'CONFIRMADO',
      confirmado_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (servicioError) throw new Error(servicioError.message);
  return servicio;
}

// ─── CICLO DE VIDA DEL SERVICIO ───────────────────────────────────────────────

/**
 * Actualiza el estado del servicio y registra el timestamp correspondiente.
 * Solo el proveedor puede avanzar el estado (excepto cancelar).
 *
 * Transiciones válidas:
 * CONFIRMADO → EN_CAMINO → LLEGUE → EN_PROGRESO → COMPLETADO
 *
 * @param {number} servicioId
 * @param {import('../types/database.types').EstadoServicio} nuevoEstado
 * @param {string} actorId - UUID del actor (proveedor o cliente para cancelar)
 */
export async function avanzarEstadoServicio(servicioId, nuevoEstado, actorId) {
  const { data: servicio, error } = await supabase
    .from('servicios_aceptados')
    .select('id, estado, proveedor_id, cliente_id')
    .eq('id', servicioId)
    .single();

  if (error || !servicio) throw new Error('Servicio no encontrado');

  // Validar actor
  const esCancelacion = nuevoEstado === 'CANCELADO';
  const esProveedor = servicio.proveedor_id === actorId;
  const esCliente = servicio.cliente_id === actorId;

  if (esCancelacion) {
    if (!esProveedor && !esCliente) throw new Error('No autorizado para cancelar');
  } else {
    if (!esProveedor) throw new Error('Solo el proveedor puede avanzar el estado');
  }

  // Validar transición
  const transicionesValidas = {
    CONFIRMADO: ['EN_CAMINO', 'CANCELADO'],
    EN_CAMINO: ['LLEGUE', 'CANCELADO'],
    LLEGUE: ['EN_PROGRESO', 'CANCELADO'],
    EN_PROGRESO: ['COMPLETADO', 'CANCELADO'],
  };

  const permitidas = transicionesValidas[servicio.estado] || [];
  if (!permitidas.includes(nuevoEstado)) {
    throw new Error(`Transición inválida: ${servicio.estado} → ${nuevoEstado}`);
  }

  // Calcular campo de timestamp
  const timestampMap = {
    EN_CAMINO: 'en_camino_at',
    LLEGUE: 'llegue_at',
    EN_PROGRESO: 'iniciado_at',
    COMPLETADO: 'completado_at',
    CANCELADO: 'cancelado_at',
  };

  const updates = { estado: nuevoEstado };
  if (timestampMap[nuevoEstado]) {
    updates[timestampMap[nuevoEstado]] = new Date().toISOString();
  }

  const { data, error: updateError } = await supabase
    .from('servicios_aceptados')
    .update(updates)
    .eq('id', servicioId)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  // Si se completó, actualizar la solicitud también
  if (nuevoEstado === 'COMPLETADO') {
    await supabase
      .from('solicitudes')
      .update({ estado: 'COMPLETADA' })
      .eq('id', servicio.solicitud_id);
  }

  if (nuevoEstado === 'CANCELADO') {
    await supabase
      .from('solicitudes')
      .update({ estado: 'CANCELADA' })
      .eq('id', servicio.solicitud_id);
  }

  return data;
}

/**
 * Cancela un servicio con motivo.
 *
 * @param {number} servicioId
 * @param {string} actorId - UUID del actor
 * @param {string} motivo
 */
export async function cancelarServicio(servicioId, actorId, motivo) {
  const servicio = await avanzarEstadoServicio(servicioId, 'CANCELADO', actorId);

  await supabase
    .from('servicios_aceptados')
    .update({ motivo_cancelacion: motivo })
    .eq('id', servicioId);

  return servicio;
}

// ─── CONSULTAS ────────────────────────────────────────────────────────────────

/**
 * Obtiene un servicio con toda la información relacionada.
 *
 * @param {number} servicioId
 */
export async function getServicioById(servicioId) {
  const { data, error } = await supabase
    .from('servicios_aceptados')
    .select(`
      *,
      solicitud:solicitudes (*),
      oferta:ofertas (*),
      cliente:usuarios!servicios_aceptados_cliente_id_fkey (
        id, nombre, apellido, foto_perfil, telefono
      ),
      proveedor:usuarios!servicios_aceptados_proveedor_id_fkey (
        id, nombre, apellido, foto_perfil, calificacion_promedio, telefono
      )
    `)
    .eq('id', servicioId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Obtiene los servicios activos del proveedor.
 *
 * @param {string} proveedorId - UUID
 */
export async function getMisServiciosComoProveedor(proveedorId) {
  const { data, error } = await supabase
    .from('servicios_aceptados')
    .select(`
      *,
      solicitud:solicitudes (id, titulo, descripcion, tipo_limpieza, direccion, fecha_servicio, hora_inicio),
      cliente:usuarios!servicios_aceptados_cliente_id_fkey (
        id, nombre, apellido, foto_perfil, telefono
      )
    `)
    .eq('proveedor_id', proveedorId)
    .not('estado', 'in', '("COMPLETADO","CANCELADO")')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Historial de servicios del cliente.
 *
 * @param {string} clienteId - UUID
 */
export async function getHistorialCliente(clienteId) {
  const { data, error } = await supabase
    .from('servicios_aceptados')
    .select(`
      *,
      solicitud:solicitudes (id, titulo, tipo_limpieza, fecha_servicio),
      proveedor:usuarios!servicios_aceptados_proveedor_id_fkey (
        id, nombre, apellido, foto_perfil, calificacion_promedio
      )
    `)
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// ─── REALTIME ─────────────────────────────────────────────────────────────────

/**
 * Escucha cambios de estado de un servicio en tiempo real.
 *
 * @param {number} servicioId
 * @param {Function} onCambio
 * @returns {Function} - Desuscribirse
 */
export function suscribirAServicio(servicioId, onCambio) {
  const channel = supabase
    .channel(`servicio-${servicioId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'servicios_aceptados',
        filter: `id=eq.${servicioId}`,
      },
      (payload) => onCambio(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
