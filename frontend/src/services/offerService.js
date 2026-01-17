import { apiClient } from './apiClient';
import { API_CONFIG, OFFER_STATES } from '../config/apiConfig';

/**
 * SERVICIO DE OFERTAS
 * Proveedores responden a solicitudes con ofertas (modelo inDriver)
 */
export class OfferService {

  /**
   * Enviar oferta a una solicitud (Proveedor)
   */
  async createOffer(offerData) {
    try {
      const ofertaData = {
        solicitudId: offerData.requestId,
        precio: parseFloat(offerData.price),
        duracionEstimada: offerData.estimatedDuration,
        mensaje: offerData.message || '',
        fechaInicioEstimada: offerData.estimatedStartDate,
        horaInicioEstimada: offerData.estimatedStartTime,
        incluyeTransporte: offerData.includesTransport || false,
        incluyeMateriales: offerData.includesMaterials || false,
        garantiaDias: offerData.warrantyDays || 0,
      };

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.OFFERS.CREATE,
        ofertaData
      );

      return {
        success: true,
        offer: this.mapOfferFromBackend(response),
      };

    } catch (error) {
      console.error('Create offer error:', error);
      
      if (error.isValidationError) {
        throw new Error(error.data?.message || 'Datos de oferta inválidos');
      }
      
      if (error.status === 409) {
        throw new Error('Ya has enviado una oferta para esta solicitud');
      }
      
      throw new Error('Error al enviar oferta');
    }
  }

  /**
   * Obtener detalle de oferta
   */
  async getOffer(offerId) {
    try {
      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.OFFERS.GET(offerId)
      );

      return {
        success: true,
        offer: this.mapOfferFromBackend(response),
      };

    } catch (error) {
      console.error('Get offer error:', error);
      
      if (error.isNotFound) {
        throw new Error('Oferta no encontrada');
      }
      
      throw new Error('Error al obtener oferta');
    }
  }

  /**
   * Obtener mis ofertas (Proveedor)
   */
  async getMyOffers(status = null, page = 0, size = 20) {
    try {
      const params = {
        page,
        size,
      };

      if (status) {
        params.estado = status;
      }

      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.OFFERS.MY_OFFERS,
        params
      );

      const offers = Array.isArray(response) 
        ? response.map(offer => this.mapOfferFromBackend(offer))
        : response.content?.map(offer => this.mapOfferFromBackend(offer)) || [];

      return {
        success: true,
        offers,
        totalElements: response.totalElements || offers.length,
        totalPages: response.totalPages || 1,
        currentPage: response.number || 0,
      };

    } catch (error) {
      console.error('Get my offers error:', error);
      throw new Error('Error al obtener mis ofertas');
    }
  }

  /**
   * Obtener ofertas por solicitud (Cliente)
   */
  async getOffersByRequest(requestId) {
    try {
      const response = await apiClient.get(
        API_CONFIG.ENDPOINTS.OFFERS.BY_REQUEST(requestId)
      );

      const offers = Array.isArray(response) 
        ? response.map(offer => this.mapOfferFromBackend(offer))
        : [];

      return {
        success: true,
        offers,
      };

    } catch (error) {
      console.error('Get offers by request error:', error);
      throw new Error('Error al obtener ofertas de la solicitud');
    }
  }

  /**
   * Aceptar oferta (Cliente)
   */
  async acceptOffer(offerId) {
    try {
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.OFFERS.ACCEPT(offerId)
      );

      return {
        success: true,
        service: response.servicioCreado ? {
          id: response.servicioCreado.id,
          status: response.servicioCreado.estado,
          providerId: response.servicioCreado.proveedorId,
          scheduledDate: response.servicioCreado.fechaProgramada,
        } : null,
      };

    } catch (error) {
      console.error('Accept offer error:', error);
      
      if (error.isNotFound) {
        throw new Error('Oferta no encontrada');
      }
      
      if (error.isForbidden) {
        throw new Error('No puedes aceptar esta oferta');
      }
      
      if (error.status === 409) {
        throw new Error('Esta oferta ya no está disponible');
      }
      
      throw new Error('Error al aceptar oferta');
    }
  }

  /**
   * Rechazar oferta (Cliente)
   */
  async rejectOffer(offerId, reason = '') {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.OFFERS.REJECT(offerId), {
        motivo: reason,
      });

      return { success: true };

    } catch (error) {
      console.error('Reject offer error:', error);
      
      if (error.isNotFound) {
        throw new Error('Oferta no encontrada');
      }
      
      if (error.isForbidden) {
        throw new Error('No puedes rechazar esta oferta');
      }
      
      throw new Error('Error al rechazar oferta');
    }
  }

  /**
   * Retirar oferta (Proveedor)
   */
  async withdrawOffer(offerId) {
    try {
      await apiClient.delete(`/ofertas/${offerId}`);
      
      return { success: true };

    } catch (error) {
      console.error('Withdraw offer error:', error);
      
      if (error.isNotFound) {
        throw new Error('Oferta no encontrada');
      }
      
      if (error.isForbidden) {
        throw new Error('No puedes retirar esta oferta');
      }
      
      throw new Error('Error al retirar oferta');
    }
  }

  /**
   * Actualizar oferta (Proveedor)
   */
  async updateOffer(offerId, updateData) {
    try {
      const response = await apiClient.put(`/ofertas/${offerId}`, updateData);

      return {
        success: true,
        offer: this.mapOfferFromBackend(response),
      };

    } catch (error) {
      console.error('Update offer error:', error);
      
      if (error.isNotFound) {
        throw new Error('Oferta no encontrada');
      }
      
      if (error.isForbidden) {
        throw new Error('No puedes actualizar esta oferta');
      }
      
      if (error.status === 409) {
        throw new Error('No se puede actualizar esta oferta');
      }
      
      throw new Error('Error al actualizar oferta');
    }
  }

  /**
   * Mapear datos de oferta del backend al frontend
   */
  mapOfferFromBackend(backendOffer) {
    return {
      id: backendOffer.id,
      requestId: backendOffer.solicitudId,
      providerId: backendOffer.proveedorId,
      
      // Proveedor
      provider: backendOffer.proveedor ? {
        id: backendOffer.proveedor.id,
        name: `${backendOffer.proveedor.nombre} ${backendOffer.proveedor.apellido}`,
        email: backendOffer.proveedor.email,
        phone: backendOffer.proveedor.telefono,
        photo: backendOffer.proveedor.fotoPerfil,
        rating: parseFloat(backendOffer.proveedor.calificacionPromedio || 0),
        completedServices: backendOffer.proveedor.serviciosCompletados || 0,
        experienceYears: backendOffer.proveedor.experienciaAnos || 0,
        description: backendOffer.proveedor.descripcion,
      } : null,
      
      // Solicitud
      request: backendOffer.solicitud ? {
        id: backendOffer.solicitud.id,
        title: backendOffer.solicitud.titulo,
        cleaningType: backendOffer.solicitud.tipoLimpieza,
        address: backendOffer.solicitud.direccion,
        serviceDate: backendOffer.solicitud.fechaServicio,
        startTime: backendOffer.solicitud.horaInicio,
      } : null,
      
      // Detalles de la oferta
      price: parseFloat(backendOffer.precio),
      estimatedDuration: backendOffer.duracionEstimada,
      message: backendOffer.mensaje,
      estimatedStartDate: backendOffer.fechaInicioEstimada,
      estimatedStartTime: backendOffer.horaInicioEstimada,
      
      // Incluidos
      includesTransport: backendOffer.incluyeTransporte || false,
      includesMaterials: backendOffer.incluyeMateriales || false,
      warrantyDays: backendOffer.garantiaDias || 0,
      
      // Estado
      status: backendOffer.estado,
      statusLabel: this.getStatusLabel(backendOffer.estado),
      
      // Timestamps
      createdAt: backendOffer.fechaCreacion,
      updatedAt: backendOffer.fechaActualizacion,
      expiresAt: backendOffer.fechaExpiracion,
      viewedAt: backendOffer.fechaVisualizacion,
      respondedAt: backendOffer.fechaRespuesta,
    };
  }

  /**
   * Obtener label para estado de oferta
   */
  getStatusLabel(status) {
    const labels = {
      [OFFER_STATES.ENVIADA]: 'Enviada',
      [OFFER_STATES.VISTA]: 'Vista',
      [OFFER_STATES.ACEPTADA]: 'Aceptada',
      [OFFER_STATES.RECHAZADA]: 'Rechazada',
      [OFFER_STATES.EXPIRADA]: 'Expirada',
    };
    
    return labels[status] || status;
  }

  /**
   * Verificar si una oferta puede editarse
   */
  canEditOffer(offer) {
    return [OFFER_STATES.ENVIADA, OFFER_STATES.VISTA].includes(offer.status);
  }

  /**
   * Verificar si una oferta puede retirarse
   */
  canWithdrawOffer(offer) {
    return [OFFER_STATES.ENVIADA, OFFER_STATES.VISTA].includes(offer.status);
  }

  /**
   * Verificar si una oferta puede aceptarse/rechazarse
   */
  canRespondToOffer(offer) {
    return [OFFER_STATES.ENVIADA, OFFER_STATES.VISTA].includes(offer.status);
  }

  /**
   * Calcular precio promedio de ofertas
   */
  getAveragePrice(offers) {
    if (!offers || offers.length === 0) return 0;
    
    const total = offers.reduce((sum, offer) => sum + offer.price, 0);
    return total / offers.length;
  }

  /**
   * Obtener oferta con mejor precio
   */
  getBestOffer(offers) {
    if (!offers || offers.length === 0) return null;
    
    return offers.reduce((best, current) => {
      if (!best) return current;
      
      // Considerar precio, calificación del proveedor y experiencia
      const bestScore = (best.provider.rating * 2) + best.provider.experienceYears - (best.price / 10000);
      const currentScore = (current.provider.rating * 2) + current.provider.experienceYears - (current.price / 10000);
      
      return currentScore > bestScore ? current : best;
    }, null);
  }

  /**
   * Filtrar ofertas por criterio
   */
  filterOffers(offers, criteria) {
    if (!offers || offers.length === 0) return [];
    
    let filtered = [...offers];
    
    if (criteria.maxPrice) {
      filtered = filtered.filter(offer => offer.price <= criteria.maxPrice);
    }
    
    if (criteria.minRating) {
      filtered = filtered.filter(offer => offer.provider.rating >= criteria.minRating);
    }
    
    if (criteria.minExperience) {
      filtered = filtered.filter(offer => offer.provider.experienceYears >= criteria.minExperience);
    }
    
    return filtered;
  }

  /**
   * Ordenar ofertas por criterio
   */
  sortOffers(offers, sortBy = 'best') {
    if (!offers || offers.length === 0) return [];
    
    const sorted = [...offers];
    
    switch (sortBy) {
      case 'price_low':
        return sorted.sort((a, b) => a.price - b.price);
      
      case 'price_high':
        return sorted.sort((a, b) => b.price - a.price);
      
      case 'rating':
        return sorted.sort((a, b) => b.provider.rating - a.provider.rating);
      
      case 'experience':
        return sorted.sort((a, b) => b.provider.experienceYears - a.provider.experienceYears);
      
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      case 'best':
      default:
        return sorted.sort((a, b) => {
          const scoreA = (a.provider.rating * 2) + a.provider.experienceYears - (a.price / 10000);
          const scoreB = (b.provider.rating * 2) + b.provider.experienceYears - (b.price / 10000);
          return scoreB - scoreA;
        });
    }
  }
}

// Instancia singleton
export const offerService = new OfferService();
export default offerService;