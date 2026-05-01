/**
 * Tipos de base de datos — Supabase Homecare
 * Refleja exactamente el schema SQL de Supabase (v2.0)
 * Usar como referencia para supabase-js queries.
 */

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export type RolNombre = 'CUSTOMER' | 'SERVICE_PROVIDER' | 'ADMIN';

export type EstadoSolicitud =
  | 'ABIERTA'
  | 'EN_NEGOCIACION'
  | 'ACEPTADA'
  | 'EN_PROGRESO'
  | 'COMPLETADA'
  | 'CANCELADA';

export type EstadoOferta = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'RETIRADA';

export type EstadoServicio =
  | 'CONFIRMADO'
  | 'EN_CAMINO'
  | 'LLEGUE'
  | 'EN_PROGRESO'
  | 'COMPLETADO'
  | 'CANCELADO';

export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'REEMBOLSADO';

export type TipoLimpieza = 'BASICA' | 'PROFUNDA' | 'OFICINA' | 'POST_CONSTRUCCION';

export type MetodoPago = 'PSE' | 'TARJETA_CREDITO' | 'TARJETA_DEBITO' | 'NEQUI';

// ─── TABLAS ───────────────────────────────────────────────────────────────────

/** Tabla: public.roles */
export interface Rol {
  id: number;
  nombre: RolNombre;
  descripcion: string | null;
  created_at: string;
}

/** Tabla: public.usuarios — UUID vinculado a auth.users */
export interface Usuario {
  id: string; // UUID = auth.users.id
  email: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  foto_perfil: string | null;
  documento_identidad: string | null;
  descripcion: string | null;
  experiencia_anos: number;
  servicios_completados: number;
  calificacion_promedio: number;
  latitud: number | null;
  longitud: number | null;
  direccion: string | null;
  activo: boolean;
  verificado: boolean;
  disponible: boolean;
  created_at: string;
  updated_at: string;
}

/** Tabla: public.usuario_roles (Many-to-Many) */
export interface UsuarioRol {
  usuario_id: string; // UUID
  rol_id: number;
}

/** Tabla: public.solicitudes */
export interface Solicitud {
  id: number;
  cliente_id: string; // UUID
  titulo: string;
  descripcion: string;
  tipo_limpieza: TipoLimpieza;
  direccion: string;
  latitud: number;
  longitud: number;
  referencia_direccion: string | null;
  metros_cuadrados: number | null;
  cantidad_habitaciones: number | null;
  cantidad_banos: number | null;
  tiene_mascotas: boolean;
  precio_maximo: number | null;
  fecha_servicio: string; // DATE
  hora_inicio: string;    // TIME
  duracion_estimada: number | null;
  estado: EstadoSolicitud;
  cantidad_ofertas: number;
  oferta_aceptada_id: number | null;
  created_at: string;
  updated_at: string;
  expira_en: string | null;
}

/** Tabla: public.ofertas */
export interface Oferta {
  id: number;
  solicitud_id: number;
  proveedor_id: string; // UUID
  precio_ofrecido: number;
  mensaje_oferta: string | null;
  tiempo_llegada_minutos: number | null;
  materiales_incluidos: boolean;
  estado: EstadoOferta;
  vista_por_cliente: boolean;
  created_at: string;
  updated_at: string;
}

/** Tabla: public.servicios_aceptados */
export interface ServicioAceptado {
  id: number;
  solicitud_id: number;
  oferta_id: number;
  cliente_id: string; // UUID
  proveedor_id: string; // UUID
  precio_acordado: number;
  estado: EstadoServicio;
  confirmado_at: string;
  en_camino_at: string | null;
  llegue_at: string | null;
  iniciado_at: string | null;
  completado_at: string | null;
  cancelado_at: string | null;
  motivo_cancelacion: string | null;
  fotos_antes: string[] | null;
  fotos_despues: string[] | null;
  created_at: string;
  updated_at: string;
}

/** Tabla: public.mensajes */
export interface Mensaje {
  id: number;
  solicitud_id: number;
  remitente_id: string; // UUID
  destinatario_id: string; // UUID
  contenido: string;
  leido: boolean;
  created_at: string;
}

/** Tabla: public.pagos */
export interface Pago {
  id: number;
  servicio_id: number;
  cliente_id: string; // UUID
  proveedor_id: string; // UUID
  monto_total: number;
  comision_plataforma: number;
  monto_proveedor: number;
  estado: EstadoPago;
  metodo_pago: MetodoPago | null;
  created_at: string;
  updated_at: string;
}

// ─── TIPOS EXTENDIDOS (con joins) ────────────────────────────────────────────

/** Solicitud con datos del cliente */
export interface SolicitudConCliente extends Solicitud {
  cliente: Pick<Usuario, 'id' | 'nombre' | 'apellido' | 'foto_perfil' | 'calificacion_promedio'>;
}

/** Oferta con datos del proveedor */
export interface OfertaConProveedor extends Oferta {
  proveedor: Pick<Usuario, 'id' | 'nombre' | 'apellido' | 'foto_perfil' | 'calificacion_promedio' | 'experiencia_anos'>;
}

/** Servicio aceptado con todos los datos relacionados */
export interface ServicioCompleto extends ServicioAceptado {
  solicitud: Solicitud;
  oferta: Oferta;
  cliente: Pick<Usuario, 'id' | 'nombre' | 'apellido' | 'foto_perfil'>;
  proveedor: Pick<Usuario, 'id' | 'nombre' | 'apellido' | 'foto_perfil' | 'calificacion_promedio'>;
}

// ─── DTOs (Input types) ───────────────────────────────────────────────────────

export interface CrearSolicitudDTO {
  titulo: string;
  descripcion: string;
  tipo_limpieza: TipoLimpieza;
  direccion: string;
  latitud: number;
  longitud: number;
  referencia_direccion?: string;
  metros_cuadrados?: number;
  cantidad_habitaciones?: number;
  cantidad_banos?: number;
  tiene_mascotas?: boolean;
  precio_maximo?: number;
  fecha_servicio: string;
  hora_inicio: string;
  duracion_estimada?: number;
}

export interface CrearOfertaDTO {
  solicitud_id: number;
  precio_ofrecido: number;
  mensaje_oferta?: string;
  tiempo_llegada_minutos?: number;
  materiales_incluidos?: boolean;
}

export interface RegisterDTO {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: RolNombre;
  telefono?: string;
}
