import { apiClient } from './apiClient';
import { API_CONFIG, REQUEST_STATES, CLEANING_TYPES } from '../config/apiConfig';

/**
 * SERVICIO DE SOLICITUDES
 * Maneja el modelo inDriver donde clientes publican solicitudes
 * y proveedores envían ofertas
 */
export class RequestService {

  /**
   * Crear nueva solicitud (Cliente)
   */
  async createRequest(requestData) {
    try {
      // Mapear datos del frontend al backend
      const solicitudData = {
        titulo: requestData.title,
        descripcion: requestData.description,
        tipoLimpieza: requestData.cleaningType,
        direccion: requestData.address,
        latitud: parseFloat(requestData.latitude),
        longitud: parseFloat(requestData.longitude),
        referenciaDireccion: requestData.addressReference,
        metrosCuadrados: requestData.squareMeters ? parseFloat(requestData.squareMeters) : null,
        cantidadHabitaciones: requestData.bedrooms || null,
        cantidadBanos: requestData.bathrooms || null,
        tieneMascotas: requestData.hasPets || false,
        precioMaximo: requestData.maxPrice ? parseFloat(requestData.maxPrice) : null,
        fechaServicio: requestData.serviceDate,
        horaInicio: requestData.startTime,
        duracionEstimada: requestData.estimatedDuration || null,
        instruccionesEspeciales: requestData.specialInstructions || null,
      };

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.REQUESTS.CREATE,
        solicitudData
      );

      return {
        success: true,
        request: this.mapRequestFromBackend(response),
      };

    } catch (error) {
      console.error('Create request error:', error);
      
      if (error.isValidationError) {
        throw new Error(error.data?.message || 'Datos inválidos');
      }
      
      throw new Error('Error al crear solicitud');
    }
  }

  /**
   * Actualizar solicitud existente (Cliente)
   */
  async updateRequest(requestId, updateData) {
    try {
      const response = await apiClient.put(
        API_CONFIG.ENDPOINTS.REQUESTS.UPDATE(requestId),
        updateData
      );

      return {
        success: true,
        request: this.mapRequestFromBackend(response),
      };

    } catch (error) {
      console.error('Update request error:', error);
      
      if (error.isNotFound) {
        throw new Error('Solicitud no encontrada');
      }
      
      if (error.isForbidden) {
        throw new Error('No tienes permisos para editar esta solicitud');
      }
      
      throw new Error('Error al actualizar solicitud');
    }
  }

  /**
   * Cancelar solicitud (Cliente)
   */
  async cancelRequest(requestId, reason) {
    try {
      await apiClient.delete(
        API_CONFIG.ENDPOINTS.REQUESTS.DELETE(requestId),
        { motivo: reason }
      );

      return { success: true };

    } catch (error) {
      console.error('Cancel request error:', error);
      
      if (error.isNotFound) {
        throw new Error('Solicitud no encontrada');
      }
      
      if (error.isForbidden) {
        throw new Error('No se puede cancelar esta solicitud');
      }
      
      throw new Error('Error al cancelar solicitud');
    }
  }

  /**
   * Obtener detalle de solicitud
   */
  async getRequest(requestId) {
    try {
      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.REQUESTS.GET(requestId)
      );

      return {
        success: true,
        request: this.mapRequestDetailFromBackend(response),
      };

    } catch (error) {
      console.error('Get request error:', error);
      
      if (error.isNotFound) {
        throw new Error('Solicitud no encontrada');
      }
      
      throw new Error('Error al obtener solicitud');
    }
  }

  /**
   * Obtener mis solicitudes (Cliente)
   */
  async getMyRequests(status = null, page = 0, size = 20) {
    try {
      const params = {
        page,
        size,
      };

      if (status) {
        params.estado = status;
      }

      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.REQUESTS.MY_REQUESTS,
        params
      );

      const requests = Array.isArray(response) 
        ? response.map(req => this.mapRequestFromBackend(req))
        : response.content?.map(req => this.mapRequestFromBackend(req)) || [];

      return {
        success: true,
        requests,
        totalElements: response.totalElements || requests.length,
        totalPages: response.totalPages || 1,
        currentPage: response.number || 0,
      };

    } catch (error) {
      console.error('Get my requests error:', error);
      throw new Error('Error al obtener mis solicitudes');
    }
  }

  /**
   * Buscar solicitudes cercanas (Proveedor)
   */
  async getNearbyRequests(latitude, longitude, radiusKm = 10, page = 0, size = 20) {
    try {
      const params = {
        latitud: parseFloat(latitude),
        longitud: parseFloat(longitude),
        radio: radiusKm,
        page,
        size,
      };

      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.REQUESTS.NEARBY,
        params
      );

      const requests = Array.isArray(response) 
        ? response.map(req => this.mapRequestFromBackend(req))
        : response.content?.map(req => this.mapRequestFromBackend(req)) || [];

      return {
        success: true,
        requests,
        totalElements: response.totalElements || requests.length,
        totalPages: response.totalPages || 1,
        currentPage: response.number || 0,
      };

    } catch (error) {
      console.error('Get nearby requests error:', error);
      throw new Error('Error al buscar solicitudes cercanas');
    }
  }

  /**
   * Buscar solicitudes con filtros
   */
  async searchRequests(filters = {}, page = 0, size = 20) {
    try {
      const params = {
        page,
        size,
        ...filters,
      };

      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.REQUESTS.SEARCH,
        params
      );

      const requests = Array.isArray(response) 
        ? response.map(req => this.mapRequestFromBackend(req))
        : response.content?.map(req => this.mapRequestFromBackend(req)) || [];

      return {
        success: true,
        requests,
        totalElements: response.totalElements || requests.length,
        totalPages: response.totalPages || 1,
        currentPage: response.number || 0,
      };

    } catch (error) {
      console.error('Search requests error:', error);
      throw new Error('Error al buscar solicitudes');
    }
  }

  /**
   * Obtener solicitudes activas del usuario
   */
  async getActiveRequests() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.REQUESTS.ACTIVE);

      const requests = Array.isArray(response) 
        ? response.map(req => this.mapRequestFromBackend(req))
        : [];

      return {
        success: true,
        requests,
      };

    } catch (error) {
      console.error('Get active requests error:', error);
      throw new Error('Error al obtener solicitudes activas');
    }
  }

  /**
   * Mapear datos de solicitud del backend al frontend
   */
  mapRequestFromBackend(backendRequest) {
    return {
      id: backendRequest.id,
      title: backendRequest.titulo,
      description: backendRequest.descripcion,
      cleaningType: backendRequest.tipoLimpieza,
      cleaningTypeLabel: this.getCleaningTypeLabel(backendRequest.tipoLimpieza),
      
      // Ubicación
      address: backendRequest.direccion,
      latitude: parseFloat(backendRequest.latitud),
      longitude: parseFloat(backendRequest.longitud),
      addressReference: backendRequest.referenciaDireccion,
      
      // Detalles del lugar
      squareMeters: backendRequest.metrosCuadrados ? parseFloat(backendRequest.metrosCuadrados) : null,
      bedrooms: backendRequest.cantidadHabitaciones,
      bathrooms: backendRequest.cantidadBanos,
      hasPets: backendRequest.tieneMascotas,
      
      // Precio y timing
      maxPrice: backendRequest.precioMaximo ? parseFloat(backendRequest.precioMaximo) : null,
      serviceDate: backendRequest.fechaServicio,
      startTime: backendRequest.horaInicio,
      estimatedDuration: backendRequest.duracionEstimada,
      specialInstructions: backendRequest.instruccionesEspeciales,
      
      // Estado
      status: backendRequest.estado,
      statusLabel: this.getStatusLabel(backendRequest.estado),
      
      // Métricas
      offersCount: backendRequest.cantidadOfertas || 0,
      acceptedOfferId: backendRequest.ofertaAceptadaId,
      
      // Cliente
      client: backendRequest.cliente ? {
        id: backendRequest.cliente.id,
        name: `${backendRequest.cliente.nombre} ${backendRequest.cliente.apellido}`,
        email: backendRequest.cliente.email,
        phone: backendRequest.cliente.telefono,
        photo: backendRequest.cliente.fotoPerfil,
        rating: parseFloat(backendRequest.cliente.calificacionPromedio || 0),
      } : null,
      
      // Timestamps
      createdAt: backendRequest.fechaCreacion,
      updatedAt: backendRequest.fechaActualizacion,
      expiresAt: backendRequest.fechaExpiracion,
    };
  }

  /**
   * Mapear detalle de solicitud del backend
   */
  mapRequestDetailFromBackend(backendDetail) {
    return {
      ...this.mapRequestFromBackend(backendDetail),
      
      // Información adicional del detalle
      offers: backendDetail.ofertas ? backendDetail.ofertas.map(offer => ({
        id: offer.id,
        providerId: offer.proveedorId,
        providerName: offer.proveedorNombre,
        providerPhoto: offer.proveedorFoto,
        providerRating: parseFloat(offer.proveedorCalificacion || 0),
        price: parseFloat(offer.precio),
        estimatedDuration: offer.duracionEstimada,
        message: offer.mensaje,
        status: offer.estado,
        createdAt: offer.fechaCreacion,
      })) : [],
      
      activeService: backendDetail.servicioActivo ? {
        id: backendDetail.servicioActivo.id,
        status: backendDetail.servicioActivo.estado,
        providerId: backendDetail.servicioActivo.proveedorId,
        startedAt: backendDetail.servicioActivo.fechaInicio,
      } : null,
    };
  }

  /**
   * Obtener label para tipo de limpieza
   */
  getCleaningTypeLabel(type) {
    const labels = {
      [CLEANING_TYPES.BASICA]: 'Limpieza Básica',
      [CLEANING_TYPES.PROFUNDA]: 'Limpieza Profunda', 
      [CLEANING_TYPES.OFICINA]: 'Limpieza de Oficina',
      [CLEANING_TYPES.POST_CONSTRUCCION]: 'Post-Construcción',
      [CLEANING_TYPES.MANTENIMIENTO]: 'Mantenimiento',
      [CLEANING_TYPES.ESPECIALIZADA]: 'Limpieza Especializada',
    };
    
    return labels[type] || type;
  }

  /**
   * Obtener label para estado de solicitud
   */
  getStatusLabel(status) {
    const labels = {
      [REQUEST_STATES.ABIERTA]: 'Abierta',
      [REQUEST_STATES.CON_OFERTAS]: 'Con Ofertas',
      [REQUEST_STATES.OFERTA_ACEPTADA]: 'Oferta Aceptada',
      [REQUEST_STATES.EN_PROGRESO]: 'En Progreso',
      [REQUEST_STATES.COMPLETADA]: 'Completada',
      [REQUEST_STATES.CANCELADA]: 'Cancelada',
      [REQUEST_STATES.EXPIRADA]: 'Expirada',
    };
    
    return labels[status] || status;
  }

  /**
   * Verificar si una solicitud puede editarse
   */
  canEditRequest(request) {
    return [REQUEST_STATES.ABIERTA, REQUEST_STATES.CON_OFERTAS].includes(request.status);
  }

  /**
   * Verificar si una solicitud puede cancelarse
   */
  canCancelRequest(request) {
    return ![REQUEST_STATES.COMPLETADA, REQUEST_STATES.CANCELADA].includes(request.status);
  }
}

// Instancia singleton
export const requestService = new RequestService();
export default requestService;