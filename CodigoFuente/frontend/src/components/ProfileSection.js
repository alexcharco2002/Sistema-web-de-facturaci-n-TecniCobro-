import { User, Edit, Save, X, Camera, Mail, Phone, MapPin, Shield, Calendar } from "lucide-react";

const ProfileSection = ({
  profileData,
  editingProfile,
  handleEditProfile,
  handleSaveProfile,
  handleCancelEdit,
  handleProfileInputChange,
  getUserInitials
}) => {
  return (
    <div className="section-placeholder">
      <div className="profile-section">
        <div className="section-header">
          <div className="section-title">
            <User className="w-6 h-6 text-blue-600" />
            <h2>Mi Perfil</h2>
          </div>

          {!editingProfile ? (
            <button className="btn-primary" onClick={handleEditProfile}>
              <Edit className="w-4 h-4 mr-2" />
              Editar Perfil
            </button>
          ) : (
            <div className="profile-actions">
              <button className="btn-success" onClick={handleSaveProfile}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </button>
              <button className="btn-secondary" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </button>
            </div>
          )}
        </div>

        <div className="profile-content">
          {/* Avatar */}
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
                  onClick={() => alert("Funcionalidad de cambio de foto en desarrollo")}
                  title="Cambiar foto de perfil"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Formulario */}
          <div className="profile-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <User className="w-4 h-4" />
                  Nombres
                </label>
                {editingProfile ? (
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.nombres || ""}
                    onChange={(e) => handleProfileInputChange("nombres", e.target.value)}
                    placeholder="Ingresa tus nombres"
                  />
                ) : (
                  <div className="form-value">{profileData.nombres || "No especificado"}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <User className="w-4 h-4" />
                  Apellidos
                </label>
                {editingProfile ? (
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.apellidos || ""}
                    onChange={(e) => handleProfileInputChange("apellidos", e.target.value)}
                    placeholder="Ingresa tus apellidos"
                  />
                ) : (
                  <div className="form-value">{profileData.apellidos || "No especificado"}</div>
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
                    value={profileData.correo || ""}
                    onChange={(e) => handleProfileInputChange("correo", e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                ) : (
                  <div className="form-value">{profileData.correo || "No especificado"}</div>
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
                    value={profileData.telefono || ""}
                    onChange={(e) => handleProfileInputChange("telefono", e.target.value)}
                    placeholder="Número de teléfono"
                  />
                ) : (
                  <div className="form-value">{profileData.telefono || "No especificado"}</div>
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
                    value={profileData.direccion || ""}
                    onChange={(e) => handleProfileInputChange("direccion", e.target.value)}
                    rows="3"
                    placeholder="Dirección completa"
                  />
                ) : (
                  <div className="form-value">{profileData.direccion || "No especificado"}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Shield className="w-4 h-4" />
                  Rol del Sistema
                </label>
                <div className="form-value">
                  <span className={`role-badge ${profileData.rol?.toLowerCase()}`}>
                    {profileData.rol || "Sin rol"}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar className="w-4 h-4" />
                  Fecha de Registro
                </label>
                <div className="form-value">
                  {profileData.fecha_registro
                    ? new Date(profileData.fecha_registro).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "No disponible"}
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
  