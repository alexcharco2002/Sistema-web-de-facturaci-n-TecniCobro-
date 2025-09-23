// src/components/users/UsersSection.js
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  Save,
  RefreshCw
} from 'lucide-react';

const UsersSection = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create', 'edit', 'view'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    direccion: '',
    rol: 'cliente',
    activo: true
  });

  // Simular datos de usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      // Simular llamada API
      setTimeout(() => {
        setUsers([
          {
            id: 1,
            nombres: 'Juan Carlos',
            apellidos: 'Pérez González',
            correo: 'juan.perez@email.com',
            telefono: '0987654321',
            direccion: 'Av. Principal 123',
            rol: 'admin',
            activo: true,
            fecha_registro: '2023-01-15',
            ultimo_acceso: '2024-01-10'
          },
          {
            id: 2,
            nombres: 'María Elena',
            apellidos: 'González López',
            correo: 'maria.gonzalez@email.com',
            telefono: '0987654322',
            direccion: 'Calle Secundaria 456',
            rol: 'cliente',
            activo: true,
            fecha_registro: '2023-02-20',
            ultimo_acceso: '2024-01-09'
          },
          {
            id: 3,
            nombres: 'Carlos Alberto',
            apellidos: 'Martínez Silva',
            correo: 'carlos.martinez@email.com',
            telefono: '0987654323',
            direccion: 'Jr. Los Pinos 789',
            rol: 'cliente',
            activo: false,
            fecha_registro: '2023-03-10',
            ultimo_acceso: '2023-12-15'
          }
        ]);
        setLoading(false);
      }, 1000);
    };

    fetchUsers();
  }, []);

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.correo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.rol === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Handlers para modal
  const openModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    
    if (type === 'create') {
      setFormData({
        nombres: '',
        apellidos: '',
        correo: '',
        telefono: '',
        direccion: '',
        rol: 'cliente',
        activo: true
      });
    } else if (user) {
      setFormData(user);
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  // Handler para crear/editar usuario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalType === 'create') {
        // Simular creación
        const newUser = {
          ...formData,
          id: users.length + 1,
          fecha_registro: new Date().toISOString().split('T')[0],
          ultimo_acceso: null
        };
        setUsers([...users, newUser]);
        alert('Usuario creado exitosamente');
      } else {
        // Simular edición
        setUsers(users.map(user => 
          user.id === selectedUser.id ? { ...user, ...formData } : user
        ));
        alert('Usuario actualizado exitosamente');
      }
      
      closeModal();
    } catch (error) {
      alert('Error al guardar usuario: ' + error.message);
    }
  };

  // Handler para eliminar usuario
  const handleDelete = async (userId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        setUsers(users.filter(user => user.id !== userId));
        alert('Usuario eliminado exitosamente');
      } catch (error) {
        alert('Error al eliminar usuario: ' + error.message);
      }
    }
  };

  // Handler para toggle activo/inactivo
  const toggleUserStatus = async (userId) => {
    try {
      setUsers(users.map(user => 
        user.id === userId ? { ...user, activo: !user.activo } : user
      ));
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

  if (loading) {
    return (
      <div className="section-placeholder">
        <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-spin" />
        <h2>Cargando Usuarios</h2>
        <p>Por favor espera mientras cargamos la información...</p>
      </div>
    );
  }

  return (
    <div className="users-section">
      {/* Header */}
      <div className="section-header">
        <div className="section-title">
          <Users className="w-6 h-6 text-blue-600" />
          <h2>Gestión de Usuarios</h2>
        </div>
        <button 
          className="btn-primary"
          onClick={() => openModal('create')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="filters-section">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
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
      </div>

      {/* Stats */}
      <div className="users-stats">
        <div className="stat-item">
          <Users className="stat-icon text-blue-600" />
          <div>
            <p className="stat-label">Total Usuarios</p>
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

      {/* Lista de Usuarios */}
      <div className="users-grid">
        {filteredUsers.map(user => (
          <div key={user.id} className={`user-card ${!user.activo ? 'inactive' : ''}`}>
            <div className="user-card-header">
              <div className="user-info">
                <h3 className="user-name">{user.nombres} {user.apellidos}</h3>
                <div className="user-meta">
                  {getRoleBadge(user.rol)}
                  <span className={`status-badge ${user.activo ? 'active' : 'inactive'}`}>
                    {user.activo ? 'Activo' : 'Inactivo'}
                  </span>
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
                  <span>{user.correo}</span>
                </div>
                <div className="contact-item">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{user.telefono}</span>
                </div>
                <div className="contact-item">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{user.direccion}</span>
                </div>
              </div>
              
              <div className="user-dates">
                <div className="date-item">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Registro: {new Date(user.fecha_registro).toLocaleDateString()}</span>
                </div>
                {user.ultimo_acceso && (
                  <div className="date-item">
                    <span>Último acceso: {new Date(user.ultimo_acceso).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="empty-state">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3>No se encontraron usuarios</h3>
          <p>No hay usuarios que coincidan con los criterios de búsqueda.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {modalType === 'create' && 'Crear Nuevo Usuario'}
                {modalType === 'edit' && 'Editar Usuario'}
                {modalType === 'view' && 'Detalles del Usuario'}
              </h3>
              <button 
                className="modal-close"
                onClick={closeModal}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="modal-body">
              {modalType === 'view' ? (
                <div className="user-details">
                  <div className="detail-group">
                    <label>Nombre Completo:</label>
                    <p>{selectedUser.nombres} {selectedUser.apellidos}</p>
                  </div>
                  <div className="detail-group">
                    <label>Correo Electrónico:</label>
                    <p>{selectedUser.correo}</p>
                  </div>
                  <div className="detail-group">
                    <label>Teléfono:</label>
                    <p>{selectedUser.telefono}</p>
                  </div>
                  <div className="detail-group">
                    <label>Dirección:</label>
                    <p>{selectedUser.direccion}</p>
                  </div>
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
              ) : (
                <form onSubmit={handleSubmit} className="user-form">
                  <div className="form-grid">
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
                      <label>Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={formData.correo}
                        onChange={(e) => setFormData({...formData, correo: e.target.value})}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Teléfono</label>
                      <input
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                        placeholder="Número de teléfono"
                      />
                    </div>
                    
                    <div className="form-group form-group-full">
                      <label>Dirección</label>
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
                      {modalType === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
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

export default UsersSection;