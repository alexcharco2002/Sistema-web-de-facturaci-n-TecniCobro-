// src/pages/lector/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authServices';
import './LectorDashboard.css';

const LectorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pendientes');
  
  // Estados para las lecturas
  const [lecturasDelDia, setLecturasDelDia] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    pendientes: 0,
    completadas: 0,
    totalAsignadas: 0,
    porcentajeCompletado: 0
  });

  // Estados para el modal de lectura
  const [showModal, setShowModal] = useState(false);
  const [lecturaSeleccionada, setLecturaSeleccionada] = useState(null);
  const [valorLectura, setValorLectura] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fotoMedidor, setFotoMedidor] = useState(null);

 

  const verificarAutenticacion = useCallback(async () => {
    try {
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        navigate('/login');
        return;
      }

      if (currentUser.rol?.toUpperCase() !== 'LECTOR') {
        console.warn('⚠️ Usuario sin permisos de lector');
        navigate('/login');
        return;
      }

      setUser(currentUser);
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      navigate('/login');
    }
  }, [navigate]);

   

  const cargarDatosDashboard = useCallback( async () => {
    setLoading(true);
    try {
      // Simular carga de datos (aquí conectarías con tu API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Datos de ejemplo - reemplazar con llamada real a API
      const lecturasMock = [
        {
          id: 1,
          cliente: 'Juan Pérez',
          medidor: 'MED-001',
          direccion: 'Calle Principal #123',
          ultimaLectura: 1234,
          fechaUltimaLectura: '2024-09-21',
          estado: 'pendiente',
          sector: 'Centro'
        },
        {
          id: 2,
          cliente: 'María González',
          medidor: 'MED-002',
          direccion: 'Av. Secundaria #456',
          ultimaLectura: 2345,
          fechaUltimaLectura: '2024-09-20',
          estado: 'pendiente',
          sector: 'Centro'
        },
        {
          id: 3,
          cliente: 'Carlos Ramírez',
          medidor: 'MED-003',
          direccion: 'Jr. Terciaria #789',
          ultimaLectura: 3456,
          fechaUltimaLectura: '2024-09-21',
          estado: 'completada',
          lecturaActual: 3500,
          sector: 'Norte'
        }
      ];

      setLecturasDelDia(lecturasMock);
      
      const pendientes = lecturasMock.filter(l => l.estado === 'pendiente').length;
      const completadas = lecturasMock.filter(l => l.estado === 'completada').length;
      const total = lecturasMock.length;
      
      setEstadisticas({
        pendientes,
        completadas,
        totalAsignadas: total,
        porcentajeCompletado: total > 0 ? Math.round((completadas / total) * 100) : 0
      });

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verificarAutenticacion();
    cargarDatosDashboard();
  }, [verificarAutenticacion, cargarDatosDashboard]);

  const handleLogout = async () => {
    if (window.confirm('¿Está seguro que desea cerrar sesión?')) {
      await authService.logout();
      navigate('/login');
    }
  };

  const abrirModalLectura = (lectura) => {
    setLecturaSeleccionada(lectura);
    setValorLectura('');
    setObservaciones('');
    setFotoMedidor(null);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setLecturaSeleccionada(null);
    setValorLectura('');
    setObservaciones('');
    setFotoMedidor(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { // 5MB
        alert('La imagen es demasiado grande. Máximo 5MB');
        return;
      }
      setFotoMedidor(file);
    }
  };

  const guardarLectura = async () => {
    if (!valorLectura || isNaN(valorLectura)) {
      alert('Por favor ingrese un valor válido');
      return;
    }

    if (parseInt(valorLectura) < lecturaSeleccionada.ultimaLectura) {
      if (!window.confirm('⚠️ La lectura actual es menor a la anterior. ¿Desea continuar?')) {
        return;
      }
    }

    try {
      // Aquí iría la llamada a tu API para guardar la lectura
      console.log('Guardando lectura:', {
        medidorId: lecturaSeleccionada.id,
        valorLectura: parseInt(valorLectura),
        observaciones,
        fecha: new Date().toISOString(),
        lector: user.cod_usuario_sistema
      });

      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('✅ Lectura registrada exitosamente');
      cerrarModal();
      cargarDatosDashboard();

    } catch (error) {
      console.error('❌ Error guardando lectura:', error);
      alert('Error al guardar la lectura. Intente nuevamente.');
    }
  };

  const lecturasFiltradas = lecturasDelDia.filter(lectura => {
    if (activeTab === 'pendientes') return lectura.estado === 'pendiente';
    if (activeTab === 'completadas') return lectura.estado === 'completada';
    return true;
  });

  if (loading) {
    return (
      <div className="lector-loading">
        <div className="spinner"></div>
        <p>Cargando panel de lecturas...</p>
      </div>
    );
  }

  return (
    <div className="lector-dashboard">
      {/* Header */}
      <header className="lector-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon">💧</span>
              <div className="logo-text">
                <h1>JAAP Sanjapamba</h1>
                <p>Panel de Lecturas</p>
              </div>
            </div>
          </div>

          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                {user?.foto ? (
                  <img src={user.foto} alt="Foto de perfil" />
                ) : (
                  <span className="avatar-icon">📖</span>
                )}
              </div>
              <div className="user-details">
                <p className="user-name">{user?.nombre_completo}</p>
                <p className="user-role">Lector de Medidores</p>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <span>🚪</span> Salir
            </button>
          </div>
        </div>
      </header>

      {/* Estadísticas */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <p className="stat-label">Total Asignadas</p>
              <p className="stat-value">{estadisticas.totalAsignadas}</p>
            </div>
          </div>

          <div className="stat-card stat-pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <p className="stat-label">Pendientes</p>
              <p className="stat-value">{estadisticas.pendientes}</p>
            </div>
          </div>

          <div className="stat-card stat-completed">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <p className="stat-label">Completadas</p>
              <p className="stat-value">{estadisticas.completadas}</p>
            </div>
          </div>

          <div className="stat-card stat-progress">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <p className="stat-label">Progreso</p>
              <p className="stat-value">{estadisticas.porcentajeCompletado}%</p>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${estadisticas.porcentajeCompletado}%` }}
            ></div>
          </div>
          <p className="progress-text">
            {estadisticas.completadas} de {estadisticas.totalAsignadas} lecturas completadas hoy
          </p>
        </div>
      </section>

      {/* Tabs de navegación */}
      <section className="tabs-section">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'todas' ? 'active' : ''}`}
            onClick={() => setActiveTab('todas')}
          >
            Todas ({lecturasDelDia.length})
          </button>
          <button 
            className={`tab ${activeTab === 'pendientes' ? 'active' : ''}`}
            onClick={() => setActiveTab('pendientes')}
          >
            Pendientes ({estadisticas.pendientes})
          </button>
          <button 
            className={`tab ${activeTab === 'completadas' ? 'active' : ''}`}
            onClick={() => setActiveTab('completadas')}
          >
            Completadas ({estadisticas.completadas})
          </button>
        </div>
      </section>

      {/* Lista de lecturas */}
      <section className="lecturas-section">
        {lecturasFiltradas.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <p>No hay lecturas {activeTab === 'pendientes' ? 'pendientes' : activeTab === 'completadas' ? 'completadas' : 'asignadas'}</p>
          </div>
        ) : (
          <div className="lecturas-grid">
            {lecturasFiltradas.map(lectura => (
              <div key={lectura.id} className={`lectura-card ${lectura.estado}`}>
                <div className="lectura-header">
                  <div className="lectura-info">
                    <h3>{lectura.cliente}</h3>
                    <p className="lectura-medidor">📟 {lectura.medidor}</p>
                  </div>
                  <span className={`lectura-status ${lectura.estado}`}>
                    {lectura.estado === 'pendiente' ? '⏳ Pendiente' : '✅ Completada'}
                  </span>
                </div>

                <div className="lectura-body">
                  <div className="lectura-detail">
                    <span className="detail-icon">📍</span>
                    <div>
                      <p className="detail-label">Dirección</p>
                      <p className="detail-value">{lectura.direccion}</p>
                    </div>
                  </div>

                  <div className="lectura-detail">
                    <span className="detail-icon">🏘️</span>
                    <div>
                      <p className="detail-label">Sector</p>
                      <p className="detail-value">{lectura.sector}</p>
                    </div>
                  </div>

                  <div className="lectura-detail">
                    <span className="detail-icon">📊</span>
                    <div>
                      <p className="detail-label">Última Lectura</p>
                      <p className="detail-value">{lectura.ultimaLectura} m³</p>
                      <p className="detail-date">{new Date(lectura.fechaUltimaLectura).toLocaleDateString('es-EC')}</p>
                    </div>
                  </div>

                  {lectura.estado === 'completada' && (
                    <div className="lectura-detail">
                      <span className="detail-icon">✅</span>
                      <div>
                        <p className="detail-label">Lectura Actual</p>
                        <p className="detail-value consumo">{lectura.lecturaActual} m³</p>
                        <p className="detail-consumo">
                          Consumo: {lectura.lecturaActual - lectura.ultimaLectura} m³
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {lectura.estado === 'pendiente' && (
                  <div className="lectura-footer">
                    <button 
                      className="btn-registrar"
                      onClick={() => abrirModalLectura(lectura)}
                    >
                      📝 Registrar Lectura
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal para registrar lectura */}
      {showModal && lecturaSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Lectura</h2>
              <button className="modal-close" onClick={cerrarModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="modal-info">
                <p><strong>Cliente:</strong> {lecturaSeleccionada.cliente}</p>
                <p><strong>Medidor:</strong> {lecturaSeleccionada.medidor}</p>
                <p><strong>Dirección:</strong> {lecturaSeleccionada.direccion}</p>
                <p><strong>Última lectura:</strong> {lecturaSeleccionada.ultimaLectura} m³</p>
              </div>

              <div className="form-group">
                <label htmlFor="valorLectura">
                  <span className="label-icon">📊</span>
                  Lectura Actual (m³) *
                </label>
                <input
                  type="number"
                  id="valorLectura"
                  className="form-input"
                  placeholder="Ingrese el valor del medidor"
                  value={valorLectura}
                  onChange={(e) => setValorLectura(e.target.value)}
                  min={0}
                  step={0.01}
                />
                {valorLectura && !isNaN(valorLectura) && (
                  <p className="consumo-calculado">
                    Consumo: {(parseFloat(valorLectura) - lecturaSeleccionada.ultimaLectura).toFixed(2)} m³
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="observaciones">
                  <span className="label-icon">📝</span>
                  Observaciones (opcional)
                </label>
                <textarea
                  id="observaciones"
                  className="form-textarea"
                  placeholder="Ingrese observaciones si las hay..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="fotoMedidor">
                  <span className="label-icon">📷</span>
                  Foto del Medidor (opcional)
                </label>
                <input
                  type="file"
                  id="fotoMedidor"
                  className="form-file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {fotoMedidor && (
                  <p className="file-name">✅ {fotoMedidor.name}</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={cerrarModal}>
                Cancelar
              </button>
              <button 
                className="btn-save" 
                onClick={guardarLectura}
                disabled={!valorLectura || isNaN(valorLectura)}
              >
                💾 Guardar Lectura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LectorDashboard;