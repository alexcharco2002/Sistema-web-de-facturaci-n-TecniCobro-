/**
 * src/services/affiliatesServices.js
 * Servicio de Gestión de Afiliados
 */

import authService from './authServices';

const API_CONFIG = {
  baseURL: 'https://localhost:8000',
  endpoints: {
    affiliates: '/affiliates',
    availableUsers: '/affiliates/available/users',
    toggleStatus: (id) => `/affiliates/${id}/toggle-status`,
    stats: '/affiliates/stats/count'
  }
};

class AffiliatesService {
  constructor() {
    this.cachedStats = null;
  }

  /**
   * Realizar petición HTTPS con configuración común
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.baseURL}${endpoint}`;

    const defaultOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`
      },
      timeout: 10000,
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    // ✅ Manejo correcto de FormData y JSON
    if (finalOptions.body instanceof FormData) {
      delete finalOptions.headers['Content-Type'];
    } else if (finalOptions.body && typeof finalOptions.body === 'object') {
      finalOptions.headers['Content-Type'] = 'application/json';
      finalOptions.body = JSON.stringify(finalOptions.body);
    }

    try {
      console.log(`🌐 API Request: ${finalOptions.method} ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalOptions.timeout);

      const response = await fetch(url, {
        ...finalOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = '';

        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = JSON.stringify(errorData.detail);
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`✅ API Response:`, data);
      return data;

    } catch (error) {
      console.error(`❌ API Error:`, error);

      if (error.name === 'AbortError') {
        throw new Error('La petición tardó demasiado tiempo');
      }

      if (error.message.includes('Failed to fetch')) {
        throw new Error('No se pudo conectar con el servidor');
      }

      throw error;
    }
  }

  /**
   * Obtener lista de afiliados con filtros opcionales
   */
  async getAffiliates(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.id_sector) params.append('id_sector', filters.id_sector);
      if (filters.activo !== undefined) params.append('activo', filters.activo);
      if (filters.skip) params.append('skip', filters.skip);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const endpoint = queryString 
        ? `${API_CONFIG.endpoints.affiliates}?${queryString}` 
        : API_CONFIG.endpoints.affiliates;

      const data = await this.makeRequest(endpoint);

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Error obteniendo afiliados:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener afiliados',
        data: []
      };
    }
  }

  /**
   * Obtener un afiliado específico por ID
   */
  async getAffiliateById(affiliateId) {
    try {
      const data = await this.makeRequest(`${API_CONFIG.endpoints.affiliates}/${affiliateId}`);

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Error obteniendo afiliado:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener afiliado'
      };
    }
  }

  /**
   * Obtener lista de usuarios disponibles para afiliar (no afiliados)
   */
  async getAvailableUsers(search = '') {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      const queryString = params.toString();
      const endpoint = queryString 
        ? `${API_CONFIG.endpoints.availableUsers}?${queryString}` 
        : API_CONFIG.endpoints.availableUsers;

      const data = await this.makeRequest(endpoint);

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Error obteniendo usuarios disponibles:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener usuarios disponibles',
        data: []
      };
    }
  }

  /**
   * Crear un nuevo afiliado
   */
  async createAffiliate(affiliateData) {
    try {
      this.validateAffiliateData(affiliateData);

      const data = await this.makeRequest(API_CONFIG.endpoints.affiliates, {
        method: 'POST',
        body: {
          id_usuario_sistema: affiliateData.id_usuario_sistema,
          id_sector: affiliateData.id_sector,
          activo: affiliateData.activo !== undefined ? affiliateData.activo : true
        }
      });

      return {
        success: true,
        data: data,
        message: 'Afiliado creado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error creando afiliado:', error);
      return {
        success: false,
        message: error.message || 'Error al crear afiliado'
      };
    }
  }

  /**
   * Actualizar un afiliado existente
   */
  async updateAffiliate(affiliateId, affiliateData) {
    if (!affiliateId || isNaN(affiliateId)) {
      throw new Error('ID de afiliado inválido o no definido');
    }

    try {
      const updateData = {};
      
      if (affiliateData.id_sector) updateData.id_sector = affiliateData.id_sector;
      if (affiliateData.activo !== undefined) updateData.activo = affiliateData.activo;

      const data = await this.makeRequest(`${API_CONFIG.endpoints.affiliates}/${affiliateId}`, {
        method: 'PUT',
        body: updateData
      });

      return {
        success: true,
        data: data,
        message: 'Afiliado actualizado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error actualizando afiliado:', error);
      return {
        success: false,
        message: error.message || 'Error al actualizar afiliado'
      };
    }
  }

  /**
   * Eliminar un afiliado
   */
  async deleteAffiliate(affiliateId) {
    try {
      const data = await this.makeRequest(`${API_CONFIG.endpoints.affiliates}/${affiliateId}`, {
        method: 'DELETE'
      });

      // Analiza la respuesta del backend
      if (data?.accion === 'eliminado') {
        return {
          success: true,
          message: `✅ El afiliado con código "${data.afiliado?.cod_usuario_afi || ''}" fue eliminado correctamente.`,
          data
        };
      }

      if (data?.accion === 'desactivado') {
        return {
          success: true,
          message: `⚠️ El afiliado con código "${data.afiliado?.cod_usuario_afi || ''}" no se pudo eliminar porque está relacionado con otros módulos, solo fue desactivado.`,
          data
        };
      }

      if (data?.success) {
        return {
          success: true,
          message: data.message || 'Operación completada correctamente.',
          data
        };
      }

      if (data?.detail) {
        return {
          success: false,
          message: data.detail
        };
      }

      return {
        success: false,
        message: 'No se pudo completar la operación.'
      };

    } catch (error) {
      console.error('❌ Error eliminando afiliado:', error);
      return {
        success: false,
        message: error.message || 'Error al eliminar afiliado'
      };
    }
  }

  /**
   * Cambiar estado de un afiliado (activo/inactivo)
   */
  async toggleAffiliateStatus(affiliateId) {
    try {
      const data = await this.makeRequest(API_CONFIG.endpoints.toggleStatus(affiliateId), {
        method: 'PATCH'
      });

      return {
        success: true,
        data: data,
        message: 'Estado del afiliado actualizado'
      };

    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      return {
        success: false,
        message: error.message || 'Error al cambiar estado del afiliado'
      };
    }
  }

  /**
   * Obtener estadísticas de afiliados
   */
  async getAffiliatesStats() {
    try {
      const data = await this.makeRequest(API_CONFIG.endpoints.stats);

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener estadísticas'
      };
    }
  }

  /**
   * Validar datos de afiliado
   */
  validateAffiliateData(affiliateData) {
    if (!affiliateData.id_usuario_sistema || typeof affiliateData.id_usuario_sistema !== 'number') {
      throw new Error('Debe seleccionar un usuario válido');
    }

    if (!affiliateData.id_sector || typeof affiliateData.id_sector !== 'number') {
      throw new Error('Debe seleccionar un sector válido');
    }
  }

  /**
   * Limpiar caché de estadísticas
   */
  clearStatsCache() {
    this.cachedStats = null;
  }
}

const affiliatesService = new AffiliatesService();

export default affiliatesService;
export { AffiliatesService };