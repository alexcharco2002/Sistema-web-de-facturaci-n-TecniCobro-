// src/pages/admin/Dashboard.js
// Dashboard.js - Admin Dashboard Component (Refactorizado)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authServices';

// Importar componentes separados
import NotificationDropdown from '../../components/NotificationDropdown';
import UserProfile from '../../components/UserProfile';
import UsersSection from '../../components/UsersSection';
import InvoicesSection from '../../components/InvoicesSection';
import './style.css';

import { 
  Users, 
  FileText, 
  DollarSign, 
  Settings, 
  Search,
  Plus,
  Droplets,
  BarChart3,
  Calendar,
  TrendingUp,
  Activity,
  AlertCircle,
  RefreshCw,
  User,
  Edit,
  Save,
  X,
  Camera,
  Mail,
  Phone,
  MapPin,
  Shield
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [notifications] = useState([
    // Ejemplo de notificaciones
    {
      id: 1,
      type: 'warning',
      message: 'Factura #1234 pendiente de pago',
      time: '5 min ago',
      read: false
    },
    {
      id: 2,
      type: 'success',
      message: 'Backup del sistema completado',
      time: '1 hora ago',
      read: true
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({});

  useEffect(() => {
    // Verificar autenticación y obtener datos del usuario
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser || !authService.isAuthenticated()) {
      console.log('Usuario no autenticado, redirigiendo al login');
      navigate('/login');
      return;
    }

    setUser(currentUser);
    setProfileData(currentUser);
    console.log('Usuario autenticado:', currentUser);

    // Opcional: Verificar sesión con el servidor
    const verifySession = async () => {
      const result = await authService.verifySession();
      if (!result.success) {
        console.log('Sesión inválida, redirigiendo al login');
        navigate('/login');
      }
    };

    verifySession();
  }, [navigate]);

  // Función para manejar el cierre de sesión
  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      try {
        await authService.logout();
        navigate('/login');
      } catch (error) {
        console.error('Error en logout:', error);
        // Aún así redirigir al login
        navigate('/login');
      }
    }
  };

  // Función para manejar el refresh
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  // Handlers para las notificaciones
  const handleMarkAsRead = (notificationId) => {
    console.log('Marcar como leída:', notificationId);
    // Aquí iría la lógica para marcar la notificación como leída
  };

  const handleViewAllNotifications = () => {
    console.log('Ver todas las notificaciones');
    // Aquí iría la lógica para mostrar todas las notificaciones
  };

  // Handlers para el perfil de usuario
  const handleProfileClick = () => {
    setActiveSection('profile');
  };

  const handleSettingsClick = () => {
    setActiveSection('settings');
  };

  // Handler para actualizar perfil
  const handleUpdateProfile = async (profileData) => {
    try {
      // Aquí iría la llamada al servicio para actualizar el perfil
      console.log('Actualizando perfil:', profileData);
      
      // Simular llamada async
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return { success: false, message: error.message };
    }
  };


  // Funciones para manejar el perfil
  const handleEditProfile = () => {
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      const result = await handleUpdateProfile(profileData);
      if (result.success) {
        setUser(profileData);
        setEditingProfile(false);
        alert('Perfil actualizado correctamente');
      } else {
        alert('Error al actualizar el perfil: ' + (result.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
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

  // Función para obtener las iniciales del usuario
  const getUserInitials = (nombres, apellidos) => {
    const firstInitial = nombres ? nombres.charAt(0).toUpperCase() : '';
    const lastInitial = apellidos ? apellidos.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial || 'U';
  };

  // Mostrar loading mientras se carga el usuario
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
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'invoices', label: 'Facturación', icon: FileText },
    { id: 'payments', label: 'Pagos', icon: DollarSign },
    { id: 'reports', label: 'Reportes', icon: Calendar },
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  const stats = [
    { 
      title: 'Total Usuarios', 
      value: '1,247', 
      change: '+12%', 
      color: 'blue',
      icon: Users,
      trend: 'up'
    },
    { 
      title: 'Facturas Mes', 
      value: '89', 
      change: '+5%', 
      color: 'green',
      icon: FileText,
      trend: 'up'
    },
    { 
      title: 'Ingresos', 
      value: '$12,450', 
      change: '+18%', 
      color: 'emerald',
      icon: DollarSign,
      trend: 'up'
    },
    { 
      title: 'Pendientes', 
      value: '23', 
      change: '-8%', 
      color: 'orange',
      icon: AlertCircle,
      trend: 'down'
    }
  ];

  const recentActivity = [
    { id: 1, action: 'Nueva factura generada', user: 'Juan Pérez', time: '2 min ago', type: 'invoice', status: 'success' },
    { id: 2, action: 'Pago procesado', user: 'María González', time: '5 min ago', type: 'payment', status: 'success' },
    { id: 3, action: 'Usuario registrado', user: 'Carlos López', time: '10 min ago', type: 'user', status: 'info' },
    { id: 4, action: 'Lectura actualizada', user: 'Ana Martín', time: '15 min ago', type: 'reading', status: 'warning' },
    { id: 5, action: 'Backup completado', user: 'Sistema', time: '30 min ago', type: 'system', status: 'success' }
  ];

  const getActivityIcon = (type) => {
    switch(type) {
      case 'invoice': return FileText;
      case 'payment': return DollarSign;
      case 'user': return Users;
      case 'reading': return Activity;
      case 'system': return Settings;
      default: return Activity;
    }
  };

  // Componente de estadísticas
  const StatCard = ({ stat }) => {
    const IconComponent = stat.icon;
    const TrendIcon = TrendingUp;
    
    return (
      <div className="stat-card">
        <div className="stat-card-content">
          <div className="stat-info">
            <p className="stat-title">{stat.title}</p>
            <p className="stat-value">{stat.value}</p>
            <div className="stat-change">
              <TrendIcon className={`stat-trend-icon ${stat.trend === 'up' ? 'trend-up' : 'trend-down'}`} />
              <span className={`stat-change-text ${stat.trend === 'up' ? 'change-positive' : 'change-negative'}`}>
                {stat.change} vs mes anterior
              </span>
            </div>
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
              <p>Sistema Facturación</p>
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
              <h1>Panel de Administración</h1>
              <p>Bienvenido, {user.nombres || `${user.nombres} ${user.apellidos}`}</p>
            </div>

            <div className="header-actions">
              {/* Search */}
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar usuarios, facturas..."
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

              {/* Notifications Component */}
              <NotificationDropdown
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onViewAll={handleViewAllNotifications}
              />

              {/* User Profile Component */}
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
                {/* Recent Activity */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Actividad Reciente</h3>
                    <button className="btn-link">Ver todo</button>
                  </div>
                  <div className="activity-list">
                    {recentActivity.map((activity) => {
                      const IconComponent = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="activity-item">
                          <div className="activity-icon">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="activity-content">
                            <p className="activity-action">{activity.action}</p>
                            <p className="activity-meta">{activity.user} • {activity.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Acciones Rápidas</h3>
                  </div>
                  <div className="quick-actions-grid">
                    <button className="quick-action-btn" onClick={() => setActiveSection('users')}>
                      <Plus className="quick-action-icon" />
                      <span className="quick-action-text">Nuevo Usuario</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => setActiveSection('invoices')}>
                      <FileText className="quick-action-icon" />
                      <span className="quick-action-text">Nueva Factura</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => setActiveSection('reports')}>
                      <BarChart3 className="quick-action-icon" />
                      <span className="quick-action-text">Ver Reportes</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => setActiveSection('settings')}>
                      <Settings className="quick-action-icon" />
                      <span className="quick-action-text">Configurar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Section integrada en el Dashboard */}
          {activeSection === 'profile' && (
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
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={handleCancelEdit}
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
                          onClick={() => alert('Funcionalidad de cambio de foto en desarrollo')}
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
                          Nombres
                        </label>
                        {editingProfile ? (
                          <input
                            type="text"
                            className="form-input"
                            value={profileData.nombres || ''}
                            onChange={(e) => handleProfileInputChange('nombres', e.target.value)}
                            placeholder="Ingresa tus nombres"
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
                            placeholder="Ingresa tus apellidos"
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
                            value={profileData.correo || ''}
                            onChange={(e) => handleProfileInputChange('correo', e.target.value)}
                            placeholder="correo@ejemplo.com"
                          />
                        ) : (
                          <div className="form-value">{profileData.correo || 'No especificado'}</div>
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
                            placeholder="Número de teléfono"
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

                      <div className="form-group">
                        <label className="form-label">
                          <Shield className="w-4 h-4" />
                          Rol del Sistema
                        </label>
                        <div className="form-value">
                          <span className={`role-badge ${profileData.rol?.toLowerCase()}`}>
                            {profileData.rol || 'Sin rol'}
                          </span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          <Calendar className="w-4 h-4" />
                          Fecha de Registro
                        </label>
                        <div className="form-value">
                          {profileData.fecha_registro ? 
                            new Date(profileData.fecha_registro).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 
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

          {/* Secciones usando componentes separados */}
          {activeSection === 'users' && <UsersSection />}

          {activeSection === 'invoices' && <InvoicesSection />}

          

          {activeSection === 'payments' && (
            <div className="section-placeholder">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2>Gestión de Pagos</h2>
              <p>El módulo de pagos permitirá procesar y rastrear todos los pagos del sistema.</p>
            </div>
          )}

          {activeSection === 'reports' && (
            <div className="section-placeholder">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2>Centro de Reportes</h2>
              <p>Próximamente tendrás acceso a reportes detallados y análisis de datos.</p>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="section-placeholder">
              <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2>Configuración del Sistema</h2>
              <p>Panel de configuración para personalizar el comportamiento del sistema.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;