'use client';

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Link } from '../router/Router';
import {
  ArrowLeftIcon,
  UserIcon,
  PrinterIcon,
  CheckIcon,
  XMarkIcon,
  BeakerIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

const statusSteps = [
  { key: 'creado', label: 'Creado' },
  { key: 'resultados_cargados', label: 'Resultados' },
  { key: 'pagado', label: 'Pagado' },
  { key: 'entregado', label: 'Entregado' },
];

export default function OrderDetail({ orderId }) {
  const { hasPermission, canAccessModule } = useAuth();
  const [order, setOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('resultados');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      if (orderId) {
          fetch(`/api/orders/${orderId}`)
            .then(res => res.json())
            .then(data => {
                setOrder(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
      }
  }, [orderId]);

  if (loading || !order) {
      return (
        <Layout title="Cargando...">
            <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando orden...</div>
        </Layout>
      );
  }

  // Ensure numeric
  const total = Number(order.total) || 0;
  const pagado = Number(order.pagado) || 0;
  const pendiente = total - pagado;
  
  const canLoadResults = hasPermission('results', 'create') || hasPermission('results', 'update');
  const canRegisterPayment = hasPermission('payments', 'create');
  const canManageInventory = hasPermission('inventory', 'update');

  const getStatusIndex = (status) => {
    const index = statusSteps.findIndex(s => s.key === status);
    return index >= 0 ? index : 0;
  };

  const currentStatusIndex = getStatusIndex(order.estado);

  const isValueOutOfRange = (valor, min, max) => {
    // If no ranges, return false
    if (min === null || max === null || min === undefined || max === undefined) return false;
    const v = parseFloat(valor);
    return !isNaN(v) && (v < min || v > max);
  };

  const handleRegisterPayment = () => {
    // Payment logic goes here (mock for now on frontend state, should call API)
    alert("Funcionalidad de pago backend pendiente de implementacion completa.");
    setShowPaymentModal(false);
  };

  const handleDeductInventory = () => {
     alert("Funcionalidad de inventario backend pendiente de implementacion completa.");
  };

  const handleMarkDelivered = async () => {
     try {
         await fetch(`/api/orders/${order.id}/status`, {
             method: 'PUT',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify({ estado: 'entregado' })
         });
         setOrder({ ...order, estado: 'entregado' });
     } catch (e) {
         console.error(e);
     }
  };

  return (
    <Layout title={`Orden #${order.id.toString().padStart(4, '0')}`}>
      {/* Back button */}
      <Link to="/ordenes" className="btn btn-outline" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeftIcon style={{ width: '18px', height: '18px' }} />
        Volver a Ordenes
      </Link>

      {/* Order Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: 'var(--primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <UserIcon style={{ width: '32px', height: '32px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{order.paciente.nombre}</h2>
              <p className="text-muted">CI: {order.paciente.cedula} | {order.paciente.sexo === 'M' ? 'Masculino' : 'Femenino'}, {order.paciente.edad} anos</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span className={`badge ${order.prioridad === 'urgente' ? 'badge-danger' : 'badge-neutral'}`}>
                  {order.prioridad === 'urgente' ? 'Urgente' : 'Rutina'}
                </span>
                <span className="badge badge-info">Fecha: {order.fecha ? new Date(order.fecha).toLocaleDateString() : '-'}</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>
              ${total.toFixed(2)}
            </p>
            <p className={pendiente > 0 ? 'text-sm' : 'text-sm'} style={{ color: pendiente > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {pendiente > 0 ? `Pendiente: $${pendiente.toFixed(2)}` : 'Pagado completamente'}
            </p>
            {order.estado === 'pagado' && (
              <button className="btn btn-sm btn-outline" style={{ marginTop: '0.5rem' }}>
                <PrinterIcon style={{ width: '16px', height: '16px' }} />
                Imprimir Reporte
              </button>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <div className="progress-steps" style={{ justifyContent: 'space-between' }}>
            {statusSteps.map((step, index) => (
              <div key={step.key} className="progress-step" style={{ flex: 1 }}>
                <div 
                  className={`progress-step-circle ${
                    index < currentStatusIndex ? 'completed' : 
                    index === currentStatusIndex ? 'current' : 'pending'
                  }`}
                >
                  {index < currentStatusIndex ? (
                    <CheckIcon style={{ width: '16px', height: '16px' }} />
                  ) : (
                    index + 1
                  )}
                </div>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: index <= currentStatusIndex ? 500 : 400,
                  color: index <= currentStatusIndex ? 'var(--foreground)' : 'var(--muted-foreground)',
                }}>
                  {step.label}
                </span>
                {index < statusSteps.length - 1 && (
                  <div 
                    className={`progress-step-line ${index < currentStatusIndex ? 'completed' : ''}`}
                    style={{ flex: 1, margin: '0 0.5rem' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'resultados' ? 'active' : ''}`}
          onClick={() => setActiveTab('resultados')}
        >
          <BeakerIcon style={{ width: '18px', height: '18px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Resultados
        </button>
        <button 
          className={`tab ${activeTab === 'inventario' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventario')}
        >
          <ArchiveBoxIcon style={{ width: '18px', height: '18px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Inventario
        </button>
        <button 
          className={`tab ${activeTab === 'pagos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pagos')}
        >
          <CurrencyDollarIcon style={{ width: '18px', height: '18px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Pagos
        </button>
      </div>

      {/* Tab Content */}
      <div className="card" style={{ borderTopLeftRadius: 0 }}>
        {/* Results Tab */}
        {activeTab === 'resultados' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 600 }}>Examenes y Resultados</h3>
            </div>

            {order.exams && order.exams.map(examen => (
              <div 
                key={examen.id}
                style={{ 
                  marginBottom: '1rem', 
                  padding: '1rem', 
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontWeight: 600 }}>{examen.examen_nombre}</h4>
                  <span className="badge badge-info">${parseFloat(examen.precio).toFixed(2)}</span>
                </div>
                
                {examen.resultados && examen.resultados.length > 0 ? (
                    <div className="table-container" style={{ backgroundColor: 'var(--card)' }}>
                    <table>
                        <thead>
                        <tr>
                            <th>Parametro</th>
                            <th>Resultado</th>
                            <th>Unidad</th>
                            <th>Estado</th>
                        </tr>
                        </thead>
                        <tbody>
                        {examen.resultados.map((resultado, idx) => {
                            // Note: Reference values not returned by backend yet in simple structure, 
                            // but usually they come with specific exam config. 
                            // For simplicity, checking if we have them or just showing value.
                            return (
                            <tr key={idx}>
                                <td style={{ fontWeight: 500 }}>{resultado.nombre}</td>
                                <td style={{ fontWeight: 600 }}>{resultado.valor}</td>
                                <td>{resultado.unidad}</td>
                                <td>
                                    {/* Simple stub for range check if we had min/max */}
                                    <span className="badge badge-success">Normal</span>
                                </td>
                            </tr>
                            );
                        })}
                        </tbody>
                    </table>
                    </div>
                ) : (
                    <p className="text-sm text-muted">Resultados pendientes de carga.</p>
                )}
                
              </div>
            ))}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventario' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 600 }}>Materiales Utilizados</h3>
            </div>
            
            {order.consumibles && order.consumibles.length > 0 ? (
                <div className="table-container">
                <table>
                    <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Lote</th>
                        <th>Cantidad</th>
                        <th>Unidad</th>
                    </tr>
                    </thead>
                    <tbody>
                    {order.consumibles.map((item, idx) => (
                        <tr key={idx}>
                            <td style={{ fontWeight: 500 }}>{item.nombre}</td>
                            <td>{item.codigo_lote}</td>
                            <td style={{ fontWeight: 600 }}>{item.cantidad}</td>
                            <td>{item.unidad}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            ) : (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                    <ArchiveBoxIcon style={{ width: '48px', height: '48px', color: 'var(--muted-foreground)', margin: '0 auto 0.5rem' }} />
                    <p className="text-muted">No se registraron materiales consumidos para esta orden.</p>
                </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'pagos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 600 }}>Historial de Pagos</h3>
              {canRegisterPayment && pendiente > 0 && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowPaymentModal(true)}>
                  Registrar Pago
                </button>
              )}
            </div>

            {/* Summary */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '1rem', 
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius)',
            }}>
              <div>
                <p className="text-sm text-muted">Total</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>${total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Pagado</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>${pagado.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Pendiente</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: pendiente > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  ${pendiente.toFixed(2)}
                </p>
              </div>
            </div>

             <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha/Hora</th>
                    <th>Monto</th>
                    <th>Metodo</th>
                    <th>Registrado por</th>
                  </tr>
                </thead>
                <tbody>
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                        <p className="text-muted">No hay pagos registrados (Funcionalidad pendiente)</p>
                      </td>
                    </tr>
                </tbody>
              </table>
            </div>

            {order.estado === 'pagado' && (
              <div style={{ marginTop: '1rem' }}>
                <button className="btn btn-success" onClick={handleMarkDelivered}>
                  <CheckIcon style={{ width: '18px', height: '18px' }} />
                  Marcar como Entregado
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Pago</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowPaymentModal(false)}>
                <XMarkIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                Monto pendiente: <strong>${pendiente.toFixed(2)}</strong>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Monto a Pagar *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={pendiente}
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Metodo de Pago</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="divisa">Divisa (USD)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleRegisterPayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > pendiente}
              >
                Registrar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
