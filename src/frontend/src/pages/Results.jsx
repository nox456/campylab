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
  
  // Inventory State
  const [consumables, setConsumables] = useState([]); // [{ productoId, nombre, cantidad, unit }]
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showProductSearch, setShowProductSearch] = useState(false);

  const canLoadResults = hasPermission('results', 'create') || hasPermission('results', 'update');

  useEffect(() => {
      if (successMessage) {
          const timer = setTimeout(() => setSuccessMessage(''), 3000);
          return () => clearTimeout(timer);
      }
  }, [successMessage]);

  // Search products for inventory
  useEffect(() => {
     if (productSearch.length > 2) {
         fetch(`/api/inventory?search=${productSearch}`)
            .then(res => res.json())
            .then(data => setSearchResults(data))
            .catch(console.error);
     } else {
         setSearchResults([]);
     }
  }, [productSearch]);

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
    setConsumables([]); // Reset consumables
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
    setConsumables([]);
  };

  const handleAddConsumable = (product) => {
      if (consumables.find(c => c.productoId === product.id)) return;
      setConsumables([...consumables, {
          productoId: product.id,
          nombre: product.nombre,
          cantidad: 1,
          unit: product.unidad_medida,
          maxStock: parseInt(product.stock_total) || 0
      }]);
      setProductSearch('');
      setSearchResults([]);
      setShowProductSearch(false);
  };

  const handleUpdateConsumableQty = (id, qty) => {
      setConsumables(consumables.map(c => 
          c.productoId === id ? { ...c, cantidad: parseInt(qty) || 0 } : c
      ));
  };

  const handleRemoveConsumable = (id) => {
      setConsumables(consumables.filter(c => c.productoId !== id));
  };
  
  // Validation Check
  const hasConsumableErrors = consumables.some(c => c.cantidad > c.maxStock || c.cantidad <= 0);

  // Helper to validate results before save
  const handleSaveResults = async () => {
      // 1. Validation is now handled by HTML form (required) and disabled button (stock)

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
              detalles,
              consumibles: consumables 
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
          alert('Error guardando resultados: ' + e.message);
      }
  };

  const isValueOutOfRange = (value, min, max) => {
    // If no ranges, return false
    if (min === null || max === null || min === undefined || max === undefined) return false;
    const numValue = parseFloat(value);
    return !isNaN(numValue) && (numValue < min || numValue > max);
  };
  
  // Validation Check for UI only (to show red border and button enablement)
  // We enable the button to let the User click and see the Alert msg

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
            <MagnifyingGlassIcon style={{ width: '20px', height: '20px' }} />
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
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
            <form onSubmit={(e) => { e.preventDefault(); handleSaveResults(); }}>
            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              
              {loadingParams ? (
                  <div className="text-center p-4">Cargando parametros...</div>
              ) : (
                  <>
                  {/* Patient Info */}
                  <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                    <strong>Paciente:</strong> {selectedOrder.paciente.nombre} | 
                    CI: {selectedOrder.paciente.cedula}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                      {/* Left Column: Results */}
                      <div>
                          <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Resultados</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {examParams.length === 0 ? (
                                <p className="text-muted text-center">No hay parametros configurados.</p>
                            ) : (
                                examParams.map((param, idx) => {
                                const value = resultValues[param.nombre] || '';
                                const outOfRange = value && isValueOutOfRange(value, param.min, param.max);
                                
                                return (
                                    <div 
                                    key={idx}
                                    style={{
                                        border: outOfRange ? '1px solid var(--danger)' : '1px solid var(--border)',
                                        padding: '0.5rem',
                                        borderRadius: 'var(--radius)',
                                        backgroundColor: outOfRange ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                                    }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{param.nombre}</span>
                                            <span className="text-xs text-muted">Ref: {param.min}-{param.max} {param.unidad}</span>
                                        </div>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={value}
                                            placeholder="Requerido"
                                            onChange={(e) => setResultValues({
                                                ...resultValues,
                                                [param.nombre]: e.target.value,
                                            })}
                                            step="any"
                                            style={{ width: '100%' }}
                                            required
                                        />
                                    </div>
                                );
                                })
                            )}
                          </div>
                      </div>

                      {/* Right Column: Inventory */}
                      <div style={{ paddingLeft: '2rem', borderLeft: '1px solid var(--border)' }}>
                          <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Material Utilizado</h4>
                          
                          {/* Product Search */}
                          <div style={{ position: 'relative', marginBottom: '1rem' }}>
                              <input 
                                  type="text" 
                                  className="form-input" 
                                  placeholder="Buscar material (ej. Tubo, Alcohol)..."
                                  value={productSearch}
                                  onChange={(e) => setProductSearch(e.target.value)}
                                  onFocus={() => setShowProductSearch(true)}
                              />
                              {showProductSearch && searchResults.length > 0 && (
                                  <div style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: 0,
                                      right: 0,
                                      backgroundColor: 'white',
                                      border: '1px solid var(--border)',
                                      borderRadius: 'var(--radius)',
                                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                      zIndex: 10,
                                      maxHeight: '200px',
                                      overflowY: 'auto'
                                  }}>
                                      {searchResults.map(p => (
                                          <div 
                                              key={p.id}
                                              style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                                              className="hover:bg-gray-100"
                                              onClick={() => handleAddConsumable(p)}
                                          >
                                              <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                                              <div className="text-xs text-muted">
                                                  Stock: {p.stock_total} {p.unidad_medida}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>

                          {/* Selected Consumables List */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {consumables.length === 0 && (
                                  <p className="text-xs text-muted">No se han agregado materiales.</p>
                              )}
                              {consumables.map(item => {
                                  const isStockError = item.cantidad > item.maxStock;
                                  return (
                                  <div key={item.productoId} style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'space-between',
                                      backgroundColor: isStockError ? 'rgba(239, 68, 68, 0.1)' : 'var(--muted)',
                                      padding: '0.5rem',
                                      borderRadius: 'var(--radius)',
                                      border: isStockError ? '1px solid var(--danger)' : '1px solid transparent'
                                  }}>
                                      <div>
                                          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.nombre}</div>
                                          <div className="text-xs text-muted">Max: {item.maxStock} {item.unit}</div>
                                          {isStockError && <div className="text-xs text-danger">Stock insuficiente</div>}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <input 
                                              type="number" 
                                              style={{ width: '60px', padding: '0.25rem' }}
                                              className="form-input"
                                              value={item.cantidad}
                                              min="1"
                                              max={item.maxStock}
                                              onChange={(e) => handleUpdateConsumableQty(item.productoId, e.target.value)}
                                          />
                                          <button 
                                              type="button"
                                              className="btn btn-sm btn-outline text-danger"
                                              onClick={() => handleRemoveConsumable(item.productoId)}
                                              style={{ padding: '0.25rem' }}
                                          >
                                              <XMarkIcon style={{ width: '14px', height: '14px' }} />
                                          </button>
                                      </div>
                                  </div>
                                  );
                              })}
                          </div>
                      </div>
                  </div>
                
                  {/* Digital Signature Notice */}
                  <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
                    Al guardar, los resultados quedaran registrados con su firma digital: <strong>{user?.nombre}</strong>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
              {hasConsumableErrors && (
                  <div className="text-sm text-danger" style={{ fontWeight: 500 }}>
                      ⚠ Stock insuficiente en materiales
                  </div>
              )}
              <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                Cancelar
              </button>
              <button 
                type="submit"
                className="btn btn-primary"
                disabled={loadingParams || examParams.length === 0 || hasConsumableErrors}
                style={{
                    backgroundColor: hasConsumableErrors ? '#94a3b8' : undefined,
                    borderColor: hasConsumableErrors ? '#94a3b8' : undefined,
                    cursor: hasConsumableErrors ? 'not-allowed' : undefined
                }}
              >
                <CheckIcon style={{ width: '18px', height: '18px' }} />
                Guardar y Validar
              </button>
            </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
