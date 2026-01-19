'use client';

import { useState } from 'react';
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

// Mock data
const mockExams = [
  { id: 1, nombre: 'Hematologia Completa', categoria: 'Hematologia', costo: 50.00 },
  { id: 2, nombre: 'Perfil Lipidico', categoria: 'Quimica', costo: 80.00 },
  { id: 3, nombre: 'Glicemia', categoria: 'Quimica', costo: 25.00 },
  { id: 4, nombre: 'Urea', categoria: 'Quimica', costo: 25.00 },
  { id: 5, nombre: 'Creatinina', categoria: 'Quimica', costo: 25.00 },
  { id: 6, nombre: 'Perfil Tiroideo', categoria: 'Hormonas', costo: 150.00 },
  { id: 7, nombre: 'Perfil Hepatico', categoria: 'Quimica', costo: 120.00 },
  { id: 8, nombre: 'Examen de Orina', categoria: 'Urologia', costo: 35.00 },
  { id: 9, nombre: 'Coprologico', categoria: 'Parasitologia', costo: 40.00 },
  { id: 10, nombre: 'HIV', categoria: 'Serologia', costo: 60.00 },
];

const mockPatients = [
  { cedula: 12345678, nombre: 'Maria Garcia' },
  { cedula: 23456789, nombre: 'Jose Rodriguez' },
  { cedula: 34567890, nombre: 'Ana Martinez' },
  { cedula: 45678901, nombre: 'Carlos Lopez' },
  { cedula: 56789012, nombre: 'Laura Hernandez' },
];

const initialOrders = [
  { id: 1, paciente: { cedula: 12345678, nombre: 'Maria Garcia' }, fecha: '2025-01-18', estado: 'creado', prioridad: 'urgente', total: 150.00, pagado: 0 },
  { id: 2, paciente: { cedula: 23456789, nombre: 'Jose Rodriguez' }, fecha: '2025-01-18', estado: 'resultados_cargados', prioridad: 'rutina', total: 280.00, pagado: 280.00 },
  { id: 3, paciente: { cedula: 34567890, nombre: 'Ana Martinez' }, fecha: '2025-01-17', estado: 'procesando', prioridad: 'rutina', total: 95.00, pagado: 50.00 },
  { id: 4, paciente: { cedula: 45678901, nombre: 'Carlos Lopez' }, fecha: '2025-01-17', estado: 'pagado', prioridad: 'urgente', total: 420.00, pagado: 420.00 },
  { id: 5, paciente: { cedula: 56789012, nombre: 'Laura Hernandez' }, fecha: '2025-01-16', estado: 'entregado', prioridad: 'rutina', total: 175.00, pagado: 175.00 },
];

export default function Orders() {
  const { hasPermission } = useAuth();
  const [orders, setOrders] = useState(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedExams, setSelectedExams] = useState([]);
  const [prioridad, setPrioridad] = useState('rutina');
  const [observaciones, setObservaciones] = useState('');

  const canCreate = hasPermission('orders', 'create');

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toString().includes(searchTerm) ||
      o.paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.paciente.cedula.toString().includes(searchTerm);
    const matchesStatus = !statusFilter || o.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPatients = mockPatients.filter(p =>
    p.cedula.toString().includes(patientSearch) ||
    p.nombre.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const badges = {
      creado: { class: 'badge badge-neutral', label: 'Creado' },
      procesando: { class: 'badge badge-info', label: 'Procesando' },
      resultados_cargados: { class: 'badge badge-warning', label: 'Resultados Cargados' },
      inventario_descontado: { class: 'badge badge-info', label: 'Inventario Descontado' },
      pagado: { class: 'badge badge-success', label: 'Pagado' },
      entregado: { class: 'status-pill status-completed', label: 'Entregado' },
      cancelado: { class: 'status-pill status-cancelled', label: 'Cancelado' },
    };
    return badges[status] || { class: 'badge badge-neutral', label: status };
  };

  const calculateTotal = () => {
    return selectedExams.reduce((sum, examId) => {
      const exam = mockExams.find(e => e.id === examId);
      return sum + (exam?.costo || 0);
    }, 0);
  };

  const handleToggleExam = (examId) => {
    setSelectedExams(prev => 
      prev.includes(examId) 
        ? prev.filter(id => id !== examId)
        : [...prev, examId]
    );
  };

  const handleCreateOrder = () => {
    if (!selectedPatient || selectedExams.length === 0) return;

    const newOrder = {
      id: orders.length + 1,
      paciente: selectedPatient,
      fecha: new Date().toISOString().split('T')[0],
      estado: 'creado',
      prioridad,
      total: calculateTotal(),
      pagado: 0,
    };

    setOrders([newOrder, ...orders]);
    handleCloseModal();
    navigate(`/ordenes/${newOrder.id}`);
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
                <option value="creado">Creado</option>
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
                <th>Pagado</th>
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
                  const pendiente = order.total - order.pagado;
                  return (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>#{order.id.toString().padStart(4, '0')}</td>
                      <td>
                        <div>
                          <p style={{ fontWeight: 500 }}>{order.paciente.nombre}</p>
                          <p className="text-xs text-muted">CI: {order.paciente.cedula}</p>
                        </div>
                      </td>
                      <td>{order.fecha}</td>
                      <td>
                        <span className={`badge ${order.prioridad === 'urgente' ? 'badge-danger' : 'badge-neutral'}`}>
                          {order.prioridad === 'urgente' ? 'Urgente' : 'Rutina'}
                        </span>
                      </td>
                      <td>
                        <span className={statusBadge.class}>{statusBadge.label}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>${order.total.toFixed(2)}</td>
                      <td>
                        <span className={pendiente > 0 ? 'text-muted' : ''} style={{ color: pendiente > 0 ? 'var(--danger)' : 'var(--success)' }}>
                          ${order.pagado.toFixed(2)}
                          {pendiente > 0 && (
                            <span className="text-xs" style={{ display: 'block', color: 'var(--danger)' }}>
                              Pendiente: ${pendiente.toFixed(2)}
                            </span>
                          )}
                        </span>
                      </td>
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
                      placeholder="Buscar paciente por cedula o nombre..."
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
                            key={patient.cedula}
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
                  {mockExams.map(exam => {
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
                          <p className="text-xs text-muted">{exam.categoria}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                            ${exam.costo.toFixed(2)}
                          </span>
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
