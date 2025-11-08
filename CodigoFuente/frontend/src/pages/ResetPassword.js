// src/pages/ResetPassword.js
// Página para restablecer la contraseña usando un token de recuperación
import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader, ArrowLeft } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import authService from '../services/authServices';
import './Login.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: '#cbd5e1'
  });

  

  // Calcular fortaleza de contraseña
  useEffect(() => {
    if (newPassword) {
      const strength = calculatePasswordStrength(newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, message: '', color: '#cbd5e1' });
    }
  }, [newPassword]);

  const verifyToken = useCallback( async () => {
    if (!token) {
      setIsError(true);
      setMessage('Token inválido o faltante');
      setIsVerifying(false);
      return;
    }

    try {
      const response = await authService.verifyResetToken(token);
      
      if (response.success) {
        setTokenValid(true);
        setUserInfo(response.data);
        setMessage('');
      } else {
        setTokenValid(false);
        setIsError(true);
        setMessage(response.message || 'El enlace de recuperación es inválido o ha expirado');
      }
    } catch (error) {
      setTokenValid(false);
      setIsError(true);
      setMessage('Error al verificar el token');
    } finally {
      setIsVerifying(false);
    }
  }, [token]);

  // Verificar token al cargar el componente
  useEffect(() => {
    verifyToken();
  }, [token, verifyToken]);

  const calculatePasswordStrength = (password) => {
    let score = 0;
    let message = '';
    let color = '#cbd5e1';

    if (!password) return { score: 0, message: '', color };

    // Longitud
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Complejidad
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    // Determinar mensaje y color
    if (score <= 2) {
      message = 'Débil';
      color = '#ef4444';
    } else if (score <= 4) {
      message = 'Media';
      color = '#f59e0b';
    } else if (score <= 5) {
      message = 'Fuerte';
      color = '#22c55e';
    } else {
      message = 'Muy Fuerte';
      color = '#10b981';
    }

    return { score, message, color };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    // Validaciones
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setMessage('Por favor completa todos los campos');
      setIsError(true);
      return;
    }

    if (newPassword.length < 8) {
      setMessage('La contraseña debe tener al menos 8 caracteres');
      setIsError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      setIsError(true);
      return;
    }

    if (passwordStrength.score < 3) {
      setMessage('Por favor usa una contraseña más segura');
      setIsError(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.resetPassword(token, newPassword, confirmPassword);

      if (response.success) {
        setIsError(false);
        setMessage('¡Contraseña actualizada exitosamente! Redirigiendo...');
        
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Contraseña actualizada. Ya puedes iniciar sesión.',
              type: 'success'
            } 
          });
        }, 2000);
      } else {
        setIsError(true);
        setMessage(response.message || 'No se pudo actualizar la contraseña');
      }
    } catch (error) {
      setIsError(true);
      setMessage('Error al actualizar la contraseña');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading mientras verifica el token
  if (isVerifying) {
    return (
      <div className="login-container">
        <div className="login-content">
          <div className="system-header">
            <h1 className="system-title">Verificando...</h1>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Loader size={48} className="animate-spin" style={{ color: '#3b82f6' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si el token no es válido
  if (!tokenValid) {
    return (
      <div className="login-container">
        <div className="login-content">
          <div className="system-header">
            <h1 className="system-title">❌ Token Inválido</h1>
            <p className="system-subtitle">{message}</p>
          </div>

          <div className="login-form-container">
            <div className="error-message">
              <AlertCircle className="error-icon" />
              <span>El enlace de recuperación es inválido o ha expirado</span>
            </div>

            <div className="form-links" style={{ marginTop: '20px', textAlign: 'center' }}>
              <Link to="/forgot-password" className="forgot-link">
                Solicitar nuevo enlace de recuperación
              </Link>
              <br />
              <Link to="/login" className="forgot-link" style={{ marginTop: '10px', display: 'inline-block' }}>
                <ArrowLeft className="inline-icon" /> Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de reset de contraseña
  return (
    <div className="login-container">
      <div className="login-content">
        <div className="system-header">
          <h1 className="system-title">🔐 Nueva Contraseña</h1>
          <p className="system-subtitle">
            {userInfo && `Hola ${userInfo.username}, ingresa tu nueva contraseña`}
          </p>
        </div>

        <div className="login-form-container">
          <form onSubmit={handleSubmit} className="login-form">
            {message && (
              <div className={`error-message ${isError ? '' : 'success-message'}`}>
                {isError ? (
                  <AlertCircle className="error-icon" />
                ) : (
                  <CheckCircle className="error-icon" />
                )}
                <span>{message}</span>
              </div>
            )}

            {/* Nueva Contraseña */}
            <div className="input-group">
              <label htmlFor="newPassword" className="input-label">
                <Lock className="label-icon" /> Nueva Contraseña
              </label>
              <div className="password-input-wrapper">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="form-input"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Indicador de fortaleza */}
              {newPassword && (
                <div className="password-strength">
                  <div className="strength-bar-container">
                    <div 
                      className="strength-bar"
                      style={{
                        width: `${(passwordStrength.score / 6) * 100}%`,
                        backgroundColor: passwordStrength.color
                      }}
                    />
                  </div>
                  <span className="strength-text" style={{ color: passwordStrength.color }}>
                    {passwordStrength.message}
                  </span>
                </div>
              )}

              {/* Requisitos */}
              <div className="password-requirements">
                <small style={{ color: newPassword.length >= 8 ? '#22c55e' : '#94a3b8' }}>
                  {newPassword.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
                </small>
                <small style={{ color: /[A-Z]/.test(newPassword) ? '#22c55e' : '#94a3b8' }}>
                  {/[A-Z]/.test(newPassword) ? '✓' : '○'} Una mayúscula
                </small>
                <small style={{ color: /[a-z]/.test(newPassword) ? '#22c55e' : '#94a3b8' }}>
                  {/[a-z]/.test(newPassword) ? '✓' : '○'} Una minúscula
                </small>
                <small style={{ color: /[0-9]/.test(newPassword) ? '#22c55e' : '#94a3b8' }}>
                  {/[0-9]/.test(newPassword) ? '✓' : '○'} Un número
                </small>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="input-group">
              <label htmlFor="confirmPassword" className="input-label">
                <Lock className="label-icon" /> Confirmar Contraseña
              </label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="form-input"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Validación de coincidencia */}
              {confirmPassword && (
                <small style={{ 
                  color: newPassword === confirmPassword ? '#22c55e' : '#ef4444',
                  display: 'block',
                  marginTop: '4px'
                }}>
                  {newPassword === confirmPassword 
                    ? '✓ Las contraseñas coinciden' 
                    : '✗ Las contraseñas no coinciden'}
                </small>
              )}
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader className="inline-icon animate-spin" />
                  Actualizando...
                </>
              ) : (
                '🔒 Actualizar Contraseña'
              )}
            </button>

            <div className="form-links">
              <Link to="/login" className="forgot-link">
                <ArrowLeft className="inline-icon" /> Volver al inicio de sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;