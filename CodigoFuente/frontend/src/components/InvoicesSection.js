// src/components/invoices/InvoicesSection.js
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  Download,
  Send,
  DollarSign,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Printer,
  RefreshCw,
  X,
  Save
} from 'lucide-react';

const InvoicesSection = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    cliente_id: '',
    cliente_nombre: '',
    periodo: '',
    lectura_anterior: 0,
    lectura_actual: 0,
    consumo: 0,
    tarifa: 0.50,
    subtotal: 0,
    impuestos: 0,
    total: 0,
    fecha_vencimiento: '',
    observaciones: ''
  });

  // Simular datos de facturas
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setTimeout(() => {
        setInvoices([
          {
            id: 1,
            numero: 'FAC-2024-001',
            cliente_id: 1,
            cliente_nombre: 'Juan Carlos Pérez González',
            periodo: '2024-01',
            fecha_emision: '2024-01-05',
            fecha_vencimiento: '2024-01-20',
            lectura_anterior: 150,
            lectura_actual: 175,
            consumo: 25,
            tarifa: 0.50,
            subtotal: 12.50,
            impuestos: 1.50,
            total: 14.00,
            estado: 'pagada',
            fecha_pago: '2024-01-18',
            observaciones: 'Pago realizado a tiempo'
          },
          {
            id: 2,
            numero: 'FAC-2024-002',
            cliente_id: 2,
            cliente_nombre: 'María Elena González López',
            periodo: '2024-01',
            fecha_emision: '2024-01-05',
            fecha_vencimiento: '2024-01-20',
            lectura_anterior: 200,
            lectura_actual: 230,
            consumo: 30,
            tarifa: 0.50,
            subtotal: 15.00,
            impuestos: 1.80,
            total: 16.80,
            estado: 'pendiente',
            fecha_pago: null,
            observaciones: ''
          },
          {
            id: 3,
            numero: 'FAC-2024-003',
            cliente_id: 3,
            cliente_nombre: 'Carlos Alberto Martínez Silva',
            periodo: '2024-01',
            fecha_emision: '2024-01-05',
            fecha_vencimiento: '2024-01-20',
            lectura_anterior: 80,
            lectura_actual: 95,
            consumo: 15,
            tarifa: 0.50,
            subtotal: 7.50,
            impuestos: 0.90,
            total: 8.40,
            estado: 'vencida',
            fecha_pago: null,
            observaciones: 'Recordatorio enviado'
          }
        ]);
        setLoading(false);
      }, 1000);
    };

    fetchInvoices();
  }, []);

  // Calcular totales automáticamente
  useEffect(() => {
    const consumo = formData.lectura_actual - formData.lectura_anterior;
    const subtotal = consumo * formData.tarifa;
    const impuestos = subtotal * 0.12; // 12% IVA
    const total = subtotal + impuestos;

    setFormData(prev => ({
      ...prev,
      consumo: consumo > 0 ? consumo : 0,
      subtotal: subtotal > 0 ? subtotal : 0,
      impuestos: impuestos > 0 ? impuestos : 0,
      total: total > 0 ? total : 0
    }));
  }, [formData.lectura_anterior, formData.lectura_actual, formData.tarifa]);

  // Filtrar facturas
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || invoice.estado === filterStatus;
    
    const matchesPeriod = filterPeriod === 'all' || invoice.periodo === filterPeriod;
    
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  // Handlers para modal
  const openModal = (type, invoice = null) => {
    setModalType(type);
    setSelectedInvoice(invoice);
    
    if (type === 'create') {
      setFormData({
        cliente_id: '',
        cliente_nombre: '',
        periodo: new Date().toISOString().slice(0, 7), // YYYY-MM format
        lectura_anterior: 0,
        lectura_actual: 0,
        consumo: 0,
        tarifa: 0.50,
        subtotal: 0,
        impuestos: 0,
        total: 0,
        fecha_vencimiento: '',
        observaciones: ''
      });
    } else if (invoice) {
      setFormData({
        cliente_id: invoice.cliente_id,
        cliente_nombre: invoice.cliente_nombre,
        periodo: invoice.periodo,
        lectura_anterior: invoice.lectura_anterior,
        lectura_actual: invoice.lectura_actual,
        consumo: invoice.consumo,
        tarifa: invoice.tarifa,
        subtotal: invoice.subtotal,
        impuestos: invoice.impuestos,
        total: invoice.total,
        fecha_vencimiento: invoice.fecha_vencimiento,
        observaciones: invoice.observaciones || ''
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedInvoice(null);
  };

  // Handler para crear/editar factura
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalType === 'create') {
        const newInvoice = {
          ...formData,
          id: invoices.length + 1,
          numero: `FAC-2024-${String(invoices.length + 1).padStart(3, '0')}`,
          fecha_emision: new Date().toISOString().split('T')[0],
          estado: 'pendiente',
          fecha_pago: null
        };
        setInvoices([...invoices, newInvoice]);
        alert('Factura creada exitosamente');
      } else {
        setInvoices(invoices.map(invoice => 
          invoice.id === selectedInvoice.id ? { ...invoice, ...formData } : invoice
        ));
        alert('Factura actualizada exitosamente');
      }
      
      closeModal();
    } catch (error) {
      alert('Error al guardar factura: ' + error.message);
    }
  };

  // Handler para eliminar factura
  const handleDelete = async (invoiceId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
      try {
        setInvoices(invoices.filter(invoice => invoice.id !== invoiceId));
        alert('Factura eliminada exitosamente');
      } catch (error) {
        alert('Error al eliminar factura: ' + error.message);
      }
    }
  };

  // Handler para marcar como pagada
  const markAsPaid = async (invoiceId) => {
    try {
      setInvoices(invoices.map(invoice => 
        invoice.id === invoiceId ? { 
          ...invoice, 
          estado: 'pagada',
          fecha_pago: new Date().toISOString().split('T')[0]
        } : invoice
      ));
      alert('Factura marcada como pagada');
    } catch (error) {
      alert('Error al actualizar el estado de la factura');
    }
  };

  // Helper functions
  const getStatusBadge = (estado) => {
    const statusClasses = {
      pagada: 'bg-green-100 text-green-800',
      pendiente: 'bg-yellow-100 text-yellow-800',
      vencida: 'bg-red-100 text-red-800',
      cancelada: 'bg-gray-100 text-gray-800'
    };
    
    const statusIcons = {
      pagada: CheckCircle,
      pendiente: Clock,
      vencida: XCircle,
      cancelada: AlertCircle
    };
    
    const IconComponent = statusIcons[estado] || Clock;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusClasses[estado] || 'bg-gray-100 text-gray-800'}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  const getTotalStats = () => {
    const total = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const pagadas = invoices.filter(invoice => invoice.estado === 'pagada').length;
    const pendientes = invoices.filter(invoice => invoice.estado === 'pendiente').length;
    const vencidas = invoices.filter(invoice => invoice.estado === 'vencida').length;
    
    return { total, pagadas, pendientes, vencidas };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="section-placeholder">
        <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-spin" />
        <h2>Cargando Facturas</h2>
        <p>Por favor espera mientras cargamos la información...</p>
      </div>
    );
  }

  return (
    <div className="invoices-section">
      {/* Header */}
      <div className="section-header">
        <div className="section-title">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2>Sistema de Facturación</h2>
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Reporte
          </button>
          <button 
            className="btn-primary"
            onClick={() => openModal('create')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Factura
          </button>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="filters-section">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por número o cliente..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="pagada">Pagadas</option>
          <option value="vencida">Vencidas</option>
          <option value="cancelada">Canceladas</option>
        </select>

        <select 
          className="filter-select"
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
        >
          <option value="all">Todos los períodos</option>
          <option value="2024-01">Enero 2024</option>
          <option value="2023-12">Diciembre 2023</option>
          <option value="2023-11">Noviembre 2023</option>
        </select>
      </div>

      {/* Stats */}
      <div className="invoices-stats">
        <div className="stat-item">
          <DollarSign className="stat-icon text-green-600" />
          <div>
            <p className="stat-label">Total Facturado</p>
            <p className="stat-value">${stats.total.toFixed(2)}</p>
          </div>
        </div>
        <div className="stat-item">
          <CheckCircle className="stat-icon text-green-600" />
          <div>
            <p className="stat-label">Facturas Pagadas</p>
            <p className="stat-value">{stats.pagadas}</p>
          </div>
        </div>
        <div className="stat-item">
          <Clock className="stat-icon text-yellow-600" />
          <div>
            <p className="stat-label">Facturas Pendientes</p>
            <p className="stat-value">{stats.pendientes}</p>
          </div>
        </div>
        <div className="stat-item">
          <XCircle className="stat-icon text-red-600" />
          <div>
            <p className="stat-label">Facturas Vencidas</p>
            <p className="stat-value">{stats.vencidas}</p>
          </div>
        </div>
      </div>

      {/* Lista de Facturas */}
      <div className="invoices-table">
        <div className="table-header">
          <div className="table-row">
            <div className="table-cell">Número</div>
            <div className="table-cell">Cliente</div>
            <div className="table-cell">Período</div>
            <div className="table-cell">Consumo</div>
            <div className="table-cell">Total</div>
            <div className="table-cell">Estado</div>
            <div className="table-cell">Vencimiento</div>
            <div className="table-cell">Acciones</div>
          </div>
        </div>
        
        <div className="table-body">
          {filteredInvoices.map(invoice => (
            <div key={invoice.id} className={`table-row ${invoice.estado}`}>
              <div className="table-cell">
                <span className="invoice-number">{invoice.numero}</span>
              </div>
              <div className="table-cell">
                <div className="client-info">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{invoice.cliente_nombre}</span>
                </div>
              </div>
              <div className="table-cell">
                <div className="period-info">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{invoice.periodo}</span>
                </div>
              </div>
              <div className="table-cell">
                <span className="consumption">{invoice.consumo} m³</span>
              </div>
              <div className="table-cell">
                <span className="total-amount">${invoice.total.toFixed(2)}</span>
              </div>
              <div className="table-cell">
                {getStatusBadge(invoice.estado)}
              </div>
              <div className="table-cell">
                <span className={`due-date ${new Date(invoice.fecha_vencimiento) < new Date() && invoice.estado !== 'pagada' ? 'overdue' : ''}`}>
                  {new Date(invoice.fecha_vencimiento).toLocaleDateString()}
                </span>
              </div>
              <div className="table-cell">
                <div className="action-buttons">
                  <button 
                    className="action-btn view"
                    onClick={() => openModal('view', invoice)}
                    title="Ver detalles"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    className="action-btn edit"
                    onClick={() => openModal('edit', invoice)}
                    title="Editar factura"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {invoice.estado === 'pendiente' && (
                    <button 
                      className="action-btn pay"
                      onClick={() => markAsPaid(invoice.id)}
                      title="Marcar como pagada"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    className="action-btn download"
                    onClick={() => alert('Descargando PDF...')}
                    title="Descargar PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDelete(invoice.id)}
                    title="Eliminar factura"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="empty-state">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3>No se encontraron facturas</h3>
          <p>No hay facturas que coincidan con los criterios de búsqueda.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>
                {modalType === 'create' && 'Crear Nueva Factura'}
                {modalType === 'edit' && 'Editar Factura'}
                {modalType === 'view' && 'Detalles de la Factura'}
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
                <div className="invoice-details">
                  <div className="invoice-header">
                    <h4>Factura {selectedInvoice.numero}</h4>
                    {getStatusBadge(selectedInvoice.estado)}
                  </div>
                  
                  <div className="details-grid">
                    <div className="detail-group">
                      <label>Cliente:</label>
                      <p>{selectedInvoice.cliente_nombre}</p>
                    </div>
                    <div className="detail-group">
                      <label>Período:</label>
                      <p>{selectedInvoice.periodo}</p>
                    </div>
                    <div className="detail-group">
                      <label>Fecha de Emisión:</label>
                      <p>{new Date(selectedInvoice.fecha_emision).toLocaleDateString()}</p>
                    </div>
                    <div className="detail-group">
                      <label>Fecha de Vencimiento:</label>
                      <p>{new Date(selectedInvoice.fecha_vencimiento).toLocaleDateString()}</p>
                    </div>
                    <div className="detail-group">
                      <label>Lectura Anterior:</label>
                      <p>{selectedInvoice.lectura_anterior} m³</p>
                    </div>
                    <div className="detail-group">
                      <label>Lectura Actual:</label>
                      <p>{selectedInvoice.lectura_actual} m³</p>
                    </div>
                    <div className="detail-group">
                      <label>Consumo:</label>
                      <p>{selectedInvoice.consumo} m³</p>
                    </div>
                    <div className="detail-group">
                      <label>Tarifa:</label>
                      <p>${selectedInvoice.tarifa.toFixed(2)} por m³</p>
                    </div>
                    <div className="detail-group">
                      <label>Subtotal:</label>
                      <p>${selectedInvoice.subtotal.toFixed(2)}</p>
                    </div>
                    <div className="detail-group">
                      <label>Impuestos (12%):</label>
                      <p>${selectedInvoice.impuestos.toFixed(2)}</p>
                    </div>
                    <div className="detail-group total">
                      <label>Total:</label>
                      <p>${selectedInvoice.total.toFixed(2)}</p>
                    </div>
                    {selectedInvoice.fecha_pago && (
                      <div className="detail-group">
                        <label>Fecha de Pago:</label>
                        <p>{new Date(selectedInvoice.fecha_pago).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedInvoice.observaciones && (
                      <div className="detail-group full-width">
                        <label>Observaciones:</label>
                        <p>{selectedInvoice.observaciones}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="invoice-actions">
                    <button className="btn-secondary" onClick={() => alert('Descargando PDF...')}>
                      <Download className="w-4 h-4 mr-2" />
                      Descargar PDF
                    </button>
                    <button className="btn-secondary" onClick={() => alert('Enviando por email...')}>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar por Email
                    </button>
                    {selectedInvoice.estado === 'pendiente' && (
                      <button 
                        className="btn-success" 
                        onClick={() => {
                          markAsPaid(selectedInvoice.id);
                          closeModal();
                        }}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Marcar como Pagada
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="invoice-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Cliente *</label>
                      <input
                        type="text"
                        required
                        value={formData.cliente_nombre}
                        onChange={(e) => setFormData({...formData, cliente_nombre: e.target.value})}
                        placeholder="Nombre del cliente"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Período *</label>
                      <input
                        type="month"
                        required
                        value={formData.periodo}
                        onChange={(e) => setFormData({...formData, periodo: e.target.value})}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Lectura Anterior *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        value={formData.lectura_anterior}
                        onChange={(e) => setFormData({...formData, lectura_anterior: parseFloat(e.target.value) || 0})}
                        placeholder="Lectura anterior en m³"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Lectura Actual *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        value={formData.lectura_actual}
                        onChange={(e) => setFormData({...formData, lectura_actual: parseFloat(e.target.value) || 0})}
                        placeholder="Lectura actual en m³"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Tarifa por m³ *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.tarifa}
                        onChange={(e) => setFormData({...formData, tarifa: parseFloat(e.target.value) || 0})}
                        placeholder="Tarifa por m³"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Fecha de Vencimiento *</label>
                      <input
                        type="date"
                        required
                        value={formData.fecha_vencimiento}
                        onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
                      />
                    </div>
                    
                    <div className="calculation-summary">
                      <div className="calc-item">
                        <span>Consumo:</span>
                        <span>{formData.consumo.toFixed(2)} m³</span>
                      </div>
                      <div className="calc-item">
                        <span>Subtotal:</span>
                        <span>${formData.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="calc-item">
                        <span>Impuestos (12%):</span>
                        <span>${formData.impuestos.toFixed(2)}</span>
                      </div>
                      <div className="calc-item total">
                        <span>Total:</span>
                        <span>${formData.total.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="form-group full-width">
                      <label>Observaciones</label>
                      <textarea
                        value={formData.observaciones}
                        onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                        placeholder="Observaciones adicionales..."
                        rows="3"
                      />
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={closeModal}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
                      <Save className="w-4 h-4 mr-2" />
                      {modalType === 'create' ? 'Crear Factura' : 'Guardar Cambios'}
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

export default InvoicesSection;