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
import ProfileSection from '../../components/ProfileSection';
import NotificationsSection from '../../components/NotificationsSection';
import UsersSection from '../../components/UsersSection';
import RolesSection from '../../components/RolesSection';
import SectorsSection from '../../components/SectorsSection';

// Importar iconos
import { 
  FileText, 
  Search,
  Droplets,
  RefreshCw,
  Shield,
  CreditCard,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

// 📦 Mapeo de componentes dinámicos para módulos del cliente
const componentMap = {
  UsersSection,
  ProfileSection,
  NotificationsSection,
  RolesSection,
  SectorsSection
};

const ClienteDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [notifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [organizedModules, setOrganizedModules] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Estados para el modal de cambio de contraseña
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Handler para actualizar perfil
  const handleUpdateProfile = async (profileData) => {
    try {
      if (!user?.id_usuario_sistema) {
        throw new Error('No se encontró el ID del usuario');
      }

      const dataToUpdate = {
        nombres: profileData.nombres,
        apellidos: profileData.apellidos,
        sexo: profileData.sexo,
        fecha_nac: profileData.fecha_nac,
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
        
        return { 
          success: true,
          message: 'Perfil actualizado correctamente'
        };
      } else {
        return { 
          success: false, 
          message: result.message || 'Error al actualizar el perfil'
        };
      }
      
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      return { 
        success: false, 
        message: error.message || 'Error al actualizar el perfil'
      };
    }
  };

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
    setActiveSection('notifications');
    setExpandedCategories(prev => ({
      ...prev,
      SYSTEM: true // 👈 esta es la categoría de "Notificaciones"
    }));
  };

  const handleProfileClick = () => {
    setActiveSection('profile');
  };

  const handleSettingsClick = () => {
    setActiveSection('settings');
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

          {/* Secciones dinámicas del sistema */}
          {activeSection !== 'overview' && (() => {
            // Buscar el módulo activo según el ID
            const activeModule = organizedModules
              .flatMap(cat => cat.modules)
              .find(mod => mod.id === activeSection);

            if (!activeModule) {
              // Si no existe, revisar si es una sección fija (perfil o notificaciones)
              if (activeSection === 'profile') {
                return <ProfileSection user={user} onUpdateProfile={handleUpdateProfile} />;
              }
              if (activeSection === 'notifications') {
                return (
                  <NotificationsSection 
                    notifications={notifications}
                    onMarkAsRead={handleMarkAsRead}
                  />
                );
              }

              // Si no está definida, mostrar mensaje genérico
              return (
                <div className="section-placeholder">
                  <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h2>Módulo en Desarrollo</h2>
                  <p>Esta sección estará disponible próximamente.</p>
                </div>
              );
            }

            // Si el módulo existe y tiene un componente definido
            const Component = componentMap[activeModule.componentName];
            if (Component) {
              return <Component user={user} />;
            }

            // Si no hay componente vinculado
            return (
              <div className="section-placeholder">
                <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h2>{activeModule.label}</h2>
                <p>Componente no vinculado o en desarrollo.</p>
              </div>
            );
          })()}
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