// src/components/AffiliatesSection.js
// MÓDULO DE AFILIADOS - Con control de permisos granular
import React, { useState, useEffect, useCallback } from 'react';
import './styleAffiliates.css';
import affiliatesService from '../services/affiliatesServices';
import sectorsService from '../services/sectorServices';
import authService from '../services/authServices';

import {
   UserPlus, Search, Edit, Trash2, Eye, UserCheck, UserX,
  Mail, Phone, MapPin, Calendar, X, Save, RefreshCw, AlertCircle, CheckCircle, XCircle,
  Map
} from 'lucide-react';

const AffiliatesSection = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [filterSector, setFilterSector] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    id_usuario_sistema: null,
    id_sector: null,
    activo: true
  });

  // 🔑 PERMISOS DEL USUARIO ACTUAL
  const [permissions, setPermissions] = useState({
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canToggleStatus: false
  });

  // 🔑 Cargar permisos al montar el componente
  useEffect(() => {
    loadUserPermissions();
    loadSectors();
  }, []);

  const loadUserPermissions = () => {
    const canCreate = authService.hasPermission('afiliados', 'crear') || 
                     authService.hasPermission('afiliados', 'crud');
    
    const canRead = authService.hasPermission('afiliados', 'lectura') || 
                   authService.hasPermission('afiliados', 'crud');
    
    const canUpdate = authService.hasPermission('afiliados', 'actualizar') || 
                     authService.hasPermission('afiliados', 'crud');
    
    const canDelete = authService.hasPermission('afiliados', 'eliminar') || 
                     authService.hasPermission('afiliados', 'crud');

    const canToggleStatus = canUpdate;

    setPermissions({
      canCreate,
      canRead,
      canUpdate,
      canDelete,
      canToggleStatus
    });

    console.log('🔐 Permisos del usuario en módulo Afiliados:', {
      canCreate,
      canRead,
      canUpdate,
      canDelete
    });
  };

  const loadSectors = async () => {
    try {
      const result = await sectorsService.getSectors();
      if (result.success) {
        setSectors(result.data.filter(s => s.activo));
      }
    } catch (error) {
      console.error('Error al cargar sectores:', error);
    }
  };

  const fetchAffiliates = useCallback(async () => {
    if (!permissions.canRead) {
      setError('No tienes permiso para ver afiliados');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await affiliatesService.getAffiliates({
        search: debouncedSearchTerm,
        id_sector: filterSector === 'all' ? undefined : filterSector,
        activo: filterStatus === 'all' ? undefined : filterStatus === 'active'
      });

      if (result.success) {
        setAffiliates(result.data);
        console.log('✅ Afiliados cargados:', result.data.length);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al cargar afiliados desde el servidor');
      console.error('Error en fetchAffiliates:', err);
    } finally {
      setLoading(false);
    }
  }, [filterSector, filterStatus, debouncedSearchTerm, permissions.canRead]);

  const fetchAvailableUsers = async (search = '') => {
    try {
      const result = await affiliatesService.getAvailableUsers(search);
      if (result.success) {
        setAvailableUsers(result.data);
      }
    } catch (error) {
      console.error('Error al cargar usuarios disponibles:', error);
    }
  };

  useEffect(() => {
    if (permissions.canRead) {
      fetchAffiliates();
    }
  }, [fetchAffiliates, permissions.canRead]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 700);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const filteredAffiliates = affiliates.filter(aff => {
    const matchesSearch = 
      aff.usuario?.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aff.usuario?.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aff.usuario?.cedula.includes(searchTerm) ||
      aff.cod_usuario_afi.toString().includes(searchTerm);
    
    const matchesSector = filterSector === 'all' || aff.id_sector === parseInt(filterSector);
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'active' && aff.activo) ||
                          (filterStatus === 'inactive' && !aff.activo);
    
    return matchesSearch && matchesSector && matchesStatus;
  });

  const openModal = async (type, affiliate = null) => {
    if (type === 'create' && !permissions.canCreate) {
      alert('❌ No tienes permiso para crear afiliados');
      return;
    }
    if (type === 'edit' && !permissions.canUpdate) {
      alert('❌ No tienes permiso para editar afiliados');
      return;
    }

    setModalType(type);
    setSelectedAffiliate(affiliate);
    setError(null);
    
    if (type === 'create') {
      await fetchAvailableUsers();
      setFormData({
        id_usuario_sistema: null,
        id_sector: sectors.length > 0 ? sectors[0].id_sector : null,
        activo: true
      });
    } else if (type === 'edit' && affiliate) {
      setFormData({
        id_sector: affiliate.id_sector,
        activo: affiliate.activo
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAffiliate(null);
    setError(null);
    setAvailableUsers([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      let result;

      if (modalType === 'create') {
        if (!permissions.canCreate) {
          setError('No tienes permiso para crear afiliados');
          return;
        }

        if (!formData.id_usuario_sistema) {
          setError('Debe seleccionar un usuario');
          return;
        }

        if (!formData.id_sector) {
          setError('Debe seleccionar un sector');
          return;
        }

        result = await affiliatesService.createAffiliate(formData);

        if (result.success) {
          alert(`✅ Afiliado creado exitosamente.\nCódigo: ${result.data.cod_usuario_afi}`);
          await fetchAffiliates();
          closeModal();
        } else {
          setError(result.message);
        }

      } else if (modalType === 'edit') {
        if (!permissions.canUpdate) {
          setError('No tienes permiso para editar afiliados');
          return;
        }

        result = await affiliatesService.updateAffiliate(selectedAffiliate.id_usuario_afi, formData);
        
        if (result.success) {
          alert('✅ Cambios guardados correctamente');
          await fetchAffiliates();
          closeModal();
        } else {
          setError(result.message);
        }
      }

    } catch (error) {
      console.error('Error al guardar afiliado:', error);
      setError(error.message || 'Error al guardar afiliado');
    }
  };

  const handleDelete = async (affiliateId) => {
    if (!permissions.canDelete) {
      alert('❌ No tienes permiso para eliminar afiliados');
      return;
    }

    if (window.confirm('¿Estás seguro de que deseas eliminar este afiliado?')) {
      try {
        const result = await affiliatesService.deleteAffiliate(affiliateId);
        
        if (result.success) {
          alert(result.message);
          await fetchAffiliates();
        } else {
          alert('Error: ' + result.message);
        }
      } catch (error) {
        alert('Error al eliminar afiliado: ' + error.message);
      }
    }
  };

  const toggleAffiliateStatus = async (affiliateId) => {
    if (!permissions.canToggleStatus) {
      alert('❌ No tienes permiso para cambiar el estado de afiliados');
      return;
    }

    try {
      const result = await affiliatesService.toggleAffiliateStatus(affiliateId);
      
      if (result.success) {
        await fetchAffiliates();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      alert('Error al cambiar estado del afiliado');
    }
  };

  if (!permissions.canRead) {
    return (
      <div className="section-placeholder">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2>Acceso Denegado</h2>
        <p>No tienes permiso para acceder al módulo de afiliados.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="section-placeholder">
        <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-spin" />
        <h2>Cargando Afiliados</h2>
        <p>Por favor espera mientras cargamos la información...</p>
      </div>
    );
  }

  if (error && affiliates.length === 0) {
    return (
      <div className="section-placeholder">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2>Error al Cargar Afiliados</h2>
        <p>{error}</p>
        <button onClick={fetchAffiliates} className="btn-primary mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="affiliates-section">
      <div className="section-header">
        <div className="section-title">
          <UserPlus className="w-7 h-7 text-blue-600" />
          <h2>Gestión de Afiliados</h2>
        </div>
        {permissions.canCreate && (
          <button 
            className="btn-primary"
            onClick={() => openModal('create')}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Afiliado
          </button>
        )}
      </div>

      <div className="filters-section">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o código..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="filter-select"
          value={filterSector}
          onChange={(e) => setFilterSector(e.target.value)}
        >
          <option value="all">Todos los sectores</option>
          {sectors.map(sector => (
            <option key={sector.id_sector} value={sector.id_sector}>
              {sector.nombre_sector}
            </option>
          ))}
        </select>

        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>

        <button 
          className="btn-secondary"
          onClick={fetchAffiliates}
          title="Recargar lista"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="users-stats">
        <div className="stat-item">
          <UserPlus className="stat-icon text-blue-600" />
          <div>
            <p className="stat-label">Total Afiliados</p>
            <p className="stat-value">{affiliates.length}</p>
          </div>
        </div>
        <div className="stat-item">
          <UserCheck className="stat-icon text-green-600" />
          <div>
            <p className="stat-label">Afiliados Activos</p>
            <p className="stat-value">{affiliates.filter(a => a.activo).length}</p>
          </div>
        </div>
        <div className="stat-item">
          <UserX className="stat-icon text-red-600" />
          <div>
            <p className="stat-label">Afiliados Inactivos</p>
            <p className="stat-value">{affiliates.filter(a => !a.activo).length}</p>
          </div>
        </div>
        <div className="stat-item">
          <Map className="stat-icon text-purple-600" />
          <div>
            <p className="stat-label">Sectores con Afiliados</p>
            <p className="stat-value">{new Set(affiliates.filter(a => a.activo).map(a => a.id_sector)).size}</p>
          </div>
        </div>
      </div>

      <div className="users-grid">
        {filteredAffiliates.map(affiliate => (
          <div key={affiliate.id_usuario_afi} className={`user-card ${!affiliate.activo ? 'inactive' : ''}`}>
            <div className="user-card-header">
              <div className="user-info">
                <div className="user-avatar user-avatar-empty">
                  <span>
                    {affiliate.usuario ? `${affiliate.usuario.nombres[0]}${affiliate.usuario.apellidos[0]}` : 'NA'}
                  </span>
                </div>
                <div>
                  <h3 className="user-name">
                    {affiliate.usuario ? `${affiliate.usuario.nombres} ${affiliate.usuario.apellidos}` : 'Usuario no disponible'}
                  </h3>
                  <div className="user-meta">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Código: {affiliate.cod_usuario_afi}
                    </span>
                    <span className={`status-badge ${affiliate.activo ? 'active' : 'inactive'}`}>
                      {affiliate.activo ?(
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Activo
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Inactivo
                            </>
                          ) }
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="user-actions">
                <button 
                  className="action-btn view"
                  onClick={() => openModal('view', affiliate)}
                  title="Ver detalles"
                >
                  <Eye className="w-4 h-4 icon-view" />
                </button>

                {permissions.canUpdate && (
                  <button 
                    className="action-btn edit"
                    onClick={() => openModal('edit', affiliate)}
                    title="Editar afiliado"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}

                {permissions.canToggleStatus && (
                  <button 
                    className="action-btn toggle"
                    onClick={() => toggleAffiliateStatus(affiliate.id_usuario_afi)}
                    title={affiliate.activo ? 'Desactivar' : 'Activar'}
                  >
                    {affiliate.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                )}

                {permissions.canDelete && (
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDelete(affiliate.id_usuario_afi)}
                    title="Eliminar afiliado"
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
                  <span>{affiliate.usuario?.email || 'N/A'}</span>
                </div>
                {affiliate.usuario?.telefono && (
                  <div className="contact-item">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{affiliate.usuario.telefono}</span>
                  </div>
                )}
                <div className="contact-item">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{affiliate.sector?.nombre_sector || 'Sin sector'}</span>
                </div>
              </div>
              
              {affiliate.fecha_afiliacion && (
                <div className="user-dates">
                  <div className="date-item">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Afiliado: {new Date(affiliate.fecha_afiliacion + 'T00:00:00').toLocaleDateString('es-EC')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAffiliates.length === 0 && (
        <div className="empty-state">
          <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3>No se encontraron afiliados</h3>
          <p>No hay afiliados que coincidan con los criterios de búsqueda.</p>
        </div>
      )}

      {/* MODALES */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {modalType === 'create' && 'Crear Nuevo Afiliado'}
                {modalType === 'edit' && 'Editar Afiliado'}
                {modalType === 'view' && 'Detalles del Afiliado'}
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
              {modalType === 'view' && selectedAffiliate && (
                <div className="user-details">
                  <div className="detail-group">
                    <label>Código de Afiliado:</label>
                    <p>{selectedAffiliate.cod_usuario_afi}</p>
                  </div>
                  <div className="detail-group">
                    <label>Nombre Completo:</label>
                    <p>{selectedAffiliate.usuario ? `${selectedAffiliate.usuario.nombres} ${selectedAffiliate.usuario.apellidos}` : 'N/A'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Cédula:</label>
                    <p>{selectedAffiliate.usuario?.cedula || 'N/A'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Email:</label>
                    <p>{selectedAffiliate.usuario?.email || 'N/A'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Sector:</label>
                    <p>{selectedAffiliate.sector?.nombre_sector || 'N/A'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Fecha de Afiliación:</label>
                    <p>{selectedAffiliate.fecha_afiliacion ? new Date(selectedAffiliate.fecha_afiliacion).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Estado:</label>
                    <span className={`status-badge ${selectedAffiliate.activo ? 'active' : 'inactive'}`}>
                      {selectedAffiliate.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              )}

              {/* MODAL DE CREACIÓN */}
              {modalType === 'create' && (
                <form onSubmit={handleSubmit} className="user-form">
                  <div className="form-grid">
                    <div className="form-group form-group-full">
                      <label>Seleccionar Usuario *</label>
                      <select
                        required
                        value={formData.id_usuario_sistema || ''}
                        onChange={(e) => setFormData({ ...formData, id_usuario_sistema: parseInt(e.target.value) })}
                      >
                        <option value="">Seleccione un usuario</option>
                        {availableUsers.map(user => (
                          <option key={user.id_usuario_sistema} value={user.id_usuario_sistema}>
                            {user.nombres} {user.apellidos} - {user.cedula}
                          </option>
                        ))}
                      </select>
                      <small className="text-gray-500 mt-1">
                        Solo se muestran usuarios no afiliados
                      </small>
                    </div>

                    <div className="form-group form-group-full">
                      <label>Sector *</label>
                      <select
                        required
                        value={formData.id_sector || ''}
                        onChange={(e) => setFormData({ ...formData, id_sector: parseInt(e.target.value) })}
                      >
                        <option value="">Seleccione un sector</option>
                        {sectors.map(sector => (
                          <option key={sector.id_sector} value={sector.id_sector}>
                            {sector.nombre_sector}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={closeModal}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
                      <Save className="w-4 h-4 mr-2" />
                      Crear Afiliado
                    </button>
                  </div>
                </form>
              )}

              {/* MODAL DE EDICIÓN */}
              {modalType === 'edit' && (
                <form onSubmit={handleSubmit} className="user-form">
                  <div className="form-grid">
                    <div className="form-group form-group-full">
                      <label>Sector *</label>
                      <select
                        required
                        value={formData.id_sector || ''}
                        onChange={(e) => setFormData({ ...formData, id_sector: parseInt(e.target.value) })}
                      >
                        <option value="">Seleccione un sector</option>
                        {sectors.map(sector => (
                          <option key={sector.id_sector} value={sector.id_sector}>
                            {sector.nombre_sector}
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
                      Guardar Cambios
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

export default AffiliatesSection;