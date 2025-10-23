// src/pages/cliente/Dashboard.js
// Panel de Cliente - Dashboard.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authServices';

// Importar componentes
import NotificationDropdown from '../../components/NotificationDropdown';
import UserProfile from '../../components/UserProfile';

// Importar iconos
import { 
  FileText, 
  Search,
  Droplets,
  BarChart3,
  Calendar,
  TrendingUp,
  RefreshCw,
  User,
  Edit,
  Save,
  X,
  Camera,
  Mail,
  Phone,
  MapPin,
  Shield,
  DollarSign,
  CreditCard,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingDown
} from 'lucide-react';

const ClienteDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [notifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({});

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser || !authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    setUser(currentUser);
    setProfileData(currentUser);

    const verifySession = async () => {
      const result = await authService.verifySession();
      if (!result.success) {
        navigate('/login');
      }
    };

    verifySession();
  }, [navigate]);

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      try {
        await authService.logout();
        navigate('/login');
      } catch (error) {
        navigate('/login');
      }
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleMarkAsRead = (notificationId) => {
    console.log('Marcar como leída:', notificationId);
  };

  const handleViewAllNotifications = () => {
    console.log('Ver todas las notificaciones');
  };

  const handleProfileClick = () => {
    setActiveSection('profile');
  };

  const handleSettingsClick = () => {
    setActiveSection('settings');
  };

  const handleEditProfile = () => {
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUser(profileData);
      setEditingProfile(false);
      alert('Perfil actualizado correctamente');
    } catch (error) {
      alert('Error al actualizar el perfil');
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

  const getUserInitials = (nombres, apellidos) => {
    const firstInitial = nombres ? nombres.charAt(0).toUpperCase() : '';
    const lastInitial = apellidos ? apellidos.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial || 'C';
  };

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'overview', label: 'Panel General', icon: BarChart3 },
    { id: 'profile', label: 'Mi Perfil', icon: User },
    { id: 'invoices', label: 'Mis Facturas', icon: FileText },
    { id: 'payments', label: 'Historial de Pagos', icon: DollarSign },
    { id: 'consumption', label: 'Mi Consumo', icon: Activity },
    { id: 'support', label: 'Soporte', icon: AlertCircle }
  ];

  const stats = [
    { 
      title: 'Factura Actual', 
      value: '$0', 
      change: '0%', 
      color: 'blue',
      icon: FileText,
      trend: 'up'
    },
    { 
      title: 'Consumo del Mes', 
      value: '0 m³', 
      change: '0%', 
      color: 'green',
      icon: Activity,
      trend: 'down'
    },
    { 
      title: 'Facturas Pendientes', 
      value: '0', 
      change: '0%', 
      color: 'orange',
      icon: Clock,
      trend: 'down'
    },
    { 
      title: 'Último Pago', 
      value: '$0', 
      change: '', 
      color: 'emerald',
      icon: CheckCircle,
      trend: 'up'
    }
  ];

  const StatCard = ({ stat }) => {
    const IconComponent = stat.icon;
    const TrendIcon = stat.trend === 'down' ? TrendingDown : TrendingUp;
    
    return (
      <div className="stat-card">
        <div className="stat-card-content">
          <div className="stat-info">
            <p className="stat-title">{stat.title}</p>
            <p className="stat-value">{stat.value}</p>
            {stat.change && (
              <div className="stat-change">
                <TrendIcon className={`stat-trend-icon ${stat.trend === 'up' ? 'trend-up' : 'trend-down'}`} />
                <span className={`stat-change-text ${stat.trend === 'up' ? 'change-positive' : 'change-negative'}`}>
                  {stat.change} vs mes anterior
                </span>
              </div>
            )}
          </div>
          <div className={`stat-icon-wrapper bg-${stat.color}`}>
            <IconComponent className={`stat-icon text-${stat.color}`} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div className="logo-text">
              <h2>JAAP Sanjapamba</h2>
              <p>Portal del Cliente</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              >
                <IconComponent className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="header-title">
              <h1>Portal del Cliente</h1>
              <p>Bienvenido, {user.nombres || `${user.nombres} ${user.apellidos}`}</p>
            </div>

            <div className="header-actions">
              {/* Search */}
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar facturas, pagos..."
                  className="search-input"
                />
              </div>

              {/* Refresh Button */}
              <button 
                className={`refresh-btn ${loading ? 'loading' : ''}`}
                onClick={handleRefresh}
                title="Actualizar datos"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <NotificationDropdown
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onViewAll={handleViewAllNotifications}
              />

              {/* User Profile */}
              <UserProfile
                user={user}
                onLogout={handleLogout}
                onProfileClick={handleProfileClick}
                onSettingsClick={handleSettingsClick}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="content">
          {activeSection === 'overview' && (
            <div>
              {/* Stats Grid */}
              <div className="stats-grid">
                {stats.map((stat, index) => (
                  <StatCard key={index} stat={stat} />
                ))}
              </div>

              {/* Content Grid */}
              <div className="content-grid">
                {/* Acciones Rápidas */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Acciones Rápidas</h3>
                  </div>
                  <div className="quick-actions-grid">
                    <button className="quick-action-btn" onClick={() => setActiveSection('invoices')}>
                      <FileText className="quick-action-icon" />
                      <span className="quick-action-text">Ver Facturas</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => setActiveSection('payments')}>
                      <CreditCard className="quick-action-icon" />
                      <span className="quick-action-text">Realizar Pago</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => setActiveSection('consumption')}>
                      <Activity className="quick-action-icon" />
                      <span className="quick-action-text">Ver Consumo</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => setActiveSection('support')}>
                      <AlertCircle className="quick-action-icon" />
                      <span className="quick-action-text">Soporte</span>
                    </button>
                  </div>
                </div>

                {/* Información Importante */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Estado de Cuenta</h3>
                  </div>
                  <div className="activity-list">
                    <div className="empty-state">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No tienes facturas pendientes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && (
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
                  <div className="profile-avatar-section">
                    <div className="profile-avatar-container">
                      {profileData.foto ? (
                        <img src={profileData.foto} alt="Foto de perfil" className="profile-avatar-large" />
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
                          onClick={() => alert('Funcionalidad de cambio de foto en desarrollo')}
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

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
                            value={profileData.nombres || ''}
                            onChange={(e) => handleProfileInputChange('nombres', e.target.value)}
                          />
                        ) : (
                          <div className="form-value">{profileData.nombres || 'No especificado'}</div>
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
                            value={profileData.apellidos || ''}
                            onChange={(e) => handleProfileInputChange('apellidos', e.target.value)}
                          />
                        ) : (
                          <div className="form-value">{profileData.apellidos || 'No especificado'}</div>
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
                          />
                        ) : (
                          <div className="form-value">{profileData.direccion || 'No especificado'}</div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          <Shield className="w-4 h-4" />
                          Tipo de Cliente
                        </label>
                        <div className="form-value">
                          <span className={`role-badge ${profileData.rol?.toLowerCase()}`}>
                            {profileData.rol || 'Cliente'}
                          </span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          <Calendar className="w-4 h-4" />
                          Cliente Desde
                        </label>
                        <div className="form-value">
                          {profileData.fecha_registro ? 
                            new Date(profileData.fecha_registro).toLocaleDateString('es-ES') : 
                            'No disponible'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Otras secciones */}
          {activeSection === 'invoices' && (
            <div className="section-placeholder">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2>Mis Facturas</h2>
              <p>Consulta y descarga tus facturas de consumo de agua.</p>
            </div>
          )}

          {activeSection === 'payments' && (
            <div className="section-placeholder">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2>Historial de Pagos</h2>
              <p>Revisa el historial completo de tus pagos realizados.</p>
            </div>
          )}

          {activeSection === 'consumption' && (
            <div className="section-placeholder">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2>Mi Consumo de Agua</h2>
              <p>Visualiza estadísticas y gráficos de tu consumo mensual.</p>
            </div>
          )}

          {activeSection === 'support' && (
            <div className="section-placeholder">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2>Soporte y Ayuda</h2>
              <p>¿Tienes alguna duda? Contáctanos para asistencia.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClienteDashboard;