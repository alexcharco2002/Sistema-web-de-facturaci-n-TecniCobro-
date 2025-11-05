/**
 * src/services/sectorsServices.js
 * Servicio de Gestión de Sectores
 * Tabla: t_sector
 */

import authService from './authServices';

const API_CONFIG = {
  baseURL: 'https://localhost:8000',
  endpoints: {
    sectors: '/sectors',
    toggleStatus: (id) => `/sectors/${id}/toggle-status`,
  }
};

class SectorsService {
  constructor() {
    this.cachedSectors = null;
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

    // Manejar FormData y JSON
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
   * Obtener lista de sectores
   */
  async getSectors(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.activo !== undefined) params.append('activo', filters.activo);
      if (filters.skip) params.append('skip', filters.skip);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const endpoint = queryString 
        ? `${API_CONFIG.endpoints.sectors}?${queryString}` 
        : API_CONFIG.endpoints.sectors;

      const data = await this.makeRequest(endpoint);

      // Actualizar caché
      this.cachedSectors = data;

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Error obteniendo sectores:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener sectores'
      };
    }
  }

  /**
   * Obtener un sector por ID
   */
  async getSectorById(sectorId) {
    try {
      const data = await this.makeRequest(`${API_CONFIG.endpoints.sectors}/${sectorId}`);

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Error obteniendo sector:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener sector'
      };
    }
  }

  /**
   * Crear un nuevo sector
   */
  async createSector(sectorData) {
    try {
      this.validateSectorData(sectorData, true);

      const data = await this.makeRequest(API_CONFIG.endpoints.sectors, {
        method: 'POST',
        body: {
          nombre_sector: sectorData.nombre_sector.trim(),
          descripcion: sectorData.descripcion?.trim() || null,
          activo: sectorData.activo !== undefined ? sectorData.activo : true
        }
      });

      // Limpiar caché
      this.cachedSectors = null;

      return {
        success: true,
        data: data,
        message: 'Sector creado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error creando sector:', error);
      return {
        success: false,
        message: error.message || 'Error al crear sector'
      };
    }
  }

  /**
   * Actualizar un sector existente
   */
  async updateSector(sectorId, sectorData) {
    if (!sectorId || isNaN(sectorId)) {
      throw new Error('ID de sector inválido o no definido');
    }

    try {
      this.validateSectorData(sectorData, false);

      const updateData = {};
      
      if (sectorData.nombre_sector) updateData.nombre_sector = sectorData.nombre_sector.trim();
      if (sectorData.descripcion !== undefined) updateData.descripcion = sectorData.descripcion?.trim() || null;
      if (sectorData.activo !== undefined) updateData.activo = sectorData.activo;

      const data = await this.makeRequest(`${API_CONFIG.endpoints.sectors}/${sectorId}`, {
        method: 'PUT',
        body: updateData,
      });

      // Limpiar caché
      this.cachedSectors = null;

      return {
        success: true,
        data: data,
        message: 'Sector actualizado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error actualizando sector:', error);
      return {
        success: false,
        message: error.message || 'Error al actualizar sector'
      };
    }
  }

  /**
   * Eliminar un sector
   */
  async deleteSector(sectorId) {
    try {
      const data = await this.makeRequest(`${API_CONFIG.endpoints.sectors}/${sectorId}`, {
        method: 'DELETE'
      });

      // Limpiar caché
      this.cachedSectors = null;

      return {
        success: true,
        data: data,
        message: 'Sector eliminado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error eliminando sector:', error);
      return {
        success: false,
        message: error.message || 'Error al eliminar sector'
      };
    }
  }

  /**
   * Activar/Desactivar sector
   */
  async toggleSectorStatus(sectorId) {
    try {
      const data = await this.makeRequest(API_CONFIG.endpoints.toggleStatus(sectorId), {
        method: 'PATCH'
      });

      // Limpiar caché
      this.cachedSectors = null;

      return {
        success: true,
        data: data,
        message: 'Estado del sector actualizado'
      };

    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      return {
        success: false,
        message: error.message || 'Error al cambiar estado del sector'
      };
    }
  }

  /**
   * Validar datos de sector
   */
  validateSectorData(sectorData, required = true) {
    if (required) {
      if (!sectorData.nombre_sector || sectorData.nombre_sector.trim().length < 3) {
        throw new Error('El nombre del sector debe tener al menos 3 caracteres');
      }
    } else {
      if (sectorData.nombre_sector && sectorData.nombre_sector.trim().length < 3) {
        throw new Error('El nombre del sector debe tener al menos 3 caracteres');
      }
    }
  }

  /**
   * Obtener estadísticas de sectores
   */
  async getSectorStats() {
    try {
      const result = await this.getSectors();
      
      if (!result.success) {
        return result;
      }

      const sectors = result.data;

      return {
        success: true,
        data: {
          total: sectors.length,
          activos: sectors.filter(s => s.activo).length,
          inactivos: sectors.filter(s => !s.activo).length
        }
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
   * Obtener sectores desde caché (útil para selects)
   */
  getCachedSectors() {
    return this.cachedSectors || [];
  }

  /**
   * Limpiar caché de sectores
   */
  clearCache() {
    this.cachedSectors = null;
  }
}

const sectorsService = new SectorsService();

export default sectorsService;
export { SectorsService };