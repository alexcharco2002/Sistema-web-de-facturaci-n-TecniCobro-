// src/components/users/UsersSection.js
// MODULO DE USUARIOS - Con control de permisos granular
import React, { useState, useEffect, useCallback } from 'react';
import './styleModeUser.css';
import usersService from '../services/userServices';
import authService from '../services/authServices'; // 🔑 Importar authService

import { 
  Users, Plus, Search, Edit, Trash2, Eye, UserCheck, UserX,
  Mail, Phone, MapPin, Calendar, X, Save, RefreshCw, Key,
  Image as ImageIcon, AlertCircle
} from 'lucide-react';

const UsersSection = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    sexo: '',
    fecha_nac: '',
    cedula: '',
    email: '',
    telefono: '',
    direccion: '',
    id_rol: null,
    activo: true
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // 🔑 PERMISOS DEL USUARIO ACTUAL
  const [permissions, setPermissions] = useState({
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canChangePassword: false,
    canChangePhoto: false,
    canToggleStatus: false
  });

  // 🔑 Cargar permisos al montar el componente
  useEffect(() => {
    loadUserPermissions();
    loadRoles();
  }, []);

  const loadUserPermissions = () => {
    // Verificar permisos sobre el módulo 'usuarios'
    const canCreate = authService.hasPermission('usuarios', 'crear') || 
                     authService.hasPermission('usuarios', 'operaciones crud');
    
    const canUpdate = authService.hasPermission('usuarios', 'actualizar') || 
                     authService.hasPermission('usuarios', 'operaciones crud');
    
    const canDelete = authService.hasPermission('usuarios', 'eliminar') || 
                     authService.hasPermission('usuarios', 'operaciones crud');
    
    // ✅ Si puede crear, actualizar o eliminar, también debe poder leer
    const canRead = authService.hasPermission('usuarios', 'lectura') ||
               canCreate || canUpdate || canDelete ||
               authService.hasPermission('usuarios', 'operaciones crud');
    
    // Permisos adicionales 
    const canChangePassword = canUpdate; // Cambiar contraseña requiere actualizar
    const canChangePhoto = canUpdate; // Cambiar foto requiere actualizar
    const canToggleStatus = canUpdate; // Cambiar estado requiere actualizar

    setPermissions({
      canCreate,
      canRead,
      canUpdate,
      canDelete,
      canChangePassword,
      canChangePhoto,
      canToggleStatus
    });

    console.log('🔐 Permisos del usuario en módulo Usuarios:', {
      canCreate,
      canRead,
      canUpdate,
      canDelete
    });
  };

  const loadRoles = async () => {
    try {
      const result = await usersService.getRoles();
      if (result.success) {
        setRoles(result.data);
        console.log('✅ Roles cargados:', result.data);
      } else {
        console.error('Error cargando roles:', result.message);
      }
    } catch (error) {
      console.error('Error al cargar roles:', error);
    }
  };

  const fetchUsers = useCallback(async () => {
    // 🔑 Verificar si tiene permiso de lectura
    if (!permissions.canRead) {
      setError('No tienes permiso para ver usuarios');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await usersService.getUsers({
        search: debouncedSearchTerm,
        id_rol: filterRole === 'all' ? undefined : filterRole
      });

      if (result.success) {
        setUsers(result.data);
        console.log('✅ Usuarios cargados:', result.data.length);
      } else {
        setError(result.message);
        console.error('Error al cargar usuarios:', result.message);
      }
    } catch (err) {
      setError('Error al cargar usuarios desde el servidor');
      console.error('Error en fetchUsers:', err);
    } finally {
      setLoading(false);
    }
  }, [filterRole, debouncedSearchTerm, permissions.canRead]);

  useEffect(() => {
    if (permissions.canRead) {
      console.log('🔄 Componente montado, cargando usuarios...');
      fetchUsers();
    }
  }, [fetchUsers, permissions.canRead]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 700);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (permissions.canRead) {
      fetchUsers();
    }
  }, [debouncedSearchTerm, filterRole, fetchUsers, permissions.canRead]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.id_rol === parseInt(filterRole);
    
    return matchesSearch && matchesRole;
  });

  const openModal = (type, user = null) => {
    // 🔑 Verificar permisos antes de abrir modal
    if (type === 'create' && !permissions.canCreate) {
      alert('❌ No tienes permiso para crear usuarios');
      return;
    }
    if (type === 'edit' && !permissions.canUpdate) {
      alert('❌ No tienes permiso para editar usuarios');
      return;
    }
    if (type === 'password' && !permissions.canChangePassword) {
      alert('❌ No tienes permiso para cambiar contraseñas');
      return;
    }
    if (type === 'photo' && !permissions.canChangePhoto) {
      alert('❌ No tienes permiso para cambiar fotos de perfil');
      return;
    }

    setModalType(type);
    setSelectedUser(user);
    setError(null);
    
    if (type === 'create') {
      setFormData({
        nombres: '',
        apellidos: '',
        sexo: '',
        fecha_nac: '',
        cedula: '',
        email: '',
        telefono: '',
        direccion: '',
        id_rol: roles.length > 0 ? roles[0].id_rol : null,
        activo: true
      });
    } else if (type === 'edit' && user) {
      setFormData({
        nombres: user.nombres,
        apellidos: user.apellidos,
        sexo: user.sexo || '',
        fecha_nac: user.fecha_nac || '',
        cedula: user.cedula,
        email: user.email,
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        id_rol: user.id_rol,
        activo: user.activo
      });
    } else if (type === 'password' && user) {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else if (type === 'photo' && user) {
      setSelectedFile(null);
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setError(null);
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      let result;

      if (modalType === "create") {
        if (!permissions.canCreate) {
          setError('No tienes permiso para crear usuarios');
          return;
        }

        result = await usersService.createUser(formData);

        if (result.success) {
          const passwordGenerada = result.data?.contraseña_generada;
          const nombreUsuario = result.data?.usuario;

          await fetchUsers();
          closeModal();

          alert(
            `✅ Usuario creado exitosamente.\n\n` +
            `👤 Usuario: ${nombreUsuario}\n` +
            (passwordGenerada ? `🔑 Contraseña generada: ${passwordGenerada}` : "")
          );
        } else {
          setError(result.message || "Error al crear el usuario");
        }

      } else if (modalType === "edit") {
        if (!permissions.canUpdate) {
          setError('No tienes permiso para editar usuarios');
          return;
        }

        result = await usersService.updateUser(selectedUser.id, formData);
        
        if (result.success) {
          alert("✅ Cambios guardados correctamente");
          await fetchUsers();
          closeModal();
        } else {
          setError(result.message || "Error al actualizar usuario");
        }
      }

    } catch (error) {
      console.error("Error al guardar usuario:", error);
      setError(error.message || "Error al guardar usuario");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (!permissions.canChangePassword) {
      setError('No tienes permiso para cambiar contraseñas');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      const result = await usersService.changeUserPassword(selectedUser.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (result.success) {
        alert(result.message);
        closeModal();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError(error.message || 'Error al cambiar contraseña');
    }
  };

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    setError(null);

    if (!permissions.canChangePhoto) {
      setError('No tienes permiso para cambiar fotos de perfil');
      return;
    }

    if (!selectedFile) {
      setError('Debe seleccionar una imagen');
      return;
    }

    try {
      const result = await usersService.uploadUserPhoto(selectedUser.id, selectedFile);

      if (result.success) {
        alert(result.message);
        await fetchUsers();
        closeModal();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError(error.message || 'Error al subir foto');
    }
  };

  const handleDelete = async (userId) => {
    // 🔑 Verificar permiso antes de eliminar
    if (!permissions.canDelete) {
      alert('❌ No tienes permiso para eliminar usuarios');
      return;
    }

    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        const result = await usersService.deleteUser(userId);
        
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

  const toggleUserStatus = async (userId) => {
    // 🔑 Verificar permiso antes de cambiar estado
    if (!permissions.canToggleStatus) {
      alert('❌ No tienes permiso para cambiar el estado de usuarios');
      return;
    }

    try {
      const result = await usersService.toggleUserStatus(userId);
      
      if (result.success) {
        await fetchUsers();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      alert('Error al cambiar estado del usuario');
    }
  };

  const getRoleName = (user) => {
    if (user.rol && user.rol.nombre_rol) {
      return user.rol.nombre_rol;
    }
    return 'Sin rol';
  };

  const getRoleBadge = (user) => {
    const roleName = getRoleName(user).toLowerCase();
    
    const roleClasses = {
      administrador: 'bg-red-100 text-red-800',
      cliente: 'bg-blue-100 text-blue-800',
      lector: 'bg-green-100 text-green-800',
      cajero: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleClasses[roleName] || 'bg-gray-100 text-gray-800'}`}>
        {roleName.charAt(0).toUpperCase() + roleName.slice(1)}
      </span>
    );
  };

  // 🔑 Mostrar mensaje si no tiene permiso de lectura
  if (!permissions.canRead) {
    return (
      <div className="section-placeholder">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2>Acceso Denegado</h2>
        <p>No tienes permiso para acceder al módulo de usuarios.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="section-placeholder">
        <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-spin" />
        <h2>Cargando Usuarios</h2>
        <p>Por favor espera mientras cargamos la información...</p>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="section-placeholder">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2>Error al Cargar Usuarios</h2>
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
      <div className="section-header">
        <div className="section-title">
          <Users className="w-7 h-7 text-blue-600" />
          <h2>Gestión de Usuarios</h2>
        </div>
        {/* 🔑 Botón "Nuevo Usuario" solo si tiene permiso de crear */}
        {permissions.canCreate && (
          <button 
            className="btn-primary"
            onClick={() => openModal('create')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </button>
        )}
      </div>

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
          {roles.map(rol => (
            <option key={rol.id_rol} value={rol.id_rol}>
              {rol.nombre_rol}
            </option>
          ))}
        </select>

        <button 
          className="btn-secondary"
          onClick={fetchUsers}
          title="Recargar lista"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

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

      <div className="users-grid">
        {filteredUsers.map(user => (
          <div key={user.id} className={`user-card ${!user.activo ? 'inactive' : ''}`}>
            <div className="user-card-header">
              <div className="user-info">
                {user.foto ? (
                  <div className="user-avatar">
                    <img
                      src={user.foto}
                      alt={user.nombres}
                      className="user-avatar-img"
                    />
                  </div>
                ) : (
                  <div className="user-avatar user-avatar-empty">
                    <span>
                      {`${user.nombres?.[0]?.toUpperCase() || ''}${user.apellidos?.[0]?.toUpperCase() || ''}`}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="user-name">{user.nombres} {user.apellidos}</h3>
                  <div className="user-meta">
                    {getRoleBadge(user)}
                    <span className={`status-badge ${user.activo ? 'active' : 'inactive'}`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="user-actions">
                {/* 🔑 Botón "Ver detalles" - siempre visible si tiene permiso de lectura */}
                <button 
                  className="action-btn view"
                  onClick={() => openModal('view', user)}
                  title="Ver detalles"
                >
                  <Eye className="w-4 h-4 icon-view" />
                </button>

                {/* 🔑 Botón "Editar" - solo si tiene permiso de actualizar */}
                {permissions.canUpdate && (
                  <button 
                    className="action-btn edit"
                    onClick={() => openModal('edit', user)}
                    title="Editar usuario"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}

                {/* 🔑 Botón "Cambiar contraseña" - solo si tiene permiso */}
                {permissions.canChangePassword && (
                  <button 
                    className="action-btn"
                    onClick={() => openModal('password', user)}
                    title="Cambiar contraseña"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                )}

                {/* 🔑 Botón "Cambiar foto" - solo si tiene permiso */}
                {permissions.canChangePhoto && (
                  <button 
                    className="action-btn"
                    onClick={() => openModal('photo', user)}
                    title="Cambiar foto"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                )}

                {/* 🔑 Botón "Activar/Desactivar" - solo si tiene permiso */}
                {permissions.canToggleStatus && (
                  <button 
                    className="action-btn toggle"
                    onClick={() => toggleUserStatus(user.id)}
                    title={user.activo ? 'Desactivar' : 'Activar'}
                  >
                    {user.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                )}

                {/* 🔑 Botón "Eliminar" - solo si tiene permiso de eliminar */}
                {permissions.canDelete && (
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDelete(user.id)}
                    title="Eliminar usuario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="user-card-body">
              <div className="user-contact">
                <div className="contact-item">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{user.email}</span>
                </div>
                {user.telefono && (
                  <div className="contact-item">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{user.telefono}</span>
                  </div>
                )}
                {user.direccion && (
                  <div className="contact-item">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{user.direccion}</span>
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

      {/* MODALES */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {modalType === 'create' && 'Crear Nuevo Usuario'}
                {modalType === 'edit' && 'Editar Usuario'}
                {modalType === 'view' && 'Detalles del Usuario'}
                {modalType === 'password' && 'Cambiar Contraseña'}
                {modalType === 'photo' && 'Cambiar Foto de Perfil'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
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
                <div className="user-details ">
                  <div className="user-photo-container mb-5">
                    {selectedUser.foto ? (
                      <img 
                        src={selectedUser.foto} 
                        alt={selectedUser.nombres}
                        className="user-photo-img"
                      />
                    ) : (
                      <div className="user-photo-placeholder">
                        {`${selectedUser.nombres?.[0]?.toUpperCase() || ''}${selectedUser.apellidos?.[0]?.toUpperCase() || ''}`}
                      </div>
                    )}
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
                    <label>Cédula:</label>
                    <p>{selectedUser.cedula}</p>
                  </div>
                  <div className="detail-group">
                    <label>Sexo:</label>
                    <p>
                      {selectedUser.sexo === "M" ? "Masculino" :
                       selectedUser.sexo === "F" ? "Femenino" : "Otro"}
                    </p>
                  </div>
                  <div className="detail-group">
                    <label>Fecha Nacimiento:</label>
                    <p>{selectedUser.fecha_nac}</p>
                  </div>
                  <div className="detail-group">
                    <label>Email:</label>
                    <p>{selectedUser.email}</p>
                  </div>
                  {selectedUser.telefono && (
                    <div className="detail-group">
                      <label>Teléfono:</label>
                      <p>{selectedUser.telefono}</p>
                    </div>
                  )}
                  {selectedUser.direccion && (
                    <div className="detail-group">
                      <label>Dirección:</label>
                      <p>{selectedUser.direccion}</p>
                    </div>
                  )}
                  <div className="detail-group">
                    <label>Rol:</label>
                    <p>{getRoleBadge(selectedUser)}</p>
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
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nombres *</label>
                      <input
                        type="text"
                        required
                        value={formData.nombres}
                        onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                        placeholder="Nombres del usuario"
                      />
                    </div>

                    <div className="form-group">
                      <label>Apellidos *</label>
                      <input
                        type="text"
                        required
                        value={formData.apellidos}
                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                        placeholder="Apellidos del usuario"
                      />
                    </div>

                    <div className="form-group">
                      <label>Sexo *</label>
                      <select
                        required
                        value={formData.sexo}
                        onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                      >
                        <option value="">Seleccione una opción</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="O">Otro</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Fecha de Nacimiento *</label>
                      <input
                        type="date"
                        required
                        value={formData.fecha_nac}
                        onChange={(e) => setFormData({ ...formData, fecha_nac: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Cédula *</label>
                      <input
                        type="text"
                        required
                        value={formData.cedula}
                        onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                        placeholder="Número de cédula"
                      />
                    </div>

                    <div className="form-group">
                      <label>Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@ejemplo.com"
                      />
                    </div>

                    <div className="form-group">
                      <label>Teléfono</label>
                      <input
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="Número de teléfono"
                      />
                    </div>

                    <div className="form-group form-group-full">
                      <label>Dirección</label>
                      <textarea
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        placeholder="Dirección completa"
                        rows="3"
                      />
                    </div>

                    <div className="form-group">
                      <label>Rol *</label>
                      <select
                        required
                        value={formData.id_rol || ''}
                        onChange={(e) => setFormData({ ...formData, id_rol: parseInt(e.target.value) })}
                      >
                        <option value="">Seleccione un rol</option>
                        {roles.map(rol => (
                          <option key={rol.id_rol} value={rol.id_rol}>
                            {rol.nombre_rol}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Estado</label>
                      <select
                        value={formData.activo}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.value === "true" })}
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
                      {modalType === "create" ? "Crear Usuario" : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              )}

              {/* MODAL DE CAMBIO DE CONTRASEÑA */}
              {modalType === 'password' && (
                <form onSubmit={handleChangePassword} className="user-form">
                  <div className="form-grid">
                    <div className="form-group form-group-full">
                      <label>Contraseña Actual *</label>
                      <input
                        type="password"
                        required
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        placeholder="Contraseña actual"
                      />
                    </div>
                    
                    <div className="form-group form-group-full">
                      <label>Nueva Contraseña *</label>
                      <input
                        type="password"
                        required
                        minLength="8"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        placeholder="Nueva contraseña (min. 8 caracteres)"
                      />
                    </div>
                    
                    <div className="form-group form-group-full">
                      <label>Confirmar Nueva Contraseña *</label>
                      <input
                        type="password"
                        required
                        minLength="8"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        placeholder="Confirmar nueva contraseña"
                      />
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={closeModal}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
                      <Key className="w-4 h-4 mr-2" />
                      Cambiar Contraseña
                    </button>
                  </div>
                </form>
              )}

              {/* MODAL DE CAMBIO DE FOTO */}
              {modalType === 'photo' && (
                <form onSubmit={handleUploadPhoto} className="user-form">
                  <div className="form-grid">
                    <div className="form-group form-group-full">
                      <label>Seleccionar Imagen *</label>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                      />
                      <small className="text-gray-500 mt-1">
                        Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 2MB
                      </small>
                    </div>
                    
                    {selectedFile && (
                      <div className="form-group form-group-full">
                        <p className="text-sm text-gray-600">
                          Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={closeModal}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Subir Foto
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