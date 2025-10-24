// src/components/users/UsersSecureSection.js
// MODULO DE USUARIOS SEGUROS -- Componente para la gestión de usuarios con datos encriptados
import React, { useState, useEffect, useCallback } from 'react';
import './styleModeUser.css';
import usersSecureService from '../services/userSecureServices';

import { 

  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  X,
  Save,
  RefreshCw,
  CreditCard,
  AlertCircle,
  Shield,
  Lock
} from 'lucide-react';

const UsersSecureSection = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    usuario: '',
    nombres: '',
    apellidos: '',
    cedula: '',
    email: '',
    telefono: '',
    direccion: '',
    numtarjeta: '',
    rol: 'cliente',
    activo: true
  });

  // Función para cargar usuarios seguros del servidor
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await usersSecureService.getUsers({
        search: searchTerm,
        rol: filterRole === 'all' ? undefined : filterRole
      });

      if (result.success) {
        setUsers(result.data);
        console.log('✅ Usuarios seguros cargados:', result.data.length);
      } else {
        setError(result.message);
        console.error('Error al cargar usuarios seguros:', result.message);
      }
    } catch (err) {
      setError('Error al cargar usuarios seguros desde el servidor');
      console.error('Error en fetchUsers:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterRole]);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    console.log('🔄 Componente de usuarios seguros montado, cargando...');
    fetchUsers();
  }, [fetchUsers]);

  // Recargar cuando cambien los filtros
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, filterRole, fetchUsers]);

  // Filtrar usuarios localmente
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.usuario?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.rol === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Handlers para modal
  const openModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    setError(null);
    
    if (type === 'create') {
      setFormData({
        usuario: '',
        nombres: '',
        apellidos: '',
        cedula: '',
        email: '',
        telefono: '',
        direccion: '',
        numtarjeta: '',
        rol: 'cliente',
        activo: true
      });
    } else if (type === 'edit' && user) {
      setFormData({
        usuario: user.usuario,
        nombres: user.nombres,
        apellidos: user.apellidos,
        cedula: user.cedula || '',
        email: user.email || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        numtarjeta: user.numtarjeta || '',
        rol: user.rol,
        activo: user.activo
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setError(null);
  };

  // Handler para crear/editar usuario seguro
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      let result;
      
      if (modalType === 'create') {
        // Validaciones
        if (!formData.cedula || formData.cedula.length < 10) {
          setError('La cédula debe tener al menos 10 dígitos');
          return;
        }
        
        if (formData.numtarjeta && formData.numtarjeta.length < 13) {
          setError('El número de tarjeta debe tener al menos 13 dígitos');
          return;
        }
        
        result = await usersSecureService.createUser(formData);
      } else if (modalType === 'edit') {
        result = await usersSecureService.updateUser(selectedUser.id, formData);
      }
      
      if (result.success) {
        alert(result.message);
        await fetchUsers();
        closeModal();
      } else {
        setError(result.message);
      }

    } catch (error) {
      setError(error.message || 'Error al guardar usuario seguro');
    }
  };

  // Handler para eliminar usuario
  const handleDelete = async (userId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario seguro?')) {
      try {
        const result = await usersSecureService.deleteUser(userId);
        
        if (result.success) {
          alert(result.message);
          await fetchUsers();
        } else {
          alert('Error: ' + result.message);
        }
      } catch (error) {
        alert('Error al eliminar usuario: ' + error.message);
      }
    }
  };

  // Handler para toggle activo/inactivo
  const toggleUserStatus = async (userId) => {
    try {
      const result = await usersSecureService.toggleUserStatus(userId);
      
      if (result.success) {
        await fetchUsers();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      alert('Error al cambiar estado del usuario');
    }
  };

  const getRoleBadge = (rol) => {
    const roleClasses = {
      admin: 'bg-red-100 text-red-800',
      cliente: 'bg-blue-100 text-blue-800',
      operador: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleClasses[rol] || 'bg-gray-100 text-gray-800'}`}>
        {rol.charAt(0).toUpperCase() + rol.slice(1)}
      </span>
    );
  };

  // Función para enmascarar datos sensibles
  const maskSensitiveData = (data, type) => {
    if (!data) return 'N/A';
    
    switch(type) {
      case 'card':
        // Mostrar solo últimos 4 dígitos
        return `**** **** **** ${data.slice(-4)}`;
      case 'email':
        const [user, domain] = data.split('@');
        return `${user.substring(0, 2)}***@${domain}`;
      case 'phone':
        return `***-***-${data.slice(-4)}`;
      case 'cedula':
        return `*******${data.slice(-3)}`;
      default:
        return data;
    }
  };

  if (loading) {
    return (
      <div className="section-placeholder">
        <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-spin" />
        <h2>Cargando Usuarios Seguros</h2>
        <p>Por favor espera mientras cargamos la información encriptada...</p>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="section-placeholder">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2>Error al Cargar Usuarios Seguros</h2>
        <p>{error}</p>
        <button onClick={fetchUsers} className="btn-primary mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="users-section">
      {/* Header */}
      <div className="section-header">
        <div className="section-title">
          <Shield className="w-6 h-6 text-green-600" />
          <h2>Gestión de Usuarios Seguros</h2>
          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            <Lock className="w-3 h-3 inline mr-1" />
            Datos Encriptados
          </span>
        </div>
        <button 
          className="btn-primary"
          onClick={() => openModal('create')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario Seguro
        </button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="filters-section">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar usuarios seguros..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="filter-select"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">Todos los roles</option>
          <option value="admin">Administradores</option>
          <option value="cliente">Clientes</option>
          <option value="operador">Operadores</option>
        </select>

        <button 
          className="btn-secondary"
          onClick={fetchUsers}
          title="Recargar lista"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="users-stats">
        <div className="stat-item">
          <Shield className="stat-icon text-green-600" />
          <div>
            <p className="stat-label">Total Usuarios Seguros</p>
            <p className="stat-value">{users.length}</p>
          </div>
        </div>
        <div className="stat-item">
          <UserCheck className="stat-icon text-green-600" />
          <div>
            <p className="stat-label">Usuarios Activos</p>
            <p className="stat-value">{users.filter(u => u.activo).length}</p>
          </div>
        </div>
        <div className="stat-item">
          <UserX className="stat-icon text-red-600" />
          <div>
            <p className="stat-label">Usuarios Inactivos</p>
            <p className="stat-value">{users.filter(u => !u.activo).length}</p>
          </div>
        </div>
      </div>

      {/* Lista de Usuarios Seguros */}
      <div className="users-grid">
        {filteredUsers.map(user => (
          <div key={user.id} className={`user-card ${!user.activo ? 'inactive' : ''}`}>
            <div className="user-card-header">
              <div className="user-info">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="user-name">{user.nombres} {user.apellidos}</h3>
                  <div className="user-meta">
                    {getRoleBadge(user.rol)}
                    <span className={`status-badge ${user.activo ? 'active' : 'inactive'}`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="user-actions">
                <button 
                  className="action-btn view"
                  onClick={() => openModal('view', user)}
                  title="Ver detalles"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  className="action-btn edit"
                  onClick={() => openModal('edit', user)}
                  title="Editar usuario"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  className="action-btn toggle"
                  onClick={() => toggleUserStatus(user.id)}
                  title={user.activo ? 'Desactivar' : 'Activar'}
                >
                  {user.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </button>
                <button 
                  className="action-btn delete"
                  onClick={() => handleDelete(user.id)}
                  title="Eliminar usuario"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="user-card-body">
              <div className="user-contact">
                <div className="contact-item">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    {maskSensitiveData(user.email, 'email')}
                  </span>
                </div>
                {user.telefono && (
                  <div className="contact-item">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {maskSensitiveData(user.telefono, 'phone')}
                    </span>
                  </div>
                )}
                {user.cedula && (
                  <div className="contact-item">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      CI: {maskSensitiveData(user.cedula, 'cedula')}
                    </span>
                  </div>
                )}
                {user.numtarjeta && (
                  <div className="contact-item">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {maskSensitiveData(user.numtarjeta, 'card')}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="user-dates">
                {user.fecha_registro && (
                  <div className="date-item">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Registro: {new Date(user.fecha_registro).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="empty-state">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3>No se encontraron usuarios seguros</h3>
          <p>No hay usuarios seguros que coincidan con los criterios de búsqueda.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {modalType === 'create' && '🔒 Crear Usuario Seguro'}
                {modalType === 'edit' && '🔒 Editar Usuario Seguro'}
                {modalType === 'view' && '🔒 Detalles del Usuario Seguro'}
              </h3>
              <button 
                className="modal-close"
                onClick={closeModal}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="modal-body">
              {error && (
                <div className="alert alert-error mb-4">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {error}
                </div>
              )}

              {/* MODAL DE VISTA */}
              {modalType === 'view' && selectedUser && (
                <div className="user-details">
                  <div className="text-center mb-4">
                    <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                      <Shield className="w-12 h-12 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Los datos sensibles se muestran encriptados por seguridad
                    </p>
                  </div>
                  
                  <div className="detail-group">
                    <label>Usuario:</label>
                    <p>{selectedUser.usuario}</p>
                  </div>
                  <div className="detail-group">
                    <label>Nombre Completo:</label>
                    <p>{selectedUser.nombres} {selectedUser.apellidos}</p>
                  </div>
                  <div className="detail-group">
                    <label>Cédula (Encriptada):</label>
                    <p className="font-mono text-sm">{maskSensitiveData(selectedUser.cedula, 'cedula')}</p>
                  </div>
                  <div className="detail-group">
                    <label>email (Encriptado):</label>
                    <p className="font-mono text-sm">{maskSensitiveData(selectedUser.email, 'email')}</p>
                  </div>
                  {selectedUser.telefono && (
                    <div className="detail-group">
                      <label>Teléfono (Encriptado):</label>
                      <p className="font-mono text-sm">{maskSensitiveData(selectedUser.telefono, 'phone')}</p>
                    </div>
                  )}
                  {selectedUser.numtarjeta && (
                    <div className="detail-group">
                      <label>Tarjeta (Encriptada):</label>
                      <p className="font-mono text-sm">{maskSensitiveData(selectedUser.numtarjeta, 'card')}</p>
                    </div>
                  )}
                  <div className="detail-group">
                    <label>Rol:</label>
                    <p>{getRoleBadge(selectedUser.rol)}</p>
                  </div>
                  <div className="detail-group">
                    <label>Estado:</label>
                    <span className={`status-badge ${selectedUser.activo ? 'active' : 'inactive'}`}>
                      {selectedUser.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              )}

              {/* MODAL DE CREACIÓN/EDICIÓN */}
              {(modalType === 'create' || modalType === 'edit') && (
                <form onSubmit={handleSubmit} className="user-form">
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <Shield className="w-4 h-4 inline mr-1" />
                      Los datos sensibles serán encriptados automáticamente
                    </p>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Usuario *</label>
                      <input
                        type="text"
                        required
                        value={formData.usuario}
                        onChange={(e) => setFormData({...formData, usuario: e.target.value})}
                        placeholder="Nombre de usuario"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Nombres *</label>
                      <input
                        type="text"
                        required
                        value={formData.nombres}
                        onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                        placeholder="Nombres del usuario"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Apellidos *</label>
                      <input
                        type="text"
                        required
                        value={formData.apellidos}
                        onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                        placeholder="Apellidos del usuario"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>
                        <Lock className="w-3 h-3 inline mr-1" />
                        Cédula * (Se encriptará)
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.cedula}
                        onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                        placeholder="Número de cédula"
                        minLength="10"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>
                        <Lock className="w-3 h-3 inline mr-1" />
                        email * (Se encriptará)
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>
                        <Lock className="w-3 h-3 inline mr-1" />
                        Teléfono (Se encriptará)
                      </label>
                      <input
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                        placeholder="Número de teléfono"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>
                        <Lock className="w-3 h-3 inline mr-1" />
                        Número de Tarjeta (Se encriptará)
                      </label>
                      <input
                        type="text"
                        value={formData.numtarjeta}
                        onChange={(e) => setFormData({...formData, numtarjeta: e.target.value})}
                        placeholder="1234567890123456"
                        minLength="13"
                        maxLength="16"
                      />
                    </div>
                    
                    <div className="form-group form-group-full">
                      <label>
                        <Lock className="w-3 h-3 inline mr-1" />
                        Dirección (Se encriptará)
                      </label>
                      <textarea
                        value={formData.direccion}
                        onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                        placeholder="Dirección completa"
                        rows="3"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Rol *</label>
                      <select
                        required
                        value={formData.rol}
                        onChange={(e) => setFormData({...formData, rol: e.target.value})}
                      >
                        <option value="cliente">Cliente</option>
                        <option value="operador">Operador</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Estado</label>
                      <select
                        value={formData.activo}
                        onChange={(e) => setFormData({...formData, activo: e.target.value === 'true'})}
                      >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={closeModal}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
                      <Save className="w-4 h-4 mr-2" />
                      {modalType === 'create' ? 'Crear Usuario Seguro' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersSecureSection;