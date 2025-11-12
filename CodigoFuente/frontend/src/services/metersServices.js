/**
 * src/services/metersServices.js
 * Servicio de Gestión de Medidores
 */

import authService from './authServices';

const API_CONFIG = {
  baseURL: 'https://localhost:8000',
  endpoints: {
    meters: '/meters',
    availableAffiliates: '/meters/available/affiliates',
    toggleStatus: (id) => `/meters/${id}/toggle-status`,
    stats: '/meters/stats/count'
  }
};

class MetersService {
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
   * Obtener lista de medidores con filtros opcionales
   */
  async getMeters(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.id_sector) params.append('id_sector', filters.id_sector);
      if (filters.activo !== undefined) params.append('activo', filters.activo);
      if (filters.asignado !== undefined) params.append('asignado', filters.asignado);
      if (filters.skip) params.append('skip', filters.skip);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const endpoint = queryString 
        ? `${API_CONFIG.endpoints.meters}?${queryString}` 
        : API_CONFIG.endpoints.meters;

      const data = await this.makeRequest(endpoint);

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Error obteniendo medidores:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener medidores',
        data: []
      };
    }
  }

  /**
   * Obtener un medidor específico por ID
   */
  async getMeterById(meterId) {
    try {
      const data = await this.makeRequest(`${API_CONFIG.endpoints.meters}/${meterId}`);

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Error obteniendo medidor:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener medidor'
      };
    }
  }

  /**
   * Obtener lista de afiliados disponibles (sin medidor asignado)
   */
  async getAvailableAffiliates(search = '') {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      const queryString = params.toString();
      const endpoint = queryString 
        ? `${API_CONFIG.endpoints.availableAffiliates}?${queryString}` 
        : API_CONFIG.endpoints.availableAffiliates;

      const data = await this.makeRequest(endpoint);

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Error obteniendo afiliados disponibles:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener afiliados disponibles',
        data: []
      };
    }
  }

  /**
   * Crear un nuevo medidor
   */
  async createMeter(meterData) {
    try {
      this.validateMeterData(meterData);

      const data = await this.makeRequest(API_CONFIG.endpoints.meters, {
        method: 'POST',
        body: {
          num_medidor: meterData.num_medidor,
          latitud: meterData.latitud,
          longitud: meterData.longitud,
          altitud: meterData.altitud,
          id_usuario_afi: meterData.id_usuario_afi,
          id_sector: meterData.id_sector,
          activo: meterData.activo !== undefined ? meterData.activo : true
        }
      });

      return {
        success: true,
        data: data,
        message: 'Medidor creado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error creando medidor:', error);
      return {
        success: false,
        message: error.message || 'Error al crear medidor'
      };
    }
  }

  /**
   * Actualizar un medidor existente
   */
  async updateMeter(meterId, meterData) {
    if (!meterId || isNaN(meterId)) {
      throw new Error('ID de medidor inválido o no definido');
    }

    try {
      const updateData = {
        num_medidor: meterData.num_medidor,
        latitud: meterData.latitud,
        longitud: meterData.longitud,
        altitud: meterData.altitud,
        id_usuario_afi: meterData.id_usuario_afi,
        id_sector: meterData.id_sector,
        activo: meterData.activo
      };

      const data = await this.makeRequest(`${API_CONFIG.endpoints.meters}/${meterId}`, {
        method: 'PUT',
        body: updateData
      });

      return {
        success: true,
        data: data,
        message: 'Medidor actualizado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error actualizando medidor:', error);
      return {
        success: false,
        message: error.message || 'Error al actualizar medidor'
      };
    }
  }

  /**
   * Eliminar un medidor
   */
  async deleteMeter(meterId) {
    try {
      const data = await this.makeRequest(`${API_CONFIG.endpoints.meters}/${meterId}`, {
        method: 'DELETE'
      });

      // Analiza la respuesta del backend
      if (data?.accion === 'eliminado') {
        return {
          success: true,
          message: `✅ El medidor "${data.medidor?.num_medidor || ''}" fue eliminado correctamente.`,
          data
        };
      }

      if (data?.accion === 'desactivado') {
        return {
          success: true,
          message: `⚠️ El medidor "${data.medidor?.num_medidor || ''}" no se pudo eliminar porque está relacionado con otros módulos, solo fue desactivado.`,
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
      console.error('❌ Error eliminando medidor:', error);
      return {
        success: false,
        message: error.message || 'Error al eliminar medidor'
      };
    }
  }

  /**
   * Cambiar estado de un medidor (activo/inactivo)
   */
  async toggleMeterStatus(meterId) {
    try {
      const data = await this.makeRequest(API_CONFIG.endpoints.toggleStatus(meterId), {
        method: 'PATCH'
      });

      return {
        success: true,
        data: data,
        message: 'Estado del medidor actualizado'
      };

    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      return {
        success: false,
        message: error.message || 'Error al cambiar estado del medidor'
      };
    }
  }

  /**
   * Obtener estadísticas de medidores
   */
  async getMetersStats() {
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
   * Validar datos de medidor
   */
  validateMeterData(meterData) {
    if (!meterData.num_medidor || typeof meterData.num_medidor !== 'string' || !meterData.num_medidor.trim()) {
      throw new Error('El número de medidor es requerido');
    }

    // Validar coordenadas si están presentes
    if (meterData.latitud !== null && meterData.latitud !== undefined) {
      const lat = parseFloat(meterData.latitud);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error('La latitud debe estar entre -90 y 90');
      }
    }

    if (meterData.longitud !== null && meterData.longitud !== undefined) {
      const lng = parseFloat(meterData.longitud);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        throw new Error('La longitud debe estar entre -180 y 180');
      }
    }

    if (meterData.altitud !== null && meterData.altitud !== undefined) {
      const alt = parseFloat(meterData.altitud);
      if (isNaN(alt)) {
        throw new Error('La altitud debe ser un número válido');
      }
    }

    // Validar que id_usuario_afi sea un número si está presente
    if (meterData.id_usuario_afi !== null && meterData.id_usuario_afi !== undefined) {
      if (typeof meterData.id_usuario_afi !== 'number' || isNaN(meterData.id_usuario_afi)) {
        throw new Error('El ID de afiliado debe ser un número válido');
      }
    }

    // Validar que id_sector sea un número si está presente
    if (meterData.id_sector !== null && meterData.id_sector !== undefined) {
      if (typeof meterData.id_sector !== 'number' || isNaN(meterData.id_sector)) {
        throw new Error('El ID de sector debe ser un número válido');
      }
    }
  }

  /**
   * Limpiar caché de estadísticas
   */
  clearStatsCache() {
    this.cachedStats = null;
  }
}

const metersService = new MetersService();

export default metersService;
export { MetersService };