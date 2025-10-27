// src/pages/admin/Dashboard.js
// Panel de Administración - Dashboard.js con datos reales 593

//importar librerías y servicios
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authServices';   // Servicio de autenticación
import userService from '../../services/userServices';   // Servicio para manejar datos de usuarios


// Importar componentes separados
import NotificationDropdown from '../../components/NotificationDropdown';
import UserProfile from '../../components/UserProfile';
import UsersSection from '../../components/UsersSection';
import InvoicesSection from '../../components/InvoicesSection';
import ProfileSection from '../../components/ProfileSection';

//Importar estilos
import './style.css';

// Importar iconos
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
  Shield
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [notifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Estados para datos reales
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    usersByRole: {
      administrador: 0,
      cliente: 0,
      lector: 0,
      cajero: 0
    }
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  useEffect(() => {
    // Verificar autenticación y obtener datos del usuario
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser || !authService.isAuthenticated()) {
      console.log('Usuario no autenticado, redirigiendo al login');
      navigate('/login');
      return;
    }

    setUser(currentUser);
    console.log('Usuario autenticado:', currentUser);

    // Verificar sesión con el servidor
    const verifySession = async () => {
      const result = await authService.verifySession();
      if (!result.success) {
        console.log('Sesión inválida, redirigiendo al login');
        navigate('/login');
      }
    };

    verifySession();
  }, [navigate]);

  // Cargar datos reales de usuarios
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Función para cargar datos del dashboard
  const loadDashboardData = async () => {
    try {
      setDataLoading(true);
      setDataError(null);

      // Obtener todos los usuarios
      const result = await userService.getUsers({
        limit: 1000 // Obtener todos los usuarios para estadísticas
      });

      if (result.success) {
        const usersData = Array.isArray(result.data) 
        ? result.data 
        : result.data.usuarios || [];

        // Calcular estadísticas reales
        const totalUsers = usersData.length;
        const activeUsers = usersData.filter(u => u.activo).length;
        const inactiveUsers = totalUsers - activeUsers;

        // Contar usuarios por rol
        const usersByRole = usersData.reduce((acc, user) => {
          const rol = user.rol?.toLowerCase() || 'sin_rol';
          acc[rol] = (acc[rol] || 0) + 1;
          return acc;
        }, {
          administrador: 0,
          cliente: 0,
          lector: 0,
          cajero: 0
        });

        setStats({
          totalUsers,
          activeUsers,
          inactiveUsers,
          usersByRole
        });

      } else {
        setDataError(result.message || 'Error al cargar datos');
        console.error('Error cargando usuarios:', result.message);
      }

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      setDataError('Error al cargar datos del dashboard');
    } finally {
      setDataLoading(false);
    }
  };

  // Función para manejar el cierre de sesión
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

  // Función para manejar el refresh
  const handleRefresh = async () => {
    setLoading(true);
    await loadDashboardData();
    setLoading(false);
  };

  // Handlers para las notificaciones
  const handleMarkAsRead = (notificationId) => {
    console.log('Marcar como leída:', notificationId);
  };

  const handleViewAllNotifications = () => {
    console.log('Ver todas las notificaciones');
  };

  

  const handleSettingsClick = () => {
    setActiveSection('settings');
  };

  // Handler para actualizar perfil
  const handleUpdateProfile = async (profileData) => {
  try {
    console.log('📤 Actualizando perfil con datos:', profileData);
    
    // Validar que tenemos el ID del usuario
    if (!user?.id_usuario_sistema) {
      throw new Error('No se encontró el ID del usuario');
    }

    // Preparar los datos para enviar al backend
    const dataToUpdate = {
      nombres: profileData.nombres,
      apellidos: profileData.apellidos,
      sexo: profileData.sexo,
      fecha_nac: profileData.fecha_nac,
      email: profileData.email,
      telefono: profileData.telefono || null,
      direccion: profileData.direccion || null,
      // No incluir rol, activo, fecha_registro (campos del sistema)
    };

    console.log('📦 Datos a enviar al backend:', dataToUpdate);

    // Llamar al servicio de usuarios (asume que lo tienes importado)
    const result = await userService.updateUser(user.id_usuario_sistema, dataToUpdate);
    
    if (result.success) {
      console.log('✅ Perfil actualizado exitosamente:', result.data);
      
      // Actualizar el estado local con los datos devueltos por el backend
      setUser(prevUser => ({
        ...prevUser,
        ...result.data
      }));
      
      return { 
        success: true,
        message: 'Perfil actualizado correctamente'
      };
    } else {
      console.error('❌ Error del servidor:', result.message);
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

  // Calcular cambio porcentual (simulado por ahora)
  const calculatePercentageChange = (current, previous = 0) => {
    if (previous === 0) return '+100%';
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
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

  // Tarjetas de estadísticas con datos reales
  const statCards = [
    { 
      title: 'Total Usuarios', 
      value: dataLoading ? '...' : stats.totalUsers.toString(), 
      change: calculatePercentageChange(stats.totalUsers), 
      color: 'blue',
      icon: Users,
      trend: 'up'
    },
    { 
      title: 'Usuarios Activos', 
      value: dataLoading ? '...' : stats.activeUsers.toString(), 
      change: calculatePercentageChange(stats.activeUsers), 
      color: 'green',
      icon: Activity,
      trend: 'up'
    },
    { 
      title: 'Clientes', 
      value: dataLoading ? '...' : (stats.usersByRole.cliente || 0).toString(), 
      change: calculatePercentageChange(stats.usersByRole.cliente), 
      color: 'emerald',
      icon: User,
      trend: 'up'
    },
    { 
      title: 'Usuarios Inactivos', 
      value: dataLoading ? '...' : stats.inactiveUsers.toString(), 
      change: calculatePercentageChange(stats.inactiveUsers), 
      color: 'orange',
      icon: AlertCircle,
      trend: stats.inactiveUsers > 0 ? 'down' : 'up'
    }
  ];

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
                disabled={loading}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
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
                onViewProfile={() => setActiveSection('profile')}
                onSettingsClick={handleSettingsClick}

              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="content">
          {activeSection === 'overview' && (
            <div>
              {/* Error Message */}
              {dataError && (
                <div className="error-banner">
                  <AlertCircle className="w-5 h-5" />
                  <span>{dataError}</span>
                  <button onClick={handleRefresh} className="btn-link">
                    Reintentar
                  </button>
                </div>
              )}

              {/* Stats Grid */}
              <div className="stats-grid">
                {statCards.map((stat, index) => (
                  <StatCard key={index} stat={stat} />
                ))}
              </div>

              {/* Content Grid */}
              <div className="content-grid">
                {/* Distribución de Usuarios por Rol */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Usuarios por Rol</h3>
                    <button className="btn-link" onClick={() => setActiveSection('users')}>
                      Ver todos
                    </button>
                  </div>
                  <div className="role-distribution">
                    {dataLoading ? (
                      <div className="loading-state">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        <p>Cargando datos...</p>
                      </div>
                    ) : (
                      <div className="role-stats-list">
                        <div className="role-stat-item">
                          <div className="role-stat-label">
                            <Shield className="w-4 h-4 text-red-500" />
                            <span>Administradores</span>
                          </div>
                          <span className="role-stat-value">{stats.usersByRole.administrador || 0}</span>
                        </div>
                        <div className="role-stat-item">
                          <div className="role-stat-label">
                            <User className="w-4 h-4 text-blue-500" />
                            <span>Clientes</span>
                          </div>
                          <span className="role-stat-value">{stats.usersByRole.cliente || 0}</span>
                        </div>
                        <div className="role-stat-item">
                          <div className="role-stat-label">
                            <Activity className="w-4 h-4 text-green-500" />
                            <span>Lectores</span>
                          </div>
                          <span className="role-stat-value">{stats.usersByRole.lector || 0}</span>
                        </div>
                        <div className="role-stat-item">
                          <div className="role-stat-label">
                            <DollarSign className="w-4 h-4 text-yellow-500" />
                            <span>Cajeros</span>
                          </div>
                          <span className="role-stat-value">{stats.usersByRole.cajero || 0}</span>
                        </div>
                      </div>
                    )}
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

          {/* Profile Section - Ahora usando componente separado */}
          {activeSection === 'profile' && (
            <ProfileSection 
              user={user}  // pasar datos del usuario
              onUpdateProfile={handleUpdateProfile} // función para actualizar perfil
            />
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