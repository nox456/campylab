'use client';

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ConfirmationModal from '../components/ConfirmationModal';
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
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../context/ToastContext';

const statusSteps = [
  { key: 'creado', label: 'Creado' },
  { key: 'resultados_cargados', label: 'Resultados' },
  { key: 'pagado', label: 'Pagado' },
  { key: 'entregado', label: 'Entregado' },
];

export default function OrderDetail({ orderId }) {
  const { hasPermission, canAccessModule } = useAuth();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('resultados');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [loading, setLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const fetchOrderData = () => {
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
  };

  const fetchPayments = () => {
      fetch(`/api/payments/order/${orderId}`)
          .then(res => res.json())
          .then(data => setPayments(data))
          .catch(console.error);
  };

  useEffect(() => {
      fetchOrderData();
      fetchExchangeRate();
  }, [orderId]);

  useEffect(() => {
      if (activeTab === 'pagos' && orderId) {
          fetchPayments();
      }
  }, [activeTab, orderId]);

  const fetchExchangeRate = async () => {
    try {
      const res = await fetch('/api/config/rate');
      if (res.ok) {
        const data = await res.json();
        setExchangeRate(parseFloat(data.tasa) || 0);
      }
    } catch (e) {
      console.error('Error fetching exchange rate:', e);
    }
  };

  if (loading || !order) {
      return (
        <Layout title="Cargando...">
            <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando orden...</div>
        </Layout>
      );
  }

  // Ensure numeric
  const total = Number(order.total) || 0;
  // Use local calculation for immediate feedback
  const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.monto), 0);
  
  // Status Logic
  const pagado = Number(order.pagado) || 0; 
  const pendiente = total - pagado;
  
  const canLoadResults = hasPermission('results', 'create') || hasPermission('results', 'update');
  const canRegisterPayment = hasPermission('payments', 'create');
  const canManageInventory = hasPermission('inventory', 'update');

  // Logic: Results loaded?
  const hasResults = order.exams && order.exams.some(e => e.resultados && e.resultados.length > 0);
  // Logic: Paid?
  const isPaid = pendiente <= 0.01;

  // Custom visual status index
  const getVisualStatusIndex = () => {
      if (order.estado === 'entregado') return 3;
      
      // If Results are NOT loaded, stay at step 0 (Creado), even if paid.
      // This enforces the workflow: Results -> Payment/Delivery.
      if (!hasResults) return 0;
      
      // If Results exist:
      if (isPaid) return 2; // Paid & Results -> Ready for delivery
      
      // If results exist but not paid
      return 1;
  };

  const currentStatusIndex = getVisualStatusIndex();


  const handleRegisterPayment = async () => {
    try {
        const isLocalCurrency = ['Efectivo', 'Transferencia', 'Pago Movil', 'BioPago'].includes(paymentMethod);
        const enteredAmount = parseFloat(paymentAmount) || 0;
        
        let amountInUSD = enteredAmount;
        
        if (isLocalCurrency && exchangeRate > 0) {
            amountInUSD = enteredAmount / exchangeRate;
        }
        
        const finalAmount = Math.min(amountInUSD, pendiente);
        
        const res = await fetch('/api/payments', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                ordenId: order.id,
                monto: finalAmount,
                metodo: paymentMethod,
                nota: 'Pago registrado desde detalle de orden'
            })
        });

        if (!res.ok) throw new Error('Error registrando pago');

        setShowPaymentModal(false);
        setPaymentAmount('');
        fetchPayments();
        fetchOrderData();
        showToast('Pago registrado con exito', 'success');
    } catch (e) {
        console.error(e);
        showToast('Error al registrar pago', 'error');
    }
  };

  const handleDeductInventory = () => {
     showToast("Funcionalidad de inventario backend pendiente de implementacion completa.", 'info');
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

  const handleSendEmailRequest = () => {
      setShowEmailModal(true);
  };

  const handleConfirmSendEmail = async () => {
    try {
        showToast('Enviando correo...', 'info');
        const res = await fetch(`/api/pdf/email/${orderId}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({})
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            showToast(data.error || 'Error enviando correo', 'error');
            return;
        }
        
        showToast('Correo enviado exitosamente', 'success');
    } catch(e) {
        // console.error(e); // Suppressed as requested
        showToast(e.message, 'error');
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
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                {/* Allow Delivery only if Paid AND Results exist */}
                {isPaid && hasResults && order.estado !== 'entregado' && (
                  <button className="btn btn-sm btn-success" onClick={handleMarkDelivered}>
                    <CheckIcon style={{ width: '16px', height: '16px' }} />
                    Marcar Entregado
                  </button>
                )}
                
                {/* Export/Email always available if results exist */}
                {hasResults && (
                  <>
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => window.open(`/api/pdf/result/${order.id}`, '_blank')}
                    >
                      <PrinterIcon style={{ width: '16px', height: '16px' }} />
                      Exportar PDF
                    </button>
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={handleSendEmailRequest}
                      title="Enviar resultados al correo del paciente"
                    >
                      <EnvelopeIcon style={{ width: '16px', height: '16px' }} />
                      Enviar Correo
                    </button>
                  </>
                )}
            </div>
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
                            return (
                            <tr key={idx}>
                                <td style={{ fontWeight: 500 }}>{resultado.nombre}</td>
                                <td style={{ fontWeight: 600 }}>{resultado.valor}</td>
                                <td>{resultado.unidad}</td>
                                <td>
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
                    {payments.length === 0 ? (
                        <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                                <p className="text-muted">No hay pagos registrados.</p>
                            </td>
                        </tr>
                    ) : (
                        payments.map(p => (
                            <tr key={p.id}>
                                <td>
                                    <div className="text-sm">
                                        {new Date(p.fecha).toLocaleDateString()}
                                        <span className="mx-1"> - </span>
                                        <span className="text-muted">{new Date(p.fecha).toLocaleTimeString()}</span>
                                    </div>
                                </td>
                                <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                                    ${parseFloat(p.monto).toFixed(2)}
                                </td>
                                <td>
                                    <span className="badge badge-neutral">{p.metodo}</span>
                                </td>
                                <td className="text-sm text-muted">{p.usuario || '-'}</td>
                            </tr>
                        ))
                    )}
                 </tbody>
               </table>
             </div>


          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (() => {
        const isLocalCurrency = ['Efectivo', 'Transferencia', 'Pago Movil', 'BioPago'].includes(paymentMethod);
        const expectedBsAmount = isLocalCurrency && exchangeRate > 0 ? (pendiente * exchangeRate) : null;
        const enteredAmount = parseFloat(paymentAmount) || 0;
        
        // Calculate USD equivalent
        const amountInUSD = isLocalCurrency && exchangeRate > 0 ? enteredAmount / exchangeRate : enteredAmount;
        
        // Calculate change if overpayment
        const hasChange = amountInUSD > pendiente;
        const changeInUSD = hasChange ? amountInUSD - pendiente : 0;
        const changeInBs = isLocalCurrency && exchangeRate > 0 ? changeInUSD * exchangeRate : 0;
        
        const isValidAmount = enteredAmount > 0;

        return (
          <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <h3 className="modal-title">Registrar Pago</h3>
                <button className="btn btn-sm btn-outline" onClick={() => setShowPaymentModal(false)}>
                  <XMarkIcon style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Monto pendiente:</span>
                    <strong>${pendiente.toFixed(2)}</strong>
                  </div>
                  {exchangeRate > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                      <span>Tasa BCV:</span>
                      <span>Bs. {exchangeRate.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Metodo de Pago</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      setPaymentAmount('');
                    }}
                  >
                    <option value="Efectivo">Efectivo (Bs)</option>
                    <option value="Transferencia">Transferencia (Bs)</option>
                    <option value="Pago Movil">Pago Movil (Bs)</option>
                    <option value="BioPago">BioPago (Bs)</option>
                    <option value="Divisa">Divisa (USD)</option>
                    <option value="Transferencia (USD)">Transferencia (USD)</option>
                  </select>
                </div>

                {isLocalCurrency && expectedBsAmount && (
                  <div className="alert alert-warning" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                    <strong>Monto a cobrar en Bs:</strong> Bs. {expectedBsAmount.toFixed(2)}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">
                    Monto Recibido {isLocalCurrency ? '(Bs)' : '(USD)'} *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: 'var(--muted-foreground)',
                      fontWeight: 500
                    }}>
                      {isLocalCurrency ? 'Bs.' : '$'}
                    </span>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      step="0.01"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                  {isLocalCurrency && enteredAmount > 0 && exchangeRate > 0 && (
                    <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>
                      Equivalente: ${amountInUSD.toFixed(2)} USD
                    </p>
                  )}
                </div>

                {hasChange && (
                  <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                    <strong>💵 Vuelto al cliente:</strong>
                    <div style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}>
                      {isLocalCurrency ? (
                        <>
                          <strong>Bs. {changeInBs.toFixed(2)}</strong>
                          <span style={{ fontSize: '0.875rem', marginLeft: '0.5rem', color: 'var(--muted-foreground)' }}>
                            (${changeInUSD.toFixed(2)})
                          </span>
                        </>
                      ) : (
                        <strong>${changeInUSD.toFixed(2)}</strong>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  Cancelar
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleRegisterPayment}
                  disabled={!isValidAmount}
                >
                  Registrar Pago
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Email Confirmation Modal */}
      {order && (
        <ConfirmationModal
            isOpen={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            onConfirm={handleConfirmSendEmail}
            title="Enviar Resultados por Correo"
            message={!order.paciente.email 
                ? "⚠️ El paciente no tiene correo registrado. ¿Desea intentar enviarlo de todas formas?" 
                : `¿Está seguro de enviar los resultados en PDF al correo del paciente (${order.paciente.email})?`
            }
            confirmText="Enviar Correo"
            confirmStyle={!order.paciente.email ? "danger" : "primary"}
        />
      )}
    </Layout>
  );
}
