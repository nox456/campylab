'use client';

import { useState, useEffect } from 'react';
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

export default function Results() {
  const { user, hasPermission } = useAuth();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('pendiente'); // Default to pending
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [resultValues, setResultValues] = useState({});
  const [examParams, setExamParams] = useState([]);
  const [loadingParams, setLoadingParams] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const canLoadResults = hasPermission('results', 'create') || hasPermission('results', 'update');

  useEffect(() => {
      if (successMessage) {
          const timer = setTimeout(() => setSuccessMessage(''), 3000);
          return () => clearTimeout(timer);
      }
  }, [successMessage]);

  const fetchPendingOrders = async () => {
      try {
          const res = await fetch('/api/results/pending');
          if (!res.ok) throw new Error('Error fetching pending');
          const data = await res.json();
          setOrders(data);
      } catch (e) {
          console.error(e);
      }
  };

  useEffect(() => {
      fetchPendingOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toString().includes(searchTerm) ||
      o.paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.paciente.cedula.toString().includes(searchTerm);
    const matchesPriority = !priorityFilter || o.prioridad === priorityFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'pendiente') {
        matchesStatus = o.estado === 'pendiente' || o.estado === 'procesando' || o.estado === 'creado';
    } else if (statusFilter === 'completado') {
        matchesStatus = o.estado === 'resultados_cargados' || o.estado === 'entregado' || o.estado === 'pagado';
    }

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const urgentCount = orders.filter(o => o.prioridad === 'urgente').length;
  const pendingCount = orders.reduce((acc, o) => 
    acc + o.examenes.filter(e => e.estado === 'pendiente').length, 0
  );

  const handleOpenResultsModal = async (order, exam) => {
    setSelectedOrder(order);
    setSelectedExam(exam);
    setResultValues({});
    setLoadingParams(true);
    
    try {
        const res = await fetch(`/api/results/exam-parameters/${exam.id}`);
        if (!res.ok) throw new Error('Error fetching params');
        const params = await res.json();
        setExamParams(params);
        
        // Populate initial values if needed (empty for new results)
        const initial = {};
        params.forEach(p => initial[p.nombre] = '');
        setResultValues(initial);
    } catch(e) {
        // alert("Error cargando parametros del examen"); 
        console.error(e);
        handleCloseModal();
    } finally {
        setLoadingParams(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setSelectedExam(null);
    setResultValues({});
    setExamParams([]);
  };

  const handleSaveResults = async () => {
    try {
        // Construct details array
        const detalles = examParams.map(p => ({
            nombre: p.nombre,
            unidad: p.unidad,
            valor: resultValues[p.nombre]
        }));

        const payload = {
            ordenId: selectedOrder.id,
            examenId: selectedExam.id,
            pacienteId: selectedOrder.paciente.id,
            detalles
        };

        const res = await fetch('/api/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Error saving results');

        await fetchPendingOrders();
        handleCloseModal();
        setSuccessMessage('Resultados guardados exitosamente');
    } catch(e) {
        console.error(e);
    }
  };

  const isValueOutOfRange = (value, min, max) => {
    const numValue = parseFloat(value);
    return !isNaN(numValue) && (numValue < min || numValue > max);
  };

  return (
    <Layout title="Resultados">
      {/* Success Notification */}
      {successMessage && (
          <div className="alert alert-success" style={{ 
              position: 'fixed', 
              top: '20px', 
              right: '20px', 
              zIndex: 1000,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              animation: 'fadeIn 0.3s ease-in-out'
          }}>
              <CheckIcon style={{ width: '20px', height: '20px', marginRight: '0.5rem' }} />
              {successMessage}
          </div>
      )}

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {/* ... (Cards remain same) ... */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-card-value">{orders.length}</p>
              <p className="stat-card-label">Total Ordenes</p>
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
              <p className="stat-card-label">Examenes Pendientes</p>
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
              <label className="form-label">Estado Orden</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="pendiente">Pendientes / En Proceso</option>
                <option value="completado">Completadas / Entregadas</option>
              </select>
            </div>
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
              
              {loadingParams ? (
                  <div className="text-center p-4">Cargando parametros...</div>
              ) : (
                  <>
                  {/* Patient Info */}
                  <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                    <strong>Paciente:</strong> {selectedOrder.paciente.nombre} | 
                    CI: {selectedOrder.paciente.cedula} | 
                    {selectedOrder.paciente.sexo === 'M' ? ' Masculino' : ' Femenino'}, {selectedOrder.paciente.edad} anos
                  </div>

                  {/* Parameters Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {examParams.length === 0 ? (
                        <p className="text-muted text-center">No hay parametros configurados para este examen.</p>
                    ) : (
                        examParams.map((param, idx) => {
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
                                step="any"
                                value={value}
                                onChange={(e) => setResultValues({
                                    ...resultValues,
                                    [param.nombre]: e.target.value,
                                })}
                                style={{
                                    borderColor: outOfRange ? 'var(--danger)' : undefined,
                                }}
                                required
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
                        })
                    )}
                  </div>
                
                  {/* Digital Signature Notice */}
                  <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
                    Al guardar, los resultados quedaran registrados con su firma digital: <strong>{user?.nombre}</strong>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveResults}
                disabled={loadingParams || examParams.length === 0}
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
