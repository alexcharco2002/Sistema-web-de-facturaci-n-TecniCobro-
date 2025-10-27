/**
 * Servicio de Gestión de Usuarios
 * Maneja todas las operaciones CRUD de usuarios con el backend
 */

import authService from './authServices';

const API_CONFIG = {
  baseURL: 'https://localhost:8000',
  endpoints: {
    users: '/users',
    toggleStatus: (id) => `/users/${id}/toggle-status`,
    changePassword: (id) => `/users/${id}/change-password`,
    uploadPhoto: (id) => `/users/${id}/upload-photo`
  }
};

class UsersService {
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
   * Obtener lista de usuarios
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
        ? `${API_CONFIG.endpoints.users}?${queryString}` 
        : API_CONFIG.endpoints.users;

      const data = await this.makeRequest(endpoint);

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener usuarios'
      };
    }
  }

  /**
   * Obtener un usuario por ID
   */
  async getUserById(userId) {
    try {
      const data = await this.makeRequest(`${API_CONFIG.endpoints.users}/${userId}`);

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener usuario'
      };
    }
  }

  /**
   * Crear un nuevo usuario
   */
  async createUser(userData) {
    try {
      // Validar datos requeridos
      this.validateUserData(userData, true);

      const data = await this.makeRequest(API_CONFIG.endpoints.users, {
        method: 'POST',
        body: JSON.stringify({
          
          nombres: userData.nombres.trim(),
          apellidos: userData.apellidos.trim(),
          sexo: userData.sexo || 'otro',  // otro si no se proporciona
          fecha_nac: userData.fecha_nac || null, // null si no se proporciona
          cedula: userData.cedula.trim(),
          email: userData.email.trim().toLowerCase(),
          telefono: userData.telefono?.trim() || null,
          direccion: userData.direccion?.trim() || 'Sanjapamba', // Valor por defecto
          rol: userData.rol || 'cliente',
          activo: userData.activo !== undefined ? userData.activo : true
        })
      });

      return {
        success: true,
        data: data,
        message: 'Usuario creado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      return {
        success: false,
        message: error.message || 'Error al crear usuario'
      };
    }
  }

  /**
   * Actualizar un usuario existente
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
      if (userData.email) updateData.email = userData.email.trim().toLowerCase();
      if (userData.telefono !== undefined) updateData.telefono = userData.telefono?.trim() || null;
      if (userData.direccion !== undefined) updateData.direccion = userData.direccion?.trim() || null;
      if (userData.rol) updateData.rol = userData.rol;
      if (userData.activo !== undefined) updateData.activo = userData.activo;

      const data = await this.makeRequest(`${API_CONFIG.endpoints.users}/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      return {
        success: true,
        data: data,
        message: 'Usuario actualizado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      return {
        success: false,
        message: error.message || 'Error al actualizar usuario'
      };
    }
  }

  /**
   * Eliminar un usuario
   */
  async deleteUser(userId) {
    try {
      const data = await this.makeRequest(`${API_CONFIG.endpoints.users}/${userId}`, {
        method: 'DELETE'
      });

      return {
        success: true,
        data: data,
        message: 'Usuario eliminado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      return {
        success: false,
        message: error.message || 'Error al eliminar usuario'
      };
    }
  }

  /**
   * Activar/Desactivar usuario
   */
  async toggleUserStatus(userId) {
    try {
      const data = await this.makeRequest(API_CONFIG.endpoints.toggleStatus(userId), {
        method: 'PATCH'
      });

      return {
        success: true,
        data: data,
        message: 'Estado del usuario actualizado'
      };

    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      return {
        success: false,
        message: error.message || 'Error al cambiar estado del usuario'
      };
    }
  }

  /**
   * Cambiar contraseña de usuario
   */
  async changeUserPassword(userId, passwords) {
    try {
      if (!passwords.currentPassword && authService.getCurrentUser()?.rol !== 'admin') {
        throw new Error('Contraseña actual es requerida');
      }

      if (!passwords.newPassword) {
        throw new Error('Nueva contraseña es requerida');
      }

      if (passwords.newPassword.length < 8) {
        throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
      }

      const data = await this.makeRequest(API_CONFIG.endpoints.changePassword(userId), {
        method: 'PUT',
        body: JSON.stringify({
          current_password: passwords.currentPassword || '',
          new_password: passwords.newPassword
        })
      });

      return {
        success: true,
        data: data,
        message: 'Contraseña actualizada exitosamente'
      };

    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error);
      return {
        success: false,
        message: error.message || 'Error al cambiar contraseña'
      };
    }
  }

  /**
   * Subir foto de perfil
   */
  async uploadUserPhoto(userId, file) {
    try {
      if (!file) {
        throw new Error('Debe seleccionar un archivo');
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('La imagen no debe superar los 2MB');
      }

      const formData = new FormData();
      formData.append('file', file);

      const data = await this.makeRequest(API_CONFIG.endpoints.uploadPhoto(userId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
          // No incluir Content-Type, el navegador lo establecerá automáticamente con boundary
        },
        body: formData
      });

      return {
        success: true,
        data: data,
        message: 'Foto actualizada exitosamente'
      };

    } catch (error) {
      console.error('❌ Error subiendo foto:', error);
      return {
        success: false,
        message: error.message || 'Error al subir foto'
      };
    }
  }

  /**
   * Validar datos de usuario
   */
  validateUserData(userData, required = true) {
    if (required) {
      // Validaciones para CREACIÓN
      if (!userData.nombres || userData.nombres.trim().length < 2) {
        throw new Error('El nombre debe tener al menos 2 caracteres');
      }

      if (!userData.apellidos || userData.apellidos.trim().length < 2) {
        throw new Error('Los apellidos deben tener al menos 2 caracteres');
      }

      if (!userData.sexo || !['M', 'F'].includes(userData.sexo.toUpperCase())) {
        throw new Error('Debe seleccionar un sexo válido (M o F)');
      }

      if (!userData.fecha_nac) {
        throw new Error('Debe proporcionar una fecha de nacimiento');
      }

      if (!userData.cedula || userData.cedula.trim().length < 8) {
        throw new Error('La cédula debe tener al menos 8 caracteres');
      }

      if (!userData.email || !this.isValidEmail(userData.email)) {
        throw new Error('Debe proporcionar un Correo Electrónico válido');
      }
    } else {
      // Validaciones para ACTUALIZACIÓN (solo si el campo está presente)
      if (userData.usuario && userData.usuario.trim().length < 3) {
        throw new Error('El usuario debe tener al menos 3 caracteres');
      }

      if (userData.email && !this.isValidEmail(userData.email)) {
        throw new Error('Debe proporcionar un Correo Electrónico válido');
      }

      if (userData.sexo && !['M', 'F'].includes(userData.sexo.toUpperCase())) {
        throw new Error('El sexo debe ser M o F');
      }
  }

  // Validar rol si está presente
  if (userData.rol) {
    const rolesValidos = ['cliente', 'lector', 'cajero', 'administrador'];
    if (!rolesValidos.includes(userData.rol)) {
      throw new Error('El rol debe ser administrador, lector, cajero o cliente');
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
   * Obtener estadísticas de usuarios
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
 * Actualizar usuario actual en localStorage
 */
  updateCurrentUser(userData) {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        return { success: false, message: 'No hay usuario autenticado' };
      }

      // Combinar datos actuales con los nuevos
      const updatedUser = {
        ...currentUser,
        ...userData
      };

      // Guardar en localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      console.log('✅ Usuario actualizado en localStorage');
      
      return { success: true, data: updatedUser };
    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      return { success: false, message: error.message };
    }
  }
}

// Crear instancia singleton
const usersService = new UsersService();

// Exportar para uso en React
export default usersService;

// También exportar la clase
export { UsersService };