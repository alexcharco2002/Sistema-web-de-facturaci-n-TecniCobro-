// src/pages/cliente/Dashboard.js
// Panel de Cliente - Dashboard con Módulos Dinámicos y Cambio de Contraseña Obligatorio

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authServices';
import userService from '../../services/userServices';

// Importar configuración de módulos para clientes
import { buildModulesFromPermissions } from '../../utils/modulesDefinitions';

// Importar componentes
import NotificationDropdown from '../../components/NotificationDropdown';
import UserProfile from '../../components/UserProfile';
import ChangePasswordModal from '../../components/ChangePasswordModal';

// Importar iconos
import { 
  FileText, 
  Search,
  Droplets,
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
  CreditCard,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Calendar
} from 'lucide-react';

const ClienteDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [notifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [organizedModules, setOrganizedModules] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({});

  // Estados para el modal de cambio de contraseña
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Estados para datos del cliente
  const [clientStats, setClientStats] = useState({
    currentInvoice: 0,
    monthlyConsumption: 0,
    pendingInvoices: 0,
    lastPayment: 0
  });
  const [dataLoading, setDataLoading] = useState(true);

  // ============================================================================
  // EFECTOS Y CARGA DE DATOS
  // ============================================================================
  
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser || !authService.isAuthenticated()) {
      console.log('Usuario no autenticado, redirigiendo al login');
      navigate('/login');
      return;
    }

    setUser(currentUser);
    setProfileData(currentUser);
    const permissions = authService.getUserPermissions();
    setUserPermissions(permissions);

    // 🔥 VERIFICAR SI ES PRIMER LOGIN Y MOSTRAR MODAL
    if (currentUser.primer_login === true || currentUser.primer_login === 1) {
      console.log('🟢 Es el primer login del cliente, mostrando modal de cambio de contraseña');
      setShowChangePasswordModal(true);
    }
    
    // Construir módulos organizados por categorías para clientes
    const modules = buildModulesFromPermissions(permissions);
    setOrganizedModules(modules);
    
    // Inicializar categorías expandidas
    const initialExpanded = {};
    modules.forEach(category => {
      initialExpanded[category.id] = category.defaultOpen !== false;
    });
    setExpandedCategories(initialExpanded);
    
    console.log('✅ Cliente autenticado:', {
      nombre: currentUser.nombres,
      rol: currentUser.rol?.nombre_rol,
      permisos: permissions.length,
      categorias: modules.length,
      primer_login: currentUser.primer_login
    });

    // Verificar sesión
    const verifySession = async () => {
      const result = await authService.verifySession();
      if (!result.success) {
        console.log('Sesión inválida, redirigiendo al login');
        navigate('/login');
      }
    };

    verifySession();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadClientData();
    }
  }, [user]);

  const loadClientData = async () => {
    try {
      setDataLoading(true);
      
      // Aquí cargarías los datos específicos del cliente
      // Por ahora usamos valores de ejemplo
      setClientStats({
        currentInvoice: 0,
        monthlyConsumption: 0,
        pendingInvoices: 0,
        lastPayment: 0
      });

    } catch (error) {
      console.error('Error cargando datos del cliente:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      try {
        await authService.logout();
        navigate('/login');
      } catch (error) {
        console.error('Error en logout:', error);
        navigate('/login');
      }
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadClientData();
    setLoading(false);
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
      if (!user?.id_usuario_sistema) {
        throw new Error('No se encontró el ID del usuario');
      }

      const dataToUpdate = {
        nombres: profileData.nombres,
        apellidos: profileData.apellidos,
        email: profileData.email,
        telefono: profileData.telefono || null,
        direccion: profileData.direccion || null,
      };

      const result = await userService.updateUser(user.id_usuario_sistema, dataToUpdate);
      
      if (result.success) {
        setUser(prevUser => ({
          ...prevUser,
          ...result.data
        }));
        setProfileData(result.data);
        setEditingProfile(false);
        alert('Perfil actualizado correctamente');
      } else {
        alert(result.message || 'Error al actualizar el perfil');
      }
      
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      alert(error.message || 'Error al actualizar el perfil');
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

  // 🔥 HANDLER PARA CERRAR EL MODAL DE CAMBIO DE CONTRASEÑA
  const handleClosePasswordModal = () => {
    // Solo permitir cerrar si NO es primer login
    if (!user?.primer_login) {
      setShowChangePasswordModal(false);
    }
  };

  // 🔥 HANDLER PARA ÉXITO EN CAMBIO DE CONTRASEÑA
  const handlePasswordChangeSuccess = async () => {
    console.log('✅ Contraseña cambiada exitosamente');
    
    // Actualizar el estado del usuario para quitar primer_login
    setUser(prevUser => ({
      ...prevUser,
      primer_login: false
    }));

    // Actualizar en el localStorage también
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      currentUser.primer_login = false;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    // Cerrar el modal
    setShowChangePasswordModal(false);

    // Recargar datos del cliente
    await loadClientData();
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getUserInitials = (nombres, apellidos) => {
    const firstInitial = nombres ? nombres.charAt(0).toUpperCase() : '';
    const lastInitial = apellidos ? apellidos.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial || 'C';
  };

  // ============================================================================
  // COMPONENTES
  // ============================================================================

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

  // ============================================================================
  // RENDER LOADING
  // ============================================================================

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

  // Tarjetas de estadísticas del cliente
  const stats = [
    { 
      title: 'Factura Actual', 
      value: dataLoading ? '...' : `$${clientStats.currentInvoice}`, 
      change: '+0%', 
      color: 'blue',
      icon: FileText,
      trend: 'up'
    },
    { 
      title: 'Consumo del Mes', 
      value: dataLoading ? '...' : `${clientStats.monthlyConsumption} m³`, 
      change: '+0%', 
      color: 'green',
      icon: Activity,
      trend: 'down'
    },
    { 
      title: 'Facturas Pendientes', 
      value: dataLoading ? '...' : clientStats.pendingInvoices.toString(), 
      change: '+0%', 
      color: 'orange',
      icon: Clock,
      trend: 'down'
    },
    { 
      title: 'Último Pago', 
      value: dataLoading ? '...' : `$${clientStats.lastPayment}`, 
      change: '', 
      color: 'emerald',
      icon: CheckCircle,
      trend: 'up'
    }
  ];

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <div className="dashboard">
      {/* Sidebar con Categorías Dinámicas */}
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
          {organizedModules.map((category) => (
            <div key={category.id} className="nav-category">
              {/* Header de categoría */}
              {category.collapsible ? (
                <button
                  className="category-header"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="category-header-content">
                    <category.icon className="w-4 h-4" />
                    <span className="category-label">{category.label}</span>
                  </div>
                  {expandedCategories[category.id] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <div className="category-header-static">
                  <category.icon className="w-4 h-4" />
                  <span className="category-label">{category.label}</span>
                </div>
              )}

              {/* Módulos de la categoría */}
              {(!category.collapsible || expandedCategories[category.id]) && (
                <div className="category-modules">
                  {category.modules.map((module) => {
                    const IconComponent = module.icon;
                    return (
                      <button
                        key={module.id}
                        onClick={() => setActiveSection(module.id)}
                        className={`nav-item ${activeSection === module.id ? 'active' : ''}`}
                        title={module.description || module.label}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span>{module.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Información de permisos del usuario */}
        <div className="sidebar-footer">
          <div className="user-permissions-info">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">
              {userPermissions.length} permisos activos
            </span>
          </div>
        </div>
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
                disabled={loading}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
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
                onViewProfile={handleProfileClick}
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

                {/* Estado de Cuenta */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Estado de Cuenta</h3>
                  </div>
                  <div className="activity-list">
                    {dataLoading ? (
                      <div className="loading-state">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        <p>Cargando datos...</p>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>No tienes facturas pendientes</p>
                      </div>
                    )}
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
                          <span className={`role-badge ${profileData.rol?.nombre_rol?.toLowerCase()}`}>
                            {profileData.rol?.nombre_rol || 'Cliente'}
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

          {/* Secciones genéricas para otros módulos */}
          {!['overview', 'profile'].includes(activeSection) && (
            <div className="section-placeholder">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2>Módulo en Desarrollo</h2>
              <p>Esta sección estará disponible próximamente.</p>
            </div>
          )}
        </main>
      </div>

      {/* 🔥 MODAL DE CAMBIO DE CONTRASEÑA */}
      {user && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={handleClosePasswordModal}
          userId={user.id_usuario_sistema}
          userEmail={user.email}
          isPrimerLogin={user.primer_login === true || user.primer_login === 1}
          onSuccess={handlePasswordChangeSuccess}
        />
      )}
    </div>
  );
};

export default ClienteDashboard;