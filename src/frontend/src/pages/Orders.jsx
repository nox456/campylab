'use client';

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Link, navigate } from '../router/Router';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  XMarkIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export default function Orders() {
  const { hasPermission } = useAuth();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Resources
  const [patients, setPatients] = useState([]);
  const [exams, setExams] = useState([]);

  // Form state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedExams, setSelectedExams] = useState([]);
  const [prioridad, setPrioridad] = useState('rutina');
  const [observaciones, setObservaciones] = useState('');
  
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
    const matchesStatus = !statusFilter || o.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPatients = patients.filter(p =>
    (p.activo !== false) && // Only active patients
    (p.cedula.toString().includes(patientSearch) ||
    p.nombre.toLowerCase().includes(patientSearch.toLowerCase()))
  );

  const getStatusBadge = (status) => {
    const badges = {
      creado: { class: 'badge badge-neutral', label: 'Creado' },
      pendiente: { class: 'badge badge-neutral', label: 'Pendiente' },
      procesando: { class: 'badge badge-info', label: 'Procesando' },
      resultados_cargados: { class: 'badge badge-warning', label: 'Resultados' },
      pagado: { class: 'badge badge-success', label: 'Pagado' },
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
    } catch (e) {
        alert(e.message);
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
          <button 
            className={`btn btn-outline ${showFilters ? 'btn-primary' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon style={{ width: '18px', height: '18px' }} />
            Filtros
          </button>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <PlusIcon style={{ width: '18px', height: '18px' }} />
            Nueva Orden
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ minWidth: '200px' }}>
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="procesando">Procesando</option>
                <option value="resultados_cargados">Resultados Cargados</option>
                <option value="pagado">Pagado</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="card">
        <div className="table-container">
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
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    <ClipboardDocumentListIcon style={{ width: '48px', height: '48px', color: 'var(--muted-foreground)', margin: '0 auto 0.5rem' }} />
                    <p className="text-muted">No se encontraron ordenes</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
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
                        <Link to={`/ordenes/${order.id}`} className="btn btn-sm btn-outline">
                          <EyeIcon style={{ width: '16px', height: '16px' }} />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
