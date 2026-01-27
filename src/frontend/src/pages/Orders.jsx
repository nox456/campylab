'use client';

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { Link, navigate } from '../router/Router';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PrinterIcon,
  XMarkIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
  CheckIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../context/ToastContext';

export default function Orders() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('activas');
  const [showCreateModal, setShowCreateModal] = useState(false);
  /* const [showFilters, setShowFilters] = useState(false); */
  const [loading, setLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form Resources
  const [patients, setPatients] = useState([]);
  const [exams, setExams] = useState([]);

  // Form state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedExams, setSelectedExams] = useState([]);
  const [prioridad, setPrioridad] = useState('rutina');
  const [observaciones, setObservaciones] = useState('');

  // Confirmation Modals
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedOrderForEmail, setSelectedOrderForEmail] = useState(null);
  
  // Fetch Orders
  const fetchOrders = async () => {
      try {
          const res = await fetch('/api/orders');
          if (!res.ok) throw new Error('Error fetching orders');
          const data = await res.json();
          setOrders(data);
      } catch (e) {
          console.error(e);
      }
  };

  useEffect(() => {
      fetchOrders();
  }, []);

  // Fetch Resources when modal opens
  useEffect(() => {
      if (showCreateModal) {
          fetch('/api/patients').then(res => res.json()).then(setPatients).catch(console.error);
          fetch('/api/exams').then(res => res.json()).then(setExams).catch(console.error);
      }
  }, [showCreateModal]);

  const canCreate = hasPermission('orders', 'create');

  const filteredOrders = orders.filter(o => {
    // Note: ID in DB is integer, o.id might be number. o.paciente is object.
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = 
      o.id.toString().includes(searchTerm) ||
      o.paciente_nombre.toLowerCase().includes(searchLow) ||
      o.paciente_cedula.toString().includes(searchTerm);
    let matchesStatus = true;
    if (statusFilter === 'activas') {
        matchesStatus = o.estado !== 'entregado' && o.estado !== 'cancelado';
    } else if (statusFilter === 'todos') {
        matchesStatus = true;
    } else {
        matchesStatus = o.estado === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredPatients = patients.filter(p =>
    (p.activo !== false) && // Only active patients
    (p.cedula.toString().includes(patientSearch) ||
    p.nombre.toLowerCase().includes(patientSearch.toLowerCase()))
  );

  const getStatusBadge = (status) => {
    const badges = {
      creado: { class: 'badge badge-info', label: 'En espera de Resultados' },
      resultados_cargados: { class: 'badge badge-warning', label: 'En Espera de Pago' },
      pagado: { class: 'badge badge-success', label: 'Pagado / Por Entregar' },
      entregado: { class: 'status-pill status-completed', label: 'Entregado' },
      cancelado: { class: 'status-pill status-cancelled', label: 'Cancelado' },
    };
    return badges[status] || { class: 'badge badge-neutral', label: status };
  };

  const calculateTotal = () => {
    return selectedExams.reduce((sum, examId) => {
      const exam = exams.find(e => e.id === examId);
      // Backend should confirm price, but frontend estimation is good for UI
      return sum + (Number(exam?.precio) || 0);
    }, 0);
  };

  const handleToggleExam = (examId) => {
    setSelectedExams(prev => 
      prev.includes(examId) 
        ? prev.filter(id => id !== examId)
        : [...prev, examId]
    );
  };

  const handleCreateOrder = async () => {
    if (!selectedPatient || selectedExams.length === 0) return;

    try {
        const payload = {
            pacienteId: selectedPatient.id,
            exams: selectedExams,
            prioridad,
            observaciones,
            total: calculateTotal()
        };

        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Error creating order');
        
        const newOrder = await res.json();
        // Refresh list
        await fetchOrders();
        handleCloseModal();
        // Assuming navigate works.
        // navigate(`/ordenes/${newOrder.id}`); 
        // For now, staying on list is fine or simple alert
        showToast('Orden creada exitosamente', 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setSelectedPatient(null);
    setPatientSearch('');
    setSelectedExams([]);
    setPrioridad('rutina');
    setObservaciones('');
  };

  const handleSendEmailRequest = (orderId) => {
    setSelectedOrderForEmail(orderId);
    setShowEmailModal(true);
  };

  const handleConfirmSendEmail = async () => {
    if (!selectedOrderForEmail) return;
    try {
        showToast('Enviando correo...', 'info');
        const res = await fetch(`/api/pdf/email/${selectedOrderForEmail}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({})
        });
        
        const data = await res.json();
        if (!res.ok) {
            // Show specific backend message in toast and stop
            showToast(data.error || 'Error enviando correo', 'error');
            return; 
        }
        
        showToast('Correo enviado exitosamente', 'success');
    } catch(e) {
        // Network errors or others
        showToast(e.message, 'error');
    }
  };

  return (
    <Layout title="Ordenes">
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="search-box" style={{ width: '280px' }}>
            <MagnifyingGlassIcon />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar orden o paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '200px' }}
            >
                <option value="activas">Activas (Pendientes)</option>
                <option value="todos">Todas</option>
                <option value="creado">En espera de Resultados</option>
                <option value="resultados_cargados">En Espera de Pago</option>
                <option value="pagado">Pagado / Por Entregar</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
            </select>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <PlusIcon style={{ width: '18px', height: '18px' }} />
            Nueva Orden
          </button>
        )}
      </div>

      {/* Filters */}


      {/* Orders Table */}
      <div className="card">
        <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Paciente</th>
                <th>Fecha</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    <ClipboardDocumentListIcon style={{ width: '48px', height: '48px', color: 'var(--muted-foreground)', margin: '0 auto 0.5rem' }} />
                    <p className="text-muted">No se encontraron ordenes</p>
                  </td>
                </tr>
              ) : (
                currentOrders.map(order => {
                  const statusBadge = getStatusBadge(order.estado);
                  // Ensure numeric values
                  const total = Number(order.total) || 0;
                  
                  return (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>#{order.id.toString().padStart(4, '0')}</td>
                      <td>
                        <div>
                          <p style={{ fontWeight: 500 }}>{order.paciente_nombre}</p>
                          <p className="text-xs text-muted">CI: {order.paciente_cedula}</p>
                        </div>
                      </td>
                      <td>{order.fecha ? new Date(order.fecha).toLocaleDateString() : '-'}</td>
                      <td>
                        <span className={`badge ${order.prioridad === 'urgente' ? 'badge-danger' : 'badge-neutral'}`}>
                          {order.prioridad === 'urgente' ? 'Urgente' : 'Rutina'}
                        </span>
                      </td>
                      <td>
                        <span className={statusBadge.class}>{statusBadge.label}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>${total.toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link to={`/ordenes/${order.id}`} className="btn btn-sm btn-outline">
                            <EyeIcon style={{ width: '16px', height: '16px' }} />
                            Ver
                          </Link>
                          {order.has_results && (
                            <>
                              <button 
                                className="btn btn-sm btn-outline"
                                onClick={() => window.open(`/api/pdf/result/${order.id}`, '_blank')}
                                title="Exportar PDF"
                              >
                                <PrinterIcon style={{ width: '16px', height: '16px' }} />
                              </button>
                              <button 
                                className="btn btn-sm btn-outline"
                                onClick={() => handleSendEmailRequest(order.id)}
                                title="Enviar por Correo"
                              >
                                <EnvelopeIcon style={{ width: '16px', height: '16px' }} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Control */}
        <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onConfirm={handleConfirmSendEmail}
        title="Enviar Resultados por Correo"
        message="¿Está seguro de enviar los resultados en PDF al correo del paciente?"
        confirmText="Enviar Correo"
        confirmStyle="primary"
      />

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Nueva Orden</h3>
              <button className="btn btn-sm btn-outline" onClick={handleCloseModal}>
                <XMarkIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {/* Step 1: Select Patient */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                  1. Seleccionar Paciente
                </h4>
                {selectedPatient ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: 'var(--muted)',
                    borderRadius: 'var(--radius)',
                  }}>
                    <div>
                      <p style={{ fontWeight: 500 }}>{selectedPatient.nombre}</p>
                      <p className="text-xs text-muted">CI: {selectedPatient.cedula}</p>
                    </div>
                    <button className="btn btn-sm btn-outline" onClick={() => setSelectedPatient(null)}>
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Buscar paciente por cedula o nombre (ENTER para filtrar)"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      style={{ marginBottom: '0.5rem' }}
                    />
                    {patientSearch && (
                      <div style={{ 
                        maxHeight: '150px', 
                        overflowY: 'auto', 
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                      }}>
                        {filteredPatients.map(patient => (
                          <button
                            key={patient.id}
                            className="w-full"
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '0.75rem',
                              background: 'none',
                              border: 'none',
                              borderBottom: '1px solid var(--border)',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                            onClick={() => {
                              setSelectedPatient(patient);
                              setPatientSearch('');
                            }}
                          >
                            <span>{patient.nombre}</span>
                            <span className="text-muted">CI: {patient.cedula}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Select Exams */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                  2. Seleccionar Examenes
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                  gap: '0.5rem',
                }}>
                  {exams.map(exam => {
                    const isSelected = selectedExams.includes(exam.id);
                    return (
                      <button
                        key={exam.id}
                        onClick={() => handleToggleExam(exam.id)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius)',
                          backgroundColor: isSelected ? 'rgba(8, 145, 178, 0.1)' : 'var(--card)',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{exam.nombre}</p>
                          <p className="text-xs text-muted">${Number(exam.precio).toFixed(2)}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          
                          {isSelected && (
                            <CheckIcon style={{ width: '18px', height: '18px', color: 'var(--primary)' }} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Priority and Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Prioridad</label>
                  <select
                    className="form-select"
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                  >
                    <option value="rutina">Rutina</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Notas adicionales..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>
              </div>

              {/* Summary */}
              {selectedExams.length > 0 && (
                <div style={{ 
                  marginTop: '1.5rem', 
                  padding: '1rem', 
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500 }}>
                      {selectedExams.length} examen(es) seleccionado(s)
                    </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                      Total: ${calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleCreateOrder}
                disabled={!selectedPatient || selectedExams.length === 0}
              >
                Crear Orden
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
