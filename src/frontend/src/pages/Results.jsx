'use client';

import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Link } from '../router/Router';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

// Mock pending orders for results
const mockPendingOrders = [
  {
    id: 1,
    paciente: { cedula: 12345678, nombre: 'Maria Garcia', sexo: 'F', edad: 39 },
    fecha: '2025-01-18',
    prioridad: 'urgente',
    examenes: [
      { id: 1, nombre: 'Hematologia Completa', estado: 'pendiente' },
      { id: 2, nombre: 'Perfil Lipidico', estado: 'pendiente' },
    ],
  },
  {
    id: 3,
    paciente: { cedula: 34567890, nombre: 'Ana Martinez', sexo: 'F', edad: 34 },
    fecha: '2025-01-17',
    prioridad: 'rutina',
    examenes: [
      { id: 3, nombre: 'Glicemia', estado: 'cargado' },
      { id: 4, nombre: 'Urea', estado: 'pendiente' },
      { id: 5, nombre: 'Creatinina', estado: 'pendiente' },
    ],
  },
  {
    id: 6,
    paciente: { cedula: 67890123, nombre: 'Miguel Torres', sexo: 'M', edad: 52 },
    fecha: '2025-01-18',
    prioridad: 'urgente',
    examenes: [
      { id: 6, nombre: 'Perfil Hepatico', estado: 'pendiente' },
    ],
  },
  {
    id: 7,
    paciente: { cedula: 78901234, nombre: 'Sofia Ramirez', sexo: 'F', edad: 28 },
    fecha: '2025-01-17',
    prioridad: 'rutina',
    examenes: [
      { id: 7, nombre: 'Perfil Tiroideo', estado: 'pendiente' },
    ],
  },
];

// Mock exam parameters for loading results
const examParameters = {
  'Hematologia Completa': [
    { nombre: 'Hemoglobina', unidad: 'g/dL', min: 12.0, max: 16.0 },
    { nombre: 'Hematocrito', unidad: '%', min: 36, max: 48 },
    { nombre: 'Globulos Blancos', unidad: '/mm3', min: 4500, max: 11000 },
    { nombre: 'Plaquetas', unidad: '/mm3', min: 150000, max: 400000 },
    { nombre: 'Globulos Rojos', unidad: 'mill/mm3', min: 4.0, max: 5.5 },
    { nombre: 'VCM', unidad: 'fL', min: 80, max: 100 },
    { nombre: 'HCM', unidad: 'pg', min: 27, max: 31 },
    { nombre: 'CHCM', unidad: 'g/dL', min: 32, max: 36 },
  ],
  'Perfil Lipidico': [
    { nombre: 'Colesterol Total', unidad: 'mg/dL', min: 0, max: 200 },
    { nombre: 'Trigliceridos', unidad: 'mg/dL', min: 0, max: 150 },
    { nombre: 'HDL', unidad: 'mg/dL', min: 40, max: 60 },
    { nombre: 'LDL', unidad: 'mg/dL', min: 0, max: 100 },
    { nombre: 'VLDL', unidad: 'mg/dL', min: 0, max: 30 },
  ],
  'Glicemia': [
    { nombre: 'Glucosa en Ayunas', unidad: 'mg/dL', min: 70, max: 100 },
  ],
  'Urea': [
    { nombre: 'Urea', unidad: 'mg/dL', min: 15, max: 45 },
  ],
  'Creatinina': [
    { nombre: 'Creatinina', unidad: 'mg/dL', min: 0.7, max: 1.3 },
  ],
  'Perfil Hepatico': [
    { nombre: 'Bilirrubina Total', unidad: 'mg/dL', min: 0.1, max: 1.2 },
    { nombre: 'Bilirrubina Directa', unidad: 'mg/dL', min: 0, max: 0.3 },
    { nombre: 'TGO (AST)', unidad: 'U/L', min: 5, max: 40 },
    { nombre: 'TGP (ALT)', unidad: 'U/L', min: 7, max: 56 },
    { nombre: 'Fosfatasa Alcalina', unidad: 'U/L', min: 44, max: 147 },
    { nombre: 'GGT', unidad: 'U/L', min: 9, max: 48 },
  ],
  'Perfil Tiroideo': [
    { nombre: 'TSH', unidad: 'mIU/L', min: 0.4, max: 4.0 },
    { nombre: 'T4 Libre', unidad: 'ng/dL', min: 0.8, max: 1.8 },
    { nombre: 'T3 Total', unidad: 'ng/dL', min: 80, max: 200 },
  ],
};

export default function Results() {
  const { user, hasPermission } = useAuth();
  const [orders, setOrders] = useState(mockPendingOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [resultValues, setResultValues] = useState({});

  const canLoadResults = hasPermission('results', 'create') || hasPermission('results', 'update');

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toString().includes(searchTerm) ||
      o.paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.paciente.cedula.toString().includes(searchTerm);
    const matchesPriority = !priorityFilter || o.prioridad === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const urgentCount = orders.filter(o => o.prioridad === 'urgente').length;
  const pendingCount = orders.reduce((acc, o) => 
    acc + o.examenes.filter(e => e.estado === 'pendiente').length, 0
  );

  const handleOpenResultsModal = (order, exam) => {
    setSelectedOrder(order);
    setSelectedExam(exam);
    setResultValues({});
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setSelectedExam(null);
    setResultValues({});
  };

  const handleSaveResults = () => {
    // Update the exam status
    setOrders(orders.map(o => {
      if (o.id === selectedOrder.id) {
        return {
          ...o,
          examenes: o.examenes.map(e => 
            e.id === selectedExam.id ? { ...e, estado: 'cargado' } : e
          ),
        };
      }
      return o;
    }));
    handleCloseModal();
  };

  const isValueOutOfRange = (value, min, max) => {
    const numValue = parseFloat(value);
    return !isNaN(numValue) && (numValue < min || numValue > max);
  };

  return (
    <Layout title="Resultados">
      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-card-value">{orders.length}</p>
              <p className="stat-card-label">Ordenes Pendientes</p>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(8, 145, 178, 0.1)' }}>
              <ClipboardDocumentCheckIcon style={{ width: '24px', height: '24px', color: 'var(--primary)' }} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-card-value">{urgentCount}</p>
              <p className="stat-card-label">Urgentes</p>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <ExclamationTriangleIcon style={{ width: '24px', height: '24px', color: 'var(--danger)' }} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-card-value">{pendingCount}</p>
              <p className="stat-card-label">Examenes por Procesar</p>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
              <BeakerIcon style={{ width: '24px', height: '24px', color: 'var(--warning)' }} />
            </div>
          </div>
        </div>
      </div>

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
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ minWidth: '200px' }}>
              <label className="form-label">Prioridad</label>
              <select
                className="form-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="urgente">Urgente</option>
                <option value="rutina">Rutina</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredOrders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <BeakerIcon style={{ width: '48px', height: '48px', color: 'var(--muted-foreground)', margin: '0 auto 0.5rem' }} />
            <p className="text-muted">No hay ordenes pendientes de procesar</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div 
              key={order.id} 
              className="card"
              style={{ 
                borderLeft: `4px solid ${order.prioridad === 'urgente' ? 'var(--danger)' : 'var(--primary)'}` 
              }}
            >
              {/* Order Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontWeight: 600, fontSize: '1.0625rem' }}>
                      Orden #{order.id.toString().padStart(4, '0')}
                    </h3>
                    <span className={`badge ${order.prioridad === 'urgente' ? 'badge-danger' : 'badge-neutral'}`}>
                      {order.prioridad === 'urgente' ? 'URGENTE' : 'Rutina'}
                    </span>
                  </div>
                  <p className="text-sm">
                    <strong>{order.paciente.nombre}</strong> | CI: {order.paciente.cedula} | 
                    {order.paciente.sexo === 'M' ? ' Masculino' : ' Femenino'}, {order.paciente.edad} anos
                  </p>
                  <p className="text-xs text-muted">Fecha: {order.fecha}</p>
                </div>
                <Link to={`/ordenes/${order.id}`} className="btn btn-sm btn-outline">
                  <EyeIcon style={{ width: '16px', height: '16px' }} />
                  Ver Orden
                </Link>
              </div>

              {/* Exams List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {order.examenes.map(exam => (
                  <div 
                    key={exam.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--muted)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <BeakerIcon style={{ width: '20px', height: '20px', color: 'var(--muted-foreground)' }} />
                      <span style={{ fontWeight: 500 }}>{exam.nombre}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`badge ${exam.estado === 'cargado' ? 'badge-success' : 'badge-warning'}`}>
                        {exam.estado === 'cargado' ? 'Cargado' : 'Pendiente'}
                      </span>
                      {canLoadResults && exam.estado === 'pendiente' && (
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleOpenResultsModal(order, exam)}
                        >
                          <DocumentArrowUpIcon style={{ width: '16px', height: '16px' }} />
                          Cargar Resultados
                        </button>
                      )}
                      {exam.estado === 'cargado' && (
                        <button className="btn btn-sm btn-outline">
                          <EyeIcon style={{ width: '16px', height: '16px' }} />
                          Ver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load Results Modal */}
      {selectedOrder && selectedExam && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Cargar Resultados</h3>
                <p className="text-sm text-muted">
                  {selectedExam.nombre} - {selectedOrder.paciente.nombre}
                </p>
              </div>
              <button className="btn btn-sm btn-outline" onClick={handleCloseModal}>
                <XMarkIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {/* Patient Info */}
              <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                <strong>Paciente:</strong> {selectedOrder.paciente.nombre} | 
                CI: {selectedOrder.paciente.cedula} | 
                {selectedOrder.paciente.sexo === 'M' ? ' Masculino' : ' Femenino'}, {selectedOrder.paciente.edad} anos
              </div>

              {/* Parameters Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(examParameters[selectedExam.nombre] || []).map((param, idx) => {
                  const value = resultValues[param.nombre] || '';
                  const outOfRange = value && isValueOutOfRange(value, param.min, param.max);
                  
                  return (
                    <div 
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 120px 1fr',
                        gap: '1rem',
                        alignItems: 'center',
                        padding: '0.75rem',
                        backgroundColor: outOfRange ? 'rgba(239, 68, 68, 0.1)' : 'var(--muted)',
                        borderRadius: 'var(--radius)',
                        border: outOfRange ? '1px solid var(--danger)' : '1px solid transparent',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{param.nombre}</p>
                        <p className="text-xs text-muted">
                          Ref: {param.min} - {param.max} {param.unidad}
                        </p>
                      </div>
                      <div>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Valor"
                          step="0.01"
                          value={value}
                          onChange={(e) => setResultValues({
                            ...resultValues,
                            [param.nombre]: e.target.value,
                          })}
                          style={{
                            borderColor: outOfRange ? 'var(--danger)' : undefined,
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="text-sm text-muted">{param.unidad}</span>
                        {value && (
                          <span className={`badge ${outOfRange ? 'badge-danger' : 'badge-success'}`}>
                            {outOfRange ? 'Fuera de rango' : 'Normal'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* File Upload (optional) */}
              <div style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Archivos Adjuntos (opcional)</label>
                <div style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}>
                  <DocumentArrowUpIcon style={{ width: '32px', height: '32px', color: 'var(--muted-foreground)', margin: '0 auto 0.5rem' }} />
                  <p className="text-sm text-muted">
                    Arrastra archivos aqui o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted">
                    Imagenes de microscopia, documentos, etc.
                  </p>
                </div>
              </div>

              {/* Digital Signature Notice */}
              <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
                Al guardar, los resultados quedaran registrados con su firma digital: <strong>{user?.nombre}</strong>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveResults}
              >
                <CheckIcon style={{ width: '18px', height: '18px' }} />
                Guardar y Validar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
