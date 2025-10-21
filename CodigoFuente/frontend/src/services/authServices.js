/**
 * Servicio de Autenticación
 * Maneja todas las comunicaciones con el backend FastAPI
 */

// Configuración del API
const API_CONFIG = {
  baseURL: 'http://localhost:8000', // Puerto por defecto de FastAPI
  
  timeout: 10000, // 10 segundos
  endpoints: {
    login: '/login',
    logout: '/logout',
    verifySession: '/verify-session',
    profile: '/profile',
    changePassword: '/change-password',
    healthCheck: '/health'
  }
};

class AuthService {
  constructor() {
    this.token = localStorage.getItem('auth_token') || null;

    let userData = localStorage.getItem('user_data');
    if (!userData || userData === 'undefined') {
      this.user = null;
    } else {
      try {
        this.user = JSON.parse(userData);
      } catch {
        this.user = null;
      }
    }
  }

  

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
      },
      timeout: API_CONFIG.timeout,
    };

    // Agregar token de autorización si existe
    if (this.token && !options.skipAuth) {
      defaultOptions.headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Combinar opciones
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
      
      // Crear AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalOptions.timeout);
      
      const response = await fetch(url, {
        ...finalOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Verificar si la respuesta es exitosa
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
      
      // Manejar diferentes tipos de errores
      if (error.name === 'AbortError') {
        throw new Error('La petición tardó demasiado tiempo');
      }
      
      if (error.message.includes('Failed to fetch')) {
        throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
      }

      throw error;
    }
  }

  /**
   * Iniciar sesión
   */
  async login(credentials) {
    try {
      // Validaciones del lado cliente
      this.validateLoginCredentials(credentials);

      // FastAPI generalmente espera form-data para login OAuth2
      const response = await this.makeRequest(API_CONFIG.endpoints.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username.trim(),
          password: credentials.password.trim()
        }),
        skipAuth: true,
      });
      
      // Si el login es exitoso, guardar datos
      if (response.success) {
        this.user = response.data.user; // actualizar user con lo que devuelve el backend
         this.token = response.data.token; // actualizar token con lo que devuelve el backend

        //Guardar en localStorage para persistencia
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('user_data', JSON.stringify(this.user));
        localStorage.setItem('login_time', new Date().toISOString());

        console.log('✅ Login exitoso:', {
          user: this.user.nombre_completo,
          rol: this.user.rol
        });
        // 
        return {
          success: true,
          data: {
            user: this.user,
            token: this.token
          }
        };
      } else {
        return {
          success: false,
          message: response.message || 'Credenciales inválidas'
        };
      }

    } catch (error) {
      console.error('❌ Error en login:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión'
      };
    }
  }

  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      // Intentar logout en el servidor
      if (this.token) {
        await this.makeRequest(API_CONFIG.endpoints.logout, {
          method: 'POST',
        });
      }

      // Limpiar datos locales
      this.clearLocalData();

      console.log('✅ Logout exitoso');
      return { success: true, message: 'Sesión cerrada correctamente' };

    } catch (error) {
      console.error('❌ Error en logout:', error);
      // Aún así limpiar datos locales
      this.clearLocalData();
      return { success: true, message: 'Sesión cerrada (con errores)' };
    }
  }

  /**
   * Verificar si la sesión es válida
   */
  async verifySession() {
    if (!this.token) {
      return { success: false, message: 'No hay token de sesión' };
    }

    try {
      const response = await this.makeRequest(API_CONFIG.endpoints.verifySession);
      
      if (response && !response.detail) {
        // Actualizar datos del usuario
        this.user = response;
        localStorage.setItem('user_data', JSON.stringify(this.user));
        return { success: true, user: this.user };
      } else {
        // Token inválido, limpiar datos
        this.clearLocalData();
        return { success: false, message: 'Sesión expirada' };
      }

    } catch (error) {
      console.error('❌ Error verificando sesión:', error);
      this.clearLocalData();
      return { success: false, message: 'Error verificando sesión' };
    }
  }

  /**
   * Obtener perfil del usuario
   */
  async getProfile() {
    try {
      const response = await this.makeRequest(API_CONFIG.endpoints.profile);
      
      if (response && !response.detail) {
        this.user = response;
        localStorage.setItem('user_data', JSON.stringify(this.user));
        return { success: true, data: response };
      }

      return { success: false, message: 'Error obteniendo perfil' };

    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(passwords) {
    try {
      if (!passwords.currentPassword || !passwords.newPassword) {
        throw new Error('Contraseña actual y nueva son requeridas');
      }

      if (passwords.newPassword.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      }

      if (passwords.newPassword !== passwords.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      const response = await this.makeRequest(API_CONFIG.endpoints.changePassword, {
        method: 'PUT',
        body: JSON.stringify({
          current_password: passwords.currentPassword,
          new_password: passwords.newPassword,
        }),
      });

      return response;

    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Verificar estado del servidor
   */
  async healthCheck() {
    try {
      const response = await this.makeRequest(API_CONFIG.endpoints.healthCheck, {
        skipAuth: true,
      });

      return response;

    } catch (error) {
      console.error('❌ Error en health check:', error);
      return {
        success: false,
        message: 'Servidor no disponible',
        error: error.message
      };
    }
  }

  /**
   * Validar credenciales de login
   */
  validateLoginCredentials(credentials) {
    if (!credentials.username || !credentials.password) {
      throw new Error('Usuario y contraseña son requeridos');
    }

    if (credentials.username.length < 3) {
      throw new Error('El usuario debe tener al menos 3 caracteres');
    }

    if (credentials.password.length < 4) {
      throw new Error('La contraseña debe tener al menos 4 caracteres');
    }

    // Validar caracteres permitidos en username
    const usernameRegex = /^[a-zA-Z0-9._@-]+$/;
    if (!usernameRegex.test(credentials.username)) {
      throw new Error('El usuario contiene caracteres no válidos');
    }
  }

  /**
   * Limpiar datos locales
   */
  clearLocalData() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('login_time');
    
    // Limpiar timers
    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
    }
  }

  /**
   * Configurar auto-logout después de inactividad
   */
  setupAutoLogout() {
    const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutos

    // Limpiar timer anterior
    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
    }

    // Configurar nuevo timer
    this.autoLogoutTimer = setTimeout(() => {
      console.log('⏰ Auto-logout por inactividad');
      this.logout();
      window.location.reload();
    }, INACTIVITY_TIME);

    // Resetear timer en actividad del usuario
    const resetTimer = () => {
      clearTimeout(this.autoLogoutTimer);
      this.setupAutoLogout();
    };

    // Eventos que resetean el timer
    document.addEventListener('mousedown', resetTimer);
    document.addEventListener('keypress', resetTimer);
    document.addEventListener('scroll', resetTimer);
    document.addEventListener('touchstart', resetTimer);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated() {
    return !!(this.token && this.user);
  }

  /**
   * Obtener datos del usuario actual
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Obtener token actual
   */
  getToken() {
    return this.token;
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role) {
    return this.user && this.user.rol === role;
  }

  /**
   * Obtener tiempo de sesión
   */
  getSessionTime() {
    const loginTime = localStorage.getItem('login_time');
    if (!loginTime) return null;

    const now = new Date();
    const login = new Date(loginTime);
    const diffMinutes = Math.floor((now - login) / (1000 * 60));

    return {
      loginTime: login,
      currentTime: now,
      sessionMinutes: diffMinutes
    };
  }
}

// Crear instancia singleton
const authService = new AuthService();

// Exportar para uso en React
export default authService;

// También exportar la clase para casos específicos
export { AuthService };