/**
 * HomeCare Colorimetría — Global Type Definitions
 * DTOs and Frontend Interface contracts for React Native Mobile Application
 */

export type UserRole = 'ROLE_CUSTOMER' | 'ROLE_SERVICE_PROVIDER' | 'ROLE_ADMIN';

export type RequestCleaningType =
  | 'BASICA'
  | 'PROFUNDA'
  | 'OFICINA'
  | 'POST_CONSTRUCCION'
  | 'MUDANZA'
  | 'DESINFECCION'
  | 'HORAS';

export type RequestStatus =
  | 'ABIERTA'
  | 'EN_NEGOCIACION'
  | 'ACEPTADA'
  | 'EN_PROGRESO'
  | 'COMPLETADA'
  | 'CANCELADA';

export type OfferStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'RETIRADA';

export type ServiceOrderStatus =
  | 'CONFIRMADO'
  | 'EN_CAMINO'
  | 'LLEGUE'
  | 'EN_PROGRESO'
  | 'COMPLETADO'
  | 'CANCELADO';

export type PaymentState = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'REEMBOLSADO' | 'CANCELADO';

export interface SolicitudModel {
  id: number;
  clienteId: number;
  clienteNombre?: string;
  clienteFoto?: string;
  tipoLimpieza: RequestCleaningType;
  descripcion?: string;
  direccion: string;
  latitud: number;
  longitud: number;
  precioMaximoPropuesto?: number;
  fechaServicio: string;
  horaServicio: string;
  duracionEstimadaHoras?: number;
  estado: RequestStatus;
  cantidadOfertas: number;
  createdAt: string;
  expiraEn?: string;
}

export interface OfertaModel {
  id: number;
  solicitudId: number;
  proveedorId: number;
  proveedorNombre: string;
  proveedorFoto?: string;
  proveedorCalificacion?: number;
  proveedorServiciosCompletados?: number;
  proveedorPushToken?: string;
  precioOfrecido: number;
  mensajeOferta?: string;
  tiempoLlegadaMinutos?: number;
  materialesIncluidos: boolean;
  distanciaKm?: number;
  estado: OfferStatus;
  createdAt: string;
}

export interface MercadoPagoPreferenceResponse {
  pagoId: number;
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
  monto: number;
  moneda: string;
  estado: PaymentState;
  estadoRetencion: 'RETENIDO' | 'LIBERADO' | 'REEMBOLSADO';
}

export interface TrackingLocationUpdate {
  serviceId: number;
  proveedorId: number;
  latitud: number;
  longitud: number;
  heading?: number;
  velocidad?: number;
  timestamp: string;
}

export interface ChatMessageItem {
  id: string;
  solicitudId: number | string;
  remitenteId: string | number;
  contenido: string;
  tipo: 'TEXTO' | 'IMAGEN' | 'SISTEMA';
  archivoUrl?: string;
  timestamp: any;
  leido?: boolean;
}
