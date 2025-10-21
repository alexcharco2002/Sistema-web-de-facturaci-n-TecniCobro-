/**
 * Servicio de Gestión de Usuarios Seguros (Encriptados)
 * Maneja todas las operaciones CRUD de usuarios con datos encriptados
 */

import authService from './authServices';

const API_CONFIG = {
  baseURL: 'http://localhost:8000',
  endpoints: {
    usersSecure: '/usuarios-seguros',
    toggleStatus: (id) => `/usuarios-seguros/${id}/toggle-status`,
  }
};

class UsersSecureService {
  /**
   * Realizar petición HTTP con configuración común
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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

    try {
      console.log(`🔒 API Request (Secure): ${finalOptions.method} ${url}`);
      
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
        } else if (typeof errorData.detail === 'object') {
          errorMessage = JSON.stringify(errorData.detail);
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`✅ API Response (Secure):`, data);

      return data;

    } catch (error) {
      console.error(`❌ API Error (Secure):`, error);
      
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
   * Obtener lista de usuarios seguros
   */
  async getUsers(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.rol && filters.rol !== 'all') params.append('rol', filters.rol);
      if (filters.activo !== undefined) params.append('activo', filters.activo);
      if (filters.skip) params.append('skip', filters.skip);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const endpoint = queryString 
        ? `${API_CONFIG.endpoints.usersSecure}?${queryString}` 
        : API_CONFIG.endpoints.usersSecure;

      const data = await this.makeRequest(endpoint);

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Error obteniendo usuarios seguros:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener usuarios seguros',
        data: []
      };
    }
  }

  /**
   * Obtener un usuario seguro por ID
   */
  async getUserById(userId) {
    try {
      const data = await this.makeRequest(`${API_CONFIG.endpoints.usersSecure}/${userId}`);

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Error obteniendo usuario seguro:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener usuario seguro',
        data: null
      };
    }
  }

  /**
   * Crear un nuevo usuario seguro
   */
  async createUser(userData) {
    try {
      // Validar datos requeridos
      this.validateUserData(userData, true);

      const data = await this.makeRequest(API_CONFIG.endpoints.usersSecure, {
        method: 'POST',
        body: JSON.stringify({
          usuario: userData.usuario.trim().toLowerCase(),
          nombres: userData.nombres.trim(),
          apellidos: userData.apellidos.trim(),
          cedula: userData.cedula.trim(),
          correo: userData.correo.trim().toLowerCase(),
          telefono: userData.telefono?.trim() || null,
          direccion: userData.direccion?.trim() || null,
          numtarjeta: userData.numtarjeta?.trim() || null,
          rol: userData.rol || 'cliente',
          activo: userData.activo !== undefined ? userData.activo : true
        })
      });

      return {
        success: true,
        data: data,
        message: 'Usuario seguro creado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error creando usuario seguro:', error);
      return {
        success: false,
        message: error.message || 'Error al crear usuario seguro',
        data: null
      };
    }
  }

  /**
   * Actualizar un usuario seguro existente
   */
  async updateUser(userId, userData) {
    try {
      // Validar datos (no requeridos para actualización)
      this.validateUserData(userData, false);

      // Filtrar solo los campos que se van a actualizar
      const updateData = {};
      
      if (userData.usuario) updateData.usuario = userData.usuario.trim().toLowerCase();
      if (userData.nombres) updateData.nombres = userData.nombres.trim();
      if (userData.apellidos) updateData.apellidos = userData.apellidos.trim();
      if (userData.cedula) updateData.cedula = userData.cedula.trim();
      if (userData.correo) updateData.correo = userData.correo.trim().toLowerCase();
      if (userData.telefono !== undefined) updateData.telefono = userData.telefono?.trim() || null;
      if (userData.direccion !== undefined) updateData.direccion = userData.direccion?.trim() || null;
      if (userData.numtarjeta !== undefined) updateData.numtarjeta = userData.numtarjeta?.trim() || null;
      if (userData.rol) updateData.rol = userData.rol;
      if (userData.activo !== undefined) updateData.activo = userData.activo;

      const data = await this.makeRequest(`${API_CONFIG.endpoints.usersSecure}/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      return {
        success: true,
        data: data,
        message: 'Usuario seguro actualizado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error actualizando usuario seguro:', error);
      return {
        success: false,
        message: error.message || 'Error al actualizar usuario seguro',
        data: null
      };
    }
  }

  /**
   * Eliminar un usuario seguro
   */
  async deleteUser(userId) {
    try {
      const data = await this.makeRequest(`${API_CONFIG.endpoints.usersSecure}/${userId}`, {
        method: 'DELETE'
      });

      return {
        success: true,
        data: data,
        message: 'Usuario seguro eliminado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error eliminando usuario seguro:', error);
      return {
        success: false,
        message: error.message || 'Error al eliminar usuario seguro'
      };
    }
  }

  /**
   * Activar/Desactivar usuario seguro
   */
  async toggleUserStatus(userId) {
    try {
      const data = await this.makeRequest(API_CONFIG.endpoints.toggleStatus(userId), {
        method: 'PATCH'
      });

      return {
        success: true,
        data: data,
        message: 'Estado del usuario seguro actualizado'
      };

    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      return {
        success: false,
        message: error.message || 'Error al cambiar estado del usuario seguro'
      };
    }
  }

  /**
   * Validar datos de usuario seguro
   */
  validateUserData(userData, required = true) {
    if (required) {
      if (!userData.usuario || userData.usuario.trim().length < 3) {
        throw new Error('El usuario debe tener al menos 3 caracteres');
      }

      if (!userData.nombres || userData.nombres.trim().length < 2) {
        throw new Error('El nombre debe tener al menos 2 caracteres');
      }

      if (!userData.apellidos || userData.apellidos.trim().length < 2) {
        throw new Error('Los apellidos deben tener al menos 2 caracteres');
      }

      if (!userData.cedula || userData.cedula.trim().length < 10) {
        throw new Error('La cédula debe tener al menos 10 dígitos');
      }

      if (!userData.correo || !this.isValidEmail(userData.correo)) {
        throw new Error('Debe proporcionar un correo electrónico válido');
      }

      // Validar número de tarjeta si está presente
      if (userData.numtarjeta && userData.numtarjeta.trim().length > 0) {
        if (userData.numtarjeta.trim().length < 13) {
          throw new Error('El número de tarjeta debe tener al menos 13 dígitos');
        }
        if (userData.numtarjeta.trim().length > 16) {
          throw new Error('El número de tarjeta no debe superar los 16 dígitos');
        }
        // Validar que solo contenga números
        if (!/^\d+$/.test(userData.numtarjeta.trim())) {
          throw new Error('El número de tarjeta debe contener solo dígitos');
        }
      }
    } else {
      // Validaciones para actualización (solo si el campo está presente)
      if (userData.usuario && userData.usuario.trim().length < 3) {
        throw new Error('El usuario debe tener al menos 3 caracteres');
      }

      if (userData.cedula && userData.cedula.trim().length < 10) {
        throw new Error('La cédula debe tener al menos 10 dígitos');
      }

      if (userData.correo && !this.isValidEmail(userData.correo)) {
        throw new Error('Debe proporcionar un correo electrónico válido');
      }

      if (userData.numtarjeta && userData.numtarjeta.trim().length > 0) {
        if (userData.numtarjeta.trim().length < 13 || userData.numtarjeta.trim().length > 16) {
          throw new Error('El número de tarjeta debe tener entre 13 y 16 dígitos');
        }
        if (!/^\d+$/.test(userData.numtarjeta.trim())) {
          throw new Error('El número de tarjeta debe contener solo dígitos');
        }
      }
    }

    // Validar rol si está presente
    if (userData.rol) {
      const rolesValidos = ['admin', 'cliente', 'operador'];
      if (!rolesValidos.includes(userData.rol)) {
        throw new Error('El rol debe ser admin, cliente u operador');
      }
    }
  }

  /**
   * Validar formato de email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Obtener estadísticas de usuarios seguros
   */
  async getUserStats() {
    try {
      const result = await this.getUsers();
      
      if (!result.success) {
        return result;
      }

      const users = result.data;

      return {
        success: true,
        data: {
          total: users.length,
          activos: users.filter(u => u.activo).length,
          inactivos: users.filter(u => !u.activo).length,
          porRol: {
            admin: users.filter(u => u.rol === 'admin').length,
            cliente: users.filter(u => u.rol === 'cliente').length,
            operador: users.filter(u => u.rol === 'operador').length
          }
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
   * Validar número de tarjeta con algoritmo de Luhn (opcional)
   */
  isValidCardNumber(cardNumber) {
    // Eliminar espacios y guiones
    const cleanNumber = cardNumber.replace(/[\s-]/g, '');
    
    // Verificar que sea solo números
    if (!/^\d+$/.test(cleanNumber)) {
      return false;
    }

    // Verificar longitud
    if (cleanNumber.length < 13 || cleanNumber.length > 16) {
      return false;
    }

    // Algoritmo de Luhn
    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Enmascarar datos sensibles para visualización
   * Esta función es solo para el frontend, el backend maneja la encriptación real
   */
  maskSensitiveData(data, type) {
    if (!data) return 'N/A';
    
    switch(type) {
      case 'card':
        // Mostrar solo últimos 4 dígitos
        return `**** **** **** ${data.slice(-4)}`;
      case 'email':
        const [user, domain] = data.split('@');
        if (!user || !domain) return data;
        return `${user.substring(0, 2)}***@${domain}`;
      case 'phone':
        if (data.length < 4) return data;
        return `***-***-${data.slice(-4)}`;
      case 'cedula':
        if (data.length < 3) return data;
        return `*******${data.slice(-3)}`;
      default:
        return data;
    }
  }
}

// Crear instancia singleton
const usersSecureService = new UsersSecureService();

// Exportar para uso en React
export default usersSecureService;

// También exportar la clase
export { UsersSecureService };