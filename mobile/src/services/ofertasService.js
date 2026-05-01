/**
 * ofertasService.js
 * Sistema de licitación (bidding) — Modelo inDriver.
 * Proveedores compiten ofreciendo precios por solicitudes abiertas.
 */

import { supabase } from '../config/supabase';

// ─── CREAR OFERTA ─────────────────────────────────────────────────────────────

/**
 * El proveedor envía una oferta por una solicitud.
 *
 * Reglas de negocio:
 * - El proveedor NO puede ofertar en su propia solicitud (no aplica: proveedores no crean solicitudes).
 * - No se permiten ofertas duplicadas (mismo proveedor, misma solicitud).
 * - La solicitud debe estar en estado ABIERTA o EN_NEGOCIACION.
 *
 * @param {string} proveedorId - UUID del proveedor autenticado
 * @param {import('../types/database.types').CrearOfertaDTO} dto
 */
export async function crearOferta(proveedorId, dto) {
  const { solicitud_id, precio_ofrecido, mensaje_oferta, tiempo_llegada_minutos, materiales_incluidos } = dto;

  // 1. Verificar que la solicitud esté abierta
  const { data: solicitud, error: solError } = await supabase
    .from('solicitudes')
    .select('id, estado, cliente_id')
    .eq('id', solicitud_id)
    .single();

  if (solError || !solicitud) throw new Error('Solicitud no encontrada');
  if (!['ABIERTA', 'EN_NEGOCIACION'].includes(solicitud.estado)) {
    throw new Error('La solicitud no está disponible para recibir ofertas');
  }

  // 2. Verificar que no sea el propio cliente el que oferta (extra seguridad)
  if (solicitud.cliente_id === proveedorId) {
    throw new Error('No puedes ofertar en tu propia solicitud');
  }

  // 3. Verificar que no exista una oferta previa del mismo proveedor
  const { data: ofertaExistente } = await supabase
    .from('ofertas')
    .select('id')
    .eq('solicitud_id', solicitud_id)
    .eq('proveedor_id', proveedorId)
    .in('estado', ['PENDIENTE', 'ACEPTADA'])
    .maybeSingle();

  if (ofertaExistente) throw new Error('Ya tienes una oferta activa en esta solicitud');

  // 4. Insertar la oferta
  const { data, error } = await supabase
    .from('ofertas')
    .insert({
      solicitud_id,
      proveedor_id: proveedorId,
      precio_ofrecido,
      mensaje_oferta: mensaje_oferta || null,
      tiempo_llegada_minutos: tiempo_llegada_minutos || null,
      materiales_incluidos: materiales_incluidos ?? false,
      estado: 'PENDIENTE',
    })
    .select(`
      *,
      proveedor:usuarios!ofertas_proveedor_id_fkey (
        id, nombre, apellido, foto_perfil, calificacion_promedio, experiencia_anos
      )
    `)
    .single();

  if (error) throw new Error(error.message);

  // 5. Actualizar estado de la solicitud a EN_NEGOCIACION
  await supabase
    .from('solicitudes')
    .update({ estado: 'EN_NEGOCIACION' })
    .eq('id', solicitud_id)
    .eq('estado', 'ABIERTA'); // Solo si sigue abierta

  return data;
}

// ─── LISTAR OFERTAS ───────────────────────────────────────────────────────────

/**
 * Obtiene todas las ofertas de una solicitud (para el cliente).
 *
 * @param {number} solicitudId
 */
export async function getOfertasDeSolicitud(solicitudId) {
  const { data, error } = await supabase
    .from('ofertas')
    .select(`
      *,
      proveedor:usuarios!ofertas_proveedor_id_fkey (
        id, nombre, apellido, foto_perfil, calificacion_promedio, experiencia_anos,
        descripcion, servicios_completados, verificado
      )
    `)
    .eq('solicitud_id', solicitudId)
    .neq('estado', 'RETIRADA')
    .order('precio_ofrecido', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Obtiene las ofertas del proveedor autenticado.
 *
 * @param {string} proveedorId - UUID del proveedor
 */
export async function getMisOfertas(proveedorId) {
  const { data, error } = await supabase
    .from('ofertas')
    .select(`
      *,
      solicitud:solicitudes (
        id, titulo, descripcion, tipo_limpieza, direccion, fecha_servicio, hora_inicio, estado
      )
    `)
    .eq('proveedor_id', proveedorId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// ─── MODIFICAR OFERTA ─────────────────────────────────────────────────────────

/**
 * El proveedor modifica el precio de su oferta pendiente.
 *
 * @param {number} ofertaId
 * @param {string} proveedorId - UUID para validación
 * @param {number} nuevoPrecio
 * @param {string} [nuevoMensaje]
 */
export async function modificarOferta(ofertaId, proveedorId, nuevoPrecio, nuevoMensaje) {
  const { data: oferta } = await supabase
    .from('ofertas')
    .select('id, estado, proveedor_id')
    .eq('id', ofertaId)
    .single();

  if (!oferta) throw new Error('Oferta no encontrada');
  if (oferta.proveedor_id !== proveedorId) throw new Error('No autorizado');
  if (oferta.estado !== 'PENDIENTE') throw new Error('Solo se pueden modificar ofertas pendientes');

  const updates = { precio_ofrecido: nuevoPrecio };
  if (nuevoMensaje !== undefined) updates.mensaje_oferta = nuevoMensaje;

  const { data, error } = await supabase
    .from('ofertas')
    .update(updates)
    .eq('id', ofertaId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * El proveedor retira su oferta.
 *
 * @param {number} ofertaId
 * @param {string} proveedorId - UUID para validación
 */
export async function retirarOferta(ofertaId, proveedorId) {
  const { data: oferta } = await supabase
    .from('ofertas')
    .select('id, estado, proveedor_id')
    .eq('id', ofertaId)
    .single();

  if (!oferta) throw new Error('Oferta no encontrada');
  if (oferta.proveedor_id !== proveedorId) throw new Error('No autorizado');
  if (oferta.estado !== 'PENDIENTE') throw new Error('Solo se pueden retirar ofertas pendientes');

  const { data, error } = await supabase
    .from('ofertas')
    .update({ estado: 'RETIRADA' })
    .eq('id', ofertaId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * El cliente rechaza una oferta específica.
 *
 * @param {number} ofertaId
 * @param {string} clienteId - UUID del cliente para validación
 */
export async function rechazarOferta(ofertaId, clienteId) {
  // Verificar que el cliente sea dueño de la solicitud
  const { data: oferta } = await supabase
    .from('ofertas')
    .select(`
      id, estado,
      solicitud:solicitudes!ofertas_solicitud_id_fkey ( cliente_id )
    `)
    .eq('id', ofertaId)
    .single();

  if (!oferta) throw new Error('Oferta no encontrada');
  if (oferta.solicitud.cliente_id !== clienteId) throw new Error('No autorizado');
  if (oferta.estado !== 'PENDIENTE') throw new Error('Solo se pueden rechazar ofertas pendientes');

  const { data, error } = await supabase
    .from('ofertas')
    .update({ estado: 'RECHAZADA' })
    .eq('id', ofertaId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── REALTIME ─────────────────────────────────────────────────────────────────

/**
 * El proveedor escucha actualizaciones de estado de su oferta en tiempo real.
 *
 * @param {number} ofertaId
 * @param {Function} onCambio - Callback con los cambios de la oferta
 * @returns {Function} - Función para desuscribirse
 */
export function suscribirAEstadoOferta(ofertaId, onCambio) {
  const channel = supabase
    .channel(`oferta-${ofertaId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ofertas',
        filter: `id=eq.${ofertaId}`,
      },
      (payload) => onCambio(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
