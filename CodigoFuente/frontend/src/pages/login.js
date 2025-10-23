// fronted pagina de INICIO DE SESION
// src/pages/Login.js 
// Este componente maneja el inicio de sesión del usuario, validaciones y redirección según el perfil.
import React, { useState, useEffect } from 'react'; 
import { Link } from 'react-router-dom';

import { User, Lock, Eye, EyeOff, Droplets, AlertCircle } from 'lucide-react';
import authService from '../services/authServices'; // Servicio de autenticación
import { redirectByProfile } from '../utils/auth'; // Función para redirigir según el perfil del usuario
import './Login.css'; //estilo del login

const Login = () => { // Estado del componente, inicializa los datos del formulario y estados de carga y error
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Verificar si ya está autenticado
  useEffect(() => {
    if (authService.isAuthenticated()) {  //si el usuario ya está autenticado
      // Redirigir según el perfil del usuario
      const user = authService.getCurrentUser();
      if (user && user.rol) {  // si el usuario tiene un rol definido
        // Redireccionar a la página correspondiente según el rol
        window.location.href = redirectByProfile(user.rol);
      }
    }
  }, []);

  const handleInputChange = (e) => { // Maneja el cambio de los campos del formulario
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario empieza a escribir
    if (error) setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    // Validaciones básicas
    if (!formData.username.trim() || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (formData.username.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true); // Inicia el estado de carga
    setError(''); // Limpia el error previo

    // Llamada al servicio de autenticación
    try {
      const response = await authService.login({
        username: formData.username,
        password: formData.password
      });

      if (response.success) {
        const user = response.data?.user || authService.getCurrentUser();
        
        // Mostrar mensaje de éxito breve
        setError('');
        
        // Redireccionar según el perfil
        setTimeout(() => {
          if (user && user.rol) {
            window.location.href = redirectByProfile(user.rol);
          } else {
            // Fallback si no hay perfil definido
            window.location.href = '/dashboard';
          }
        }, 500);
        
      } else {
        console.log('🔎 response.message:', response.message);
        
        // Manejo mejorado del mensaje de error
        let errorMessage = 'Error en el login';
        
        if (typeof response.message === 'string') {
          errorMessage = response.message;
        } else if (response.message && typeof response.message === 'object') {
          // Intenta mostrar algún campo dentro del objeto
          const values = Object.values(response.message);
          errorMessage = values.length ? values[0] : 'Error en el login';
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error de login:', err);
      const errorMessage = typeof err.message === 'string'
        ? err.message
        : 'Error de conexión. Verifica tu conexión a internet.';
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="bg-decoration bg-decoration-1"></div>
        <div className="bg-decoration bg-decoration-2"></div>
        <div className="bg-decoration bg-decoration-3"></div>
      </div>
      
      <div className="login-content">
        {/* Header del sistema */}
        <div className="system-header">
          <div className="system-logo">
            <Droplets className="logo-icon" />
          </div>
          <h1 className="system-title">
            JAAP Sanjapamba
          </h1>
          <p className="system-subtitle">Sistema de Facturación</p>
        </div>

        {/* Formulario de login */}
        <div className="login-form-container">
          <div className="login-form">
            <div className="form-header">
              <h2 className="form-title">Iniciar Sesión</h2>
              <p className="form-subtitle">Accede a tu cuenta</p>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle className="error-icon" />
                <span>{error}</span>
              </div>
            )}

            {/* Campo Usuario */}
<div className="input-group">
  <label htmlFor="username" className="input-label">
    <User className="label-icon" /> {/* Icono al lado del label */}
    Usuario
  </label>
  <input
    id="username"
    type="text"
    name="username"
    value={formData.username}
    onChange={handleInputChange}
    onKeyPress={handleKeyPress}
    className="form-input"
    placeholder="Ingresa tu usuario"
    disabled={isLoading}
    autoComplete="username"
  />
</div>

{/* Campo Contraseña */}
<div className="input-group">
  <label htmlFor="password" className="input-label">
    <Lock className="label-icon" /> {/* Icono al lado del label */}
    Contraseña
  </label>
  <div className="input-container">
    <input
      id="password"
      type={showPassword ? "text" : "password"}
      name="password"
      value={formData.password}
      onChange={handleInputChange}
      onKeyPress={handleKeyPress}
      className="form-input password-input"
      placeholder="Ingresa tu contraseña"
      disabled={isLoading}
      autoComplete="current-password"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="password-toggle"
      disabled={isLoading}
      tabIndex="-1"
      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
    >
      {showPassword ? <EyeOff className="toggle-icon" /> : <Eye className="toggle-icon" />}
    </button>
  </div>
</div>


            {/* Botón de login */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !formData.username.trim() || !formData.password}
              className="login-button"
            >
              {isLoading ? (
                <div className="loading-content">
                  <div className="loading-spinner"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>

            {/* Enlaces adicionales */}
            <div className="form-links">
              <Link to="/forgot-password" className="forgot-link">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="system-footer">
          <p>Sistema de Facturación de Agua v1.0</p>
          <p className="footer-tech">Todos los derechos reservados @2025</p>
        </div>
      </div>
    </div>
  );
};

export default Login;