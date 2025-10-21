// src/pages/Profile.js
import React, { useState, useRef, useEffect  } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authServices';
import {
  ArrowLeft,
  Camera,
  Edit2,
  Save,
  X,
  Trash2,
  User,
  Mail,
  Calendar,
  Shield,
  CreditCard
} from 'lucide-react';
import './Profile.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  
  

 useEffect(() => {
  const fetchUserData = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        navigate('/login'); // usar navigate directamente
        return;
      }

      const result = await authService.getProfile();
      if (result.success) {
        setUser(result.data);
        setEditedData(result.data);
      } else {
        setUser(currentUser);
        setEditedData(currentUser);
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setEditedData(currentUser);
    } finally {
      setLoading(false);
    }
  };

  fetchUserData();
}, [navigate]); // eslint sigue contento



  const handleGoBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedData(user);
  };

  const handleSave = async () => {
    // Aquí implementarías la lógica para guardar cambios
    setIsEditing(false);
    console.log('Guardando cambios:', editedData);
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validaciones
    if (!file.type.startsWith('image/')) {
      setPhotoError('El archivo debe ser una imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('La imagen no puede ser mayor a 5MB');
      return;
    }

    setUploadingPhoto(true);
    setPhotoError('');

    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);

      // Aquí harías la petición al backend
      // const result = await authService.uploadProfilePhoto(formData);
      
      // Por ahora, simulamos la subida creando una URL local
      const photoURL = URL.createObjectURL(file);
      
      setUser(prev => ({ ...prev, foto: photoURL }));
      setEditedData(prev => ({ ...prev, foto: photoURL }));
      
      console.log('Foto subida exitosamente');
    } catch (error) {
      setPhotoError('Error subiendo la foto: ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar tu foto de perfil?')) {
      try {
        // Aquí harías la petición al backend para eliminar la foto
        // await authService.deleteProfilePhoto();
        
        setUser(prev => ({ ...prev, foto: null }));
        setEditedData(prev => ({ ...prev, foto: null }));
        
        console.log('Foto eliminada exitosamente');
      } catch (error) {
        console.error('Error eliminando foto:', error);
      }
    }
  };

  const getUserInitials = (nombres, apellidos) => {
    const firstInitial = nombres ? nombres.charAt(0).toUpperCase() : '';
    const lastInitial = apellidos ? apellidos.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial || 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No registrado';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-error">
        <p>No se pudo cargar la información del perfil</p>
        <button onClick={() => navigate('/login')}>Ir al Login</button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <button className="back-button" onClick={handleGoBack}>
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>
        
        <h1>Mi Perfil</h1>
        
        <div className="header-actions">
          {isEditing ? (
            <>
              <button className="btn-secondary" onClick={handleCancelEdit}>
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
              <button className="btn-primary" onClick={handleSave}>
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={handleEdit}>
              <Edit2 className="w-4 h-4" />
              <span>Editar</span>
            </button>
          )}
        </div>
      </div>

      <div className="profile-content">
        {/* Sección de Foto */}
        <div className="profile-photo-section">
          <div className="photo-container">
            {user.foto ? (
              <img src={user.foto} alt="Foto de perfil" className="profile-photo" />
            ) : (
              <div className="profile-photo-placeholder">
                <span className="photo-initials">
                  {getUserInitials(user.nombres, user.apellidos)}
                </span>
              </div>
            )}
            
            {/* Overlay con acciones */}
            <div className="photo-overlay">
              <button 
                className="photo-action-btn"
                onClick={handlePhotoClick}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <div className="btn-spinner"></div>
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
              
              {user.foto && (
                <button 
                  className="photo-action-btn delete-btn"
                  onClick={handleDeletePhoto}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          <div className="photo-info">
            <h2>{user.nombre_completo || `${user.nombres} ${user.apellidos}`}</h2>
            <p className="user-role-badge">{user.rol}</p>
            {photoError && <p className="error-message">{photoError}</p>}
            <p className="photo-help">
              Haz click en la cámara para cambiar tu foto de perfil
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Información Personal */}
        <div className="profile-section">
          <h3>
            <User className="section-icon" />
            Información Personal
          </h3>
          
          <div className="info-grid">
            <div className="info-item">
              <label>Nombres</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.nombres || ''}
                  onChange={(e) => handleInputChange('nombres', e.target.value)}
                  className="edit-input"
                />
              ) : (
                <p>{user.nombres || 'No especificado'}</p>
              )}
            </div>

            <div className="info-item">
              <label>Apellidos</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.apellidos || ''}
                  onChange={(e) => handleInputChange('apellidos', e.target.value)}
                  className="edit-input"
                />
              ) : (
                <p>{user.apellidos || 'No especificado'}</p>
              )}
            </div>

            <div className="info-item">
              <label>Cédula</label>
              <p>{user.cedula || 'No registrada'}</p>
            </div>

            <div className="info-item">
              <label>
                <Mail className="w-4 h-4" />
                email Electrónico
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="edit-input"
                />
              ) : (
                <p>{user.email || 'No especificado'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Información del Sistema */}
        <div className="profile-section">
          <h3>
            <Shield className="section-icon" />
            Información del Sistema
          </h3>
          
          <div className="info-grid">
            <div className="info-item">
              <label>Usuario</label>
              <p>{user.usuario}</p>
            </div>

            <div className="info-item">
              <label>Rol</label>
              <p className="role-badge">{user.rol}</p>
            </div>

            <div className="info-item">
              <label>
                <Calendar className="w-4 h-4" />
                Fecha de Registro
              </label>
              <p>{formatDate(user.fecha_registro)}</p>
            </div>

            <div className="info-item">
              <label>
                <CreditCard className="w-4 h-4" />
                ID de Usuario
              </label>
              <p>#{user.cod_usuario_sistema}</p>
            </div>
          </div>
        </div>

        {/* Sección de Acciones */}
        <div className="profile-actions">
          <button className="action-btn secondary">
            <Edit2 className="w-4 h-4" />
            Cambiar Contraseña
          </button>
          
          <button className="action-btn secondary">
            <Mail className="w-4 h-4" />
            Configurar Notificaciones
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;