'use client';

import { useState } from 'react';
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

// Mock order data
const mockOrderDetail = {
  id: 1,
  paciente: {
    cedula: 12345678,
    nombre: 'Maria Garcia',
    telefono: '0412-1234567',
    correo: 'maria@email.com',
    sexo: 'F',
    edad: 39,
  },
  fecha: '2025-01-18',
  estado: 'resultados_cargados',
  prioridad: 'urgente',
  total: 150.00,
  pagado: 50.00,
  observaciones: 'Paciente en ayunas',
  bioanalista: 'Ana Bioanalista',
  examenes: [
    {
      id: 1,
      nombre: 'Hematologia Completa',
      costo: 50.00,
      resultados: [
        { nombre: 'Hemoglobina', valor: 14.2, unidad: 'g/dL', min: 12.0, max: 16.0 },
        { nombre: 'Hematocrito', valor: 42, unidad: '%', min: 36, max: 48 },
        { nombre: 'Globulos Blancos', valor: 7500, unidad: '/mm3', min: 4500, max: 11000 },
        { nombre: 'Plaquetas', valor: 250000, unidad: '/mm3', min: 150000, max: 400000 },
      ],
    },
    {
      id: 2,
      nombre: 'Perfil Lipidico',
      costo: 80.00,
      resultados: [
        { nombre: 'Colesterol Total', valor: 195, unidad: 'mg/dL', min: 0, max: 200 },
        { nombre: 'Trigliceridos', valor: 145, unidad: 'mg/dL', min: 0, max: 150 },
        { nombre: 'HDL', valor: 55, unidad: 'mg/dL', min: 40, max: 60 },
        { nombre: 'LDL', valor: 111, unidad: 'mg/dL', min: 0, max: 100 },
      ],
    },
  ],
  consumibles: [
    { id: 1, nombre: 'Tubo EDTA', cantidad: 2, unidad: 'unid' },
    { id: 2, nombre: 'Reactivo Colesterol', cantidad: 1, unidad: 'mL' },
    { id: 3, nombre: 'Lancetas', cantidad: 1, unidad: 'unid' },
  ],
  pagos: [
    { id: 1, fecha: '2025-01-18 09:30', monto: 50.00, metodo: 'Efectivo', usuario: 'Carlos Recepcionista' },
  ],
};

const statusSteps = [
  { key: 'creado', label: 'Creado' },
  { key: 'resultados_cargados', label: 'Resultados' },
  { key: 'inventario_descontado', label: 'Inventario' },
  { key: 'pagado', label: 'Pagado' },
  { key: 'entregado', label: 'Entregado' },
];

export default function OrderDetail({ orderId }) {
  const { hasPermission, canAccessModule } = useAuth();
  const [order, setOrder] = useState(mockOrderDetail);
  const [activeTab, setActiveTab] = useState('resultados');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');

  const pendiente = order.total - order.pagado;
  const canLoadResults = hasPermission('results', 'create') || hasPermission('results', 'update');
  const canRegisterPayment = hasPermission('payments', 'create');
  const canManageInventory = hasPermission('inventory', 'update');

  const getStatusIndex = (status) => {
    const index = statusSteps.findIndex(s => s.key === status);
    return index >= 0 ? index : 0;
  };

  const currentStatusIndex = getStatusIndex(order.estado);

  const isValueOutOfRange = (valor, min, max) => {
    return valor < min || valor > max;
  };

  const handleRegisterPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0 || amount > pendiente) return;

    const newPayment = {
      id: order.pagos.length + 1,
      fecha: new Date().toLocaleString('es-VE'),
      monto: amount,
      metodo: paymentMethod === 'efectivo' ? 'Efectivo' : paymentMethod === 'transferencia' ? 'Transferencia' : 'Divisa',
      usuario: 'Usuario Actual',
    };

    const newPagado = order.pagado + amount;
    setOrder({
      ...order,
      pagos: [...order.pagos, newPayment],
      pagado: newPagado,
      estado: newPagado >= order.total ? 'pagado' : order.estado,
    });

    setShowPaymentModal(false);
    setPaymentAmount('');
  };

  const handleDeductInventory = () => {
    setOrder({ ...order, estado: 'inventario_descontado' });
  };

  const handleMarkDelivered = () => {
    setOrder({ ...order, estado: 'entregado' });
  };

  return (
    <Layout title={`Orden #${orderId?.toString().padStart(4, '0')}`}>
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
                <span className="badge badge-info">Fecha: {order.fecha}</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>
              ${order.total.toFixed(2)}
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
              {canLoadResults && order.estado === 'creado' && (
                <Link to="/resultados" className="btn btn-primary btn-sm">
                  Cargar Resultados
                </Link>
              )}
            </div>

            {order.examenes.map(examen => (
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
                  <h4 style={{ fontWeight: 600 }}>{examen.nombre}</h4>
                  <span className="badge badge-info">${examen.costo.toFixed(2)}</span>
                </div>
                <div className="table-container" style={{ backgroundColor: 'var(--card)' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Parametro</th>
                        <th>Resultado</th>
                        <th>Unidad</th>
                        <th>Rango Referencia</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examen.resultados.map((resultado, idx) => {
                        const outOfRange = isValueOutOfRange(resultado.valor, resultado.min, resultado.max);
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: 500 }}>{resultado.nombre}</td>
                            <td style={{ 
                              fontWeight: 600, 
                              color: outOfRange ? 'var(--danger)' : 'var(--foreground)' 
                            }}>
                              {resultado.valor}
                            </td>
                            <td>{resultado.unidad}</td>
                            <td>{resultado.min} - {resultado.max}</td>
                            <td>
                              <span className={`badge ${outOfRange ? 'badge-danger' : 'badge-success'}`}>
                                {outOfRange ? 'Fuera de rango' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {order.bioanalista && (
              <p className="text-sm text-muted" style={{ marginTop: '1rem' }}>
                Validado por: {order.bioanalista}
              </p>
            )}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventario' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 600 }}>Consumibles Utilizados</h3>
              {canManageInventory && order.estado === 'resultados_cargados' && (
                <button className="btn btn-primary btn-sm" onClick={handleDeductInventory}>
                  Registrar Gastos
                </button>
              )}
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Cantidad</th>
                    <th>Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {order.consumibles.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.nombre}</td>
                      <td>{item.cantidad}</td>
                      <td>{item.unidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>${order.total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Pagado</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>${order.pagado.toFixed(2)}</p>
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
                  {order.pagos.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                        <p className="text-muted">No hay pagos registrados</p>
                      </td>
                    </tr>
                  ) : (
                    order.pagos.map(pago => (
                      <tr key={pago.id}>
                        <td>{pago.fecha}</td>
                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>${pago.monto.toFixed(2)}</td>
                        <td>
                          <span className="badge badge-neutral">{pago.metodo}</span>
                        </td>
                        <td>{pago.usuario}</td>
                      </tr>
                    ))
                  )}
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
