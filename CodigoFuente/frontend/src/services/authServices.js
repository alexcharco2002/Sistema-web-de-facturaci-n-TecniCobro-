/**
 * Servicio de Autenticación con HTTPS
 * Incluye funcionalidad de recuperación de contraseña
 */

// Configuración del API con HTTPS
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:8000',
  timeout: 10000,
  endpoints: {
    login: '/login',
    logout: '/logout',
    verifySession: '/verify-session',
    profile: '/profile',
    changePassword: '/change-password',
    healthCheck: '/health',
    // Nuevos endpoints para recuperación de contraseña
    forgotPassword: '/forgot-password',
    verifyCode: '/verify-code',
    resetPassword: '/reset-password',
    resendCode: '/resend-code'
  }
};

class AuthService {
  constructor() {
    this.token = this.getStoredToken();
    this.user = this.getStoredUser();
  }

  /**
   * Obtener token almacenado de forma segura
   */
  getStoredToken() {
    try {
      return sessionStorage.getItem('auth_token') || null;
    } catch {
      return null;
    }
  }

  /**
   * Obtener usuario almacenado
   */
  getStoredUser() {
    try {
      const userData = sessionStorage.getItem('user_data');
      if (!userData || userData === 'undefined') {
        return null;
      }
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }

  /**
   * Realizar petición HTTP con configuración común y HTTPS
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
      mode: 'cors',
      credentials: 'include'
    };

    if (this.token && !options.skipAuth) {
      defaultOptions.headers['Authorization'] = `Bearer ${this.token}`;
    }

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      console.log(`🔒 HTTPS Request: ${finalOptions.method} ${url}`);
      
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
      console.log(`✅ HTTPS Response:`, data);

      return data;

    } catch (error) {
      console.error(`❌ HTTPS Error:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error('La petición tardó demasiado tiempo');
      }
      
      if (error.message.includes('Failed to fetch')) {
        throw new Error('No se pudo conectar con el servidor. Verifique su conexión HTTPS.');
      }

      if (error.message.includes('certificate')) {
        throw new Error('Error de certificado SSL. Acepte el certificado en su navegador.');
      }

      throw error;
    }
  }

  /**
   * Iniciar sesión
   */
  async login(credentials) {
    try {
      this.validateLoginCredentials(credentials);

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
      
      if (response.success) {
        this.user = response.data.user;
        this.token = response.data.token;

        sessionStorage.setItem('auth_token', this.token);
        sessionStorage.setItem('user_data', JSON.stringify(this.user));
        sessionStorage.setItem('login_time', new Date().toISOString());

        console.log('✅ Login exitoso (HTTPS):', {
          user: this.user.nombre_completo,
          rol: this.user.rol
        });
        
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
          message: response.message || 'Credenciales inválidas, Usuario no registrado'
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

 // Agregar estos métodos a tu clase AuthService existente

/**
 * Solicitar código de recuperación de contraseña
 */
async forgotPassword(email) {
  try {
    if (!email || !email.trim()) {
      throw new Error('El correo electrónico es requerido');
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Formato de correo electrónico inválido');
    }

    const response = await this.makeRequest(API_CONFIG.endpoints.forgotPassword || '/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
      skipAuth: true,
    });

    return response;

  } catch (error) {
    console.error('❌ Error en forgotPassword:', error);
    return {
      success: false,
      message: error.message || 'Error al solicitar recuperación de contraseña'
    };
  }
}

/**
 * Verificar código de recuperación
 */
async verifyRecoveryCode(email, code) {
  try {
    if (!email || !code) {
      throw new Error('Email y código son requeridos');
    }

    if (code.length !== 6) {
      throw new Error('El código debe tener 6 dígitos');
    }

    const response = await this.makeRequest(API_CONFIG.endpoints.verifyCode || '/verify-code', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code: code.trim()
      }),
      skipAuth: true,
    });

    return response;

  } catch (error) {
    console.error('❌ Error en verifyRecoveryCode:', error);
    return {
      success: false,
      message: error.message || 'Error al verificar el código'
    };
  }
}

/**
 * Restablecer contraseña
 */
async resetPassword(email, resetToken, newPassword) {
  try {
    if (!email || !resetToken || !newPassword) {
      throw new Error('Todos los campos son requeridos');
    }

    if (newPassword.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    const response = await this.makeRequest(API_CONFIG.endpoints.resetPassword || '/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        reset_token: resetToken,
        new_password: newPassword
      }),
      skipAuth: true,
    });

    return response;

  } catch (error) {
    console.error('❌ Error en resetPassword:', error);
    return {
      success: false,
      message: error.message || 'Error al restablecer la contraseña'
    };
  }
}

/**
 * Reenviar código de verificación
 */
async resendCode(email) {
  try {
    if (!email || !email.trim()) {
      throw new Error('El correo electrónico es requerido');
    }

    const response = await this.makeRequest(API_CONFIG.endpoints.resendCode || '/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
      skipAuth: true,
    });

    return response;

  } catch (error) {
    console.error('❌ Error en resendCode:', error);
    return {
      success: false,
      message: error.message || 'Error al reenviar el código'
    };
  }
}

  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      if (this.token) {
        await this.makeRequest(API_CONFIG.endpoints.logout, {
          method: 'POST',
        });
      }

      this.clearLocalData();

      console.log('✅ Logout exitoso');
      return { success: true, message: 'Sesión cerrada correctamente' };

    } catch (error) {
      console.error('❌ Error en logout:', error);
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
        this.user = response;
        sessionStorage.setItem('user_data', JSON.stringify(this.user));
        return { success: true, user: this.user };
      } else {
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
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_data');
    sessionStorage.removeItem('login_time');
    
    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
    }
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
}

// Crear instancia singleton
const authService = new AuthService();

export default authService;
export { AuthService };