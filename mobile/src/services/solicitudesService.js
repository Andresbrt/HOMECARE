/**
 * solicitudesService.js
 * Gestión de solicitudes de limpieza.
 * Modelo inDriver: el cliente publica → proveedores ofertan.
 */

import { supabase } from '../config/supabase';

// ─── CREAR SOLICITUD ──────────────────────────────────────────────────────────

/**
 * Publica una nueva solicitud de limpieza.
 * Solo disponible para usuarios con rol CUSTOMER.
 *
 * @param {string} clienteId - UUID del cliente (auth.uid)
 * @param {import('../types/database.types').CrearSolicitudDTO} dto
 */
export async function crearSolicitud(clienteId, dto) {
  // Validar que el proveedor no publique solicitudes (via RLS en Supabase también)
  const { data, error } = await supabase
    .from('solicitudes')
    .insert({
      cliente_id: clienteId,
      ...dto,
      estado: 'ABIERTA',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── LISTAR SOLICITUDES ───────────────────────────────────────────────────────

/**
 * Lista solicitudes ABIERTAS cercanas a una ubicación (para proveedores).
 * Ordenadas por fecha de creación descendente.
 *
 * @param {{ latitud: number, longitud: number, radioKm?: number }} opciones
 */
export async function listarSolicitudesAbiertas({ latitud, longitud, radioKm = 20 } = {}) {
  let query = supabase
    .from('solicitudes')
    .select(`
      *,
      cliente:usuarios!solicitudes_cliente_id_fkey (
        id, nombre, apellido, foto_perfil, calificacion_promedio
      )
    `)
    .eq('estado', 'ABIERTA')
    .order('created_at', { ascending: false });

  // Filtro geográfico aproximado usando bounding box
  if (latitud && longitud && radioKm) {
    const delta = radioKm / 111; // ~111 km por grado
    query = query
      .gte('latitud', latitud - delta)
      .lte('latitud', latitud + delta)
      .gte('longitud', longitud - delta)
      .lte('longitud', longitud + delta);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Obtiene las solicitudes del cliente autenticado.
 *
 * @param {string} clienteId - UUID del cliente
 */
export async function getMisSolicitudes(clienteId) {
  const { data, error } = await supabase
    .from('solicitudes')
    .select(`
      *,
      ofertas (
        id, precio_ofrecido, estado,
        proveedor:usuarios!ofertas_proveedor_id_fkey (
          id, nombre, apellido, foto_perfil, calificacion_promedio
        )
      )
    `)
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Obtiene una solicitud específica por ID con todas sus ofertas.
 *
 * @param {number} solicitudId
 */
export async function getSolicitudById(solicitudId) {
  const { data, error } = await supabase
    .from('solicitudes')
    .select(`
      *,
      cliente:usuarios!solicitudes_cliente_id_fkey (
        id, nombre, apellido, foto_perfil, calificacion_promedio, telefono
      ),
      ofertas (
        *,
        proveedor:usuarios!ofertas_proveedor_id_fkey (
          id, nombre, apellido, foto_perfil, calificacion_promedio, experiencia_anos
        )
      )
    `)
    .eq('id', solicitudId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── ACTUALIZAR SOLICITUD ─────────────────────────────────────────────────────

/**
 * Actualiza el estado de una solicitud.
 * Solo el cliente dueño puede cambiar el estado.
 *
 * @param {number} solicitudId
 * @param {import('../types/database.types').EstadoSolicitud} nuevoEstado
 */
export async function actualizarEstadoSolicitud(solicitudId, nuevoEstado) {
  const { data, error } = await supabase
    .from('solicitudes')
    .update({ estado: nuevoEstado })
    .eq('id', solicitudId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Cancela una solicitud.
 * Solo permitido si la solicitud está ABIERTA o EN_NEGOCIACION.
 *
 * @param {number} solicitudId
 * @param {string} clienteId - UUID para validación extra
 */
export async function cancelarSolicitud(solicitudId, clienteId) {
  const { data: solicitud } = await supabase
    .from('solicitudes')
    .select('estado, cliente_id')
    .eq('id', solicitudId)
    .single();

  if (!solicitud) throw new Error('Solicitud no encontrada');
  if (solicitud.cliente_id !== clienteId) throw new Error('No autorizado');
  if (!['ABIERTA', 'EN_NEGOCIACION'].includes(solicitud.estado)) {
    throw new Error('Solo se pueden cancelar solicitudes ABIERTAS o EN_NEGOCIACION');
  }

  return actualizarEstadoSolicitud(solicitudId, 'CANCELADA');
}

// ─── REALTIME ─────────────────────────────────────────────────────────────────

/**
 * Suscribe a cambios en tiempo real de una solicitud.
 * Útil para que el cliente vea nuevas ofertas en vivo.
 *
 * @param {number} solicitudId
 * @param {Function} onOfertaNueva - Callback con la nueva oferta
 * @returns {Function} - Función para desuscribirse
 */
export function suscribirAOfertas(solicitudId, onOfertaNueva) {
  const channel = supabase
    .channel(`solicitud-${solicitudId}-ofertas`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ofertas',
        filter: `solicitud_id=eq.${solicitudId}`,
      },
      (payload) => onOfertaNueva(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
