// src/components/ProfileSection.js
// Sección de perfil del usuario con capacidad de editar y guardar cambios
import React, { useState, useEffect } from 'react';
import {
  User,
  Edit,
  Save,
  X,
  Camera,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar, 
  VenusAndMars
} from 'lucide-react';

const ProfileSection = ({ user, onUpdateProfile }) => {
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState(user);
  const [saving, setSaving] = useState(false);

  // Sincronizar profileData cuando cambie user (después de guardar)
  useEffect(() => {
    setProfileData(user);
  }, [user]);

  // Función para obtener las iniciales del usuario
  const getUserInitials = (nombres, apellidos) => {
    const firstInitial = nombres ? nombres.charAt(0).toUpperCase() : '';
    const lastInitial = apellidos ? apellidos.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial || 'U';
  };

  // Formatear fecha para input type="date" (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return '';
    }
  };

  // Formatear fecha para visualización
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'No especificado';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-EC', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Validar datos antes de guardar
  const validateProfileData = () => {
    const errors = [];
    
    if (!profileData.nombres?.trim()) {
      errors.push('El nombre es requerido');
    }
    
    if (!profileData.apellidos?.trim()) {
      errors.push('Los apellidos son requeridos');
    }
    
    if (profileData.email && !profileData.email.includes('@')) {
      errors.push('El email no es válido');
    }
    
    if (profileData.telefono && profileData.telefono.length < 7) {
      errors.push('El teléfono debe tener al menos 7 dígitos');
    }

    return errors;
  };

  // Handlers para el perfil
  const handleEditProfile = () => {
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    // Validar datos
    const errors = validateProfileData();
    if (errors.length > 0) {
      alert('Por favor corrige los siguientes errores:\n\n' + errors.join('\n'));
      return;
    }

    try {
      setSaving(true);
      
      // ✅ CORRECCIÓN: El ID se llama 'id_usuario_sistema'
      const userId = user.id_usuario_sistema || user.id || user.id_usuario || user.usuario_id;
      
      if (!userId) {
        console.error('❌ Usuario completo:', user);
        throw new Error('No se pudo encontrar el ID del usuario');
      }
      
      const dataToSave = {
        id: userId,
        nombres: profileData.nombres,
        apellidos: profileData.apellidos,
        sexo: profileData.sexo,
        fecha_nac: profileData.fecha_nac,
        email: profileData.email,
        telefono: profileData.telefono,
        direccion: profileData.direccion
      };
      
      console.log('📤 Enviando datos del perfil:', dataToSave);
      
      const result = await onUpdateProfile(dataToSave);
      
      if (result.success) {
        setEditingProfile(false);
        alert(result.message || 'Perfil actualizado correctamente');
      } else {
        alert('Error al actualizar el perfil:\n' + (result.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      alert('Error al actualizar el perfil: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileData(user);
    setEditingProfile(false);
  };

  const handleProfileInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = () => {
    alert('Funcionalidad de cambio de foto en desarrollo');
  };

  return (
    <div className="section-placeholder">
      <div className="profile-section">
        <div className="section-header">
          <div className="section-title">
            <User className="w-6 h-6 text-blue-600" />
            <h2>Mi Perfil</h2>
          </div>
          
          {!editingProfile ? (
            <button 
              className="btn-primary"
              onClick={handleEditProfile}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Perfil
            </button>
          ) : (
            <div className="profile-actions">
              <button 
                className="btn-success"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button 
                className="btn-secondary"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </button>
            </div>
          )}
        </div>

        <div className="profile-content">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-container">
              {profileData.foto ? (
                <img
                  src={profileData.foto}
                  alt="Foto de perfil"
                  className="profile-avatar-large"
                />
              ) : (
                <div className="profile-avatar-large-fallback">
                  <span className="profile-initials-large">
                    {getUserInitials(profileData.nombres, profileData.apellidos)}
                  </span>
                </div>
              )}
              {editingProfile && (
                <button 
                  className="avatar-edit-btn"
                  onClick={handleImageUpload}
                  title="Cambiar foto de perfil"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="profile-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <User className="w-4 h-4" />
                  Nombres *
                </label>
                {editingProfile ? (
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.nombres || ''}
                    onChange={(e) => handleProfileInputChange('nombres', e.target.value)}
                    placeholder="Ingresa tus nombres"
                    required
                  />
                ) : (
                  <div className="form-value">{profileData.nombres || 'No especificado'}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <User className="w-4 h-4" />
                  Apellidos *
                </label>
                {editingProfile ? (
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.apellidos || ''}
                    onChange={(e) => handleProfileInputChange('apellidos', e.target.value)}
                    placeholder="Ingresa tus apellidos"
                    required
                  />
                ) : (
                  <div className="form-value">{profileData.apellidos || 'No especificado'}</div>
                )}
              </div>

              {/* Campo Sexo */}
              <div className="form-group">
                <label className="form-label">
                  <VenusAndMars className="w-4 h-4" />
                  Sexo
                </label>
                {editingProfile ? (
                  <select
                    className="form-input"
                    value={profileData.sexo || ''}
                    onChange={(e) => handleProfileInputChange('sexo', e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                ) : (
                  <div className="form-value">
                    {profileData.sexo 
                      ? (profileData.sexo.toUpperCase() === 'M' 
                          ? 'Masculino' 
                          : profileData.sexo.toUpperCase() === 'F' 
                            ? 'Femenino' 
                            : profileData.sexo)
                      : 'No especificado'}
                  </div>
                )}
              </div>

              {/* Campo Fecha de Nacimiento */}
              <div className="form-group">
                <label className="form-label">
                  <Calendar className="w-4 h-4" />
                  Fecha de Nacimiento
                </label>
                {editingProfile ? (
                  <input
                    type="date"
                    className="form-input"
                    value={formatDateForInput(profileData.fecha_nac)}
                    onChange={(e) => handleProfileInputChange('fecha_nac', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                ) : (
                  <div className="form-value">
                    {formatDateForDisplay(profileData.fecha_nac)}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail className="w-4 h-4" />
                  Correo Electrónico
                </label>
                {editingProfile ? (
                  <input
                    type="email"
                    className="form-input"
                    value={profileData.email || ''}
                    onChange={(e) => handleProfileInputChange('email', e.target.value)}
                    placeholder="email@ejemplo.com"
                  />
                ) : (
                  <div className="form-value">{profileData.email || 'No especificado'}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </label>
                {editingProfile ? (
                  <input
                    type="tel"
                    className="form-input"
                    value={profileData.telefono || ''}
                    onChange={(e) => handleProfileInputChange('telefono', e.target.value)}
                    placeholder="0987654321"
                  />
                ) : (
                  <div className="form-value">{profileData.telefono || 'No especificado'}</div>
                )}
              </div>

              <div className="form-group form-group-full">
                <label className="form-label">
                  <MapPin className="w-4 h-4" />
                  Dirección
                </label>
                {editingProfile ? (
                  <textarea
                    className="form-textarea"
                    value={profileData.direccion || ''}
                    onChange={(e) => handleProfileInputChange('direccion', e.target.value)}
                    rows="3"
                    placeholder="Dirección completa"
                  />
                ) : (
                  <div className="form-value">{profileData.direccion || 'No especificado'}</div>
                )}
              </div>

              {/* Campos de solo lectura */}
              <div className="form-group">
                <label className="form-label">
                  <Shield className="w-4 h-4" />
                  Rol del Sistema
                </label>
                <div className="form-value">
                  <span className={`role-badge ${profileData.rol?.nombre_rol?.toLowerCase()}`}>
                    {profileData.rol?.nombre_rol || 'Sin rol'}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar className="w-4 h-4" />
                  Fecha de Registro
                </label>
                <div className="form-value">
                  {formatDateForDisplay(profileData.fecha_registro)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;