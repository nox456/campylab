'use client';

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Link } from '../router/Router';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  CreditCardIcon,
  DocumentTextIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

// Mock payments data
export default function Payments() {
  const { hasPermission } = useAuth();
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      (p.paciente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.orden_id.toString().includes(searchTerm);
    // backend sends timestamp, frontend filter expects YYYY-MM-DD start
    const matchesDate = !dateFilter || p.fecha.startsWith(dateFilter);
    const matchesMethod = !methodFilter || p.metodo === methodFilter;
    return matchesSearch && matchesDate && matchesMethod;
  });

  // Calculate totals
  const totals = filteredPayments.reduce((acc, p) => {
      // p.monto comes as string from DB (decimal), parse it
    const amount = parseFloat(p.monto) || 0;
    acc.total += amount;
    if (p.metodo === 'Efectivo') acc.efectivo += amount;
    else if (p.metodo === 'Transferencia') acc.transferencia += amount;
    else if (p.metodo === 'Divisa') acc.divisa += amount;
    return acc;
  }, { total: 0, efectivo: 0, transferencia: 0, divisa: 0 });

  const getMethodIcon = (metodo) => {
    switch (metodo) {
      case 'Efectivo':
        return <BanknotesIcon style={{ width: '16px', height: '16px' }} />;
      case 'Transferencia':
        return <CreditCardIcon style={{ width: '16px', height: '16px' }} />;
      case 'Divisa':
        return <CurrencyDollarIcon style={{ width: '16px', height: '16px' }} />;
      default:
        return null;
    }
  };

  const getMethodBadgeClass = (metodo) => {
    switch (metodo) {
      case 'Efectivo':
        return 'badge-success';
      case 'Transferencia':
        return 'badge-info';
      case 'Divisa':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <Layout title="Pagos">
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
              <p className="stat-card-value">${totals.total.toFixed(2)}</p>
              <p className="stat-card-label">Total Recaudado</p>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(8, 145, 178, 0.1)' }}>
              <CurrencyDollarIcon style={{ width: '24px', height: '24px', color: 'var(--primary)' }} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-card-value">${totals.efectivo.toFixed(2)}</p>
              <p className="stat-card-label">Efectivo</p>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <BanknotesIcon style={{ width: '24px', height: '24px', color: 'var(--success)' }} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-card-value">${totals.transferencia.toFixed(2)}</p>
              <p className="stat-card-label">Transferencias</p>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <CreditCardIcon style={{ width: '24px', height: '24px', color: 'var(--info)' }} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-card-value">${totals.divisa.toFixed(2)}</p>
              <p className="stat-card-label">Divisas (USD)</p>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
              <CurrencyDollarIcon style={{ width: '24px', height: '24px', color: 'var(--warning)' }} />
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
              placeholder="Buscar por paciente u orden..."
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
        <button className="btn btn-outline">
          <DocumentTextIcon style={{ width: '18px', height: '18px' }} />
          Exportar Reporte
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ minWidth: '200px' }}>
              <label className="form-label">Fecha</label>
              <input
                type="date"
                className="form-input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ minWidth: '200px' }}>
              <label className="form-label">Metodo de Pago</label>
              <select
                className="form-select"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Divisa">Divisa (USD)</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setDateFilter('');
                  setMethodFilter('');
                }}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Historial de Pagos</h3>
          <span className="badge badge-neutral">{filteredPayments.length} registros</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Orden</th>
                <th>Paciente</th>
                <th>Fecha/Hora</th>
                <th>Metodo</th>
                <th>Monto</th>
                <th>Registrado por</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    <CurrencyDollarIcon style={{ width: '48px', height: '48px', color: 'var(--muted-foreground)', margin: '0 auto 0.5rem' }} />
                    <p className="text-muted">No se encontraron pagos</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map(payment => (
                  <tr key={payment.id}>
                    <td style={{ fontWeight: 500 }}>#{payment.id.toString().padStart(4, '0')}</td>
                    <td>
                      <Link to={`/ordenes/${payment.orden_id}`} style={{ fontWeight: 500 }}>
                        Orden #{payment.orden_id.toString().padStart(4, '0')}
                      </Link>
                    </td>
                    <td>{payment.paciente}</td>
                    <td>
                      <div>
                        <p className="text-sm">{new Date(payment.fecha).toLocaleDateString()}</p>
                        <p className="text-xs text-muted">{new Date(payment.fecha).toLocaleTimeString()}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getMethodBadgeClass(payment.metodo)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        {getMethodIcon(payment.metodo)}
                        {payment.metodo}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                      ${parseFloat(payment.monto).toFixed(2)}
                    </td>
                    <td className="text-sm text-muted">{payment.usuario || '-'}</td>
                    <td>
                      <Link to={`/ordenes/${payment.orden_id}`} className="btn btn-sm btn-outline">
                        <EyeIcon style={{ width: '16px', height: '16px' }} />
                        Ver Orden
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon style={{ width: '20px', height: '20px' }} />
            Resumen Diario
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {['today', 'week', 'month'].map(range => {
              const now = new Date();
              const todayStr = now.toISOString().split('T')[0];
              
              let paymentsInRange = [];
              let label = '';
              let dateInfo = '';

              if (range === 'today') {
                  label = 'Hoy';
                  dateInfo = now.toLocaleDateString();
                  paymentsInRange = payments.filter(p => {
                      return new Date(p.fecha).toLocaleDateString() === now.toLocaleDateString();
                  });
              } else if (range === 'week') {
                  label = 'Esta Semana';
                  // Calculate start of week (Monday) based on local time
                  const day = now.getDay(); // 0 (Sun) - 6 (Sat)
                  // If Sunday (0), we want previous Monday (-6 days). If Mon (1), 0 days ago.
                  // Monday is index 1. 
                  const diffToMonday = day === 0 ? 6 : day - 1; 
                  const monday = new Date(now);
                  monday.setDate(now.getDate() - diffToMonday);
                  monday.setHours(0,0,0,0);
                  
                  dateInfo = `Desde ${monday.toLocaleDateString()}`;
                  
                  paymentsInRange = payments.filter(p => {
                      const pDate = new Date(p.fecha);
                      return pDate >= monday;
                  });
              } else if (range === 'month') {
                  label = 'Este Mes';
                  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                  dateInfo = startOfMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                  paymentsInRange = payments.filter(p => {
                      const pDate = new Date(p.fecha);
                      // Check if same month and year
                      return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
                  });
              }

              const stats = paymentsInRange.reduce((acc, p) => {
                  const amount = parseFloat(p.monto) || 0;
                  acc.total += amount;
                  if (p.metodo === 'Efectivo') acc.efectivo += amount;
                  else if (p.metodo === 'Transferencia') acc.transferencia += amount;
                  else if (p.metodo === 'Divisa') acc.divisa += amount;
                  return acc;
              }, { total: 0, efectivo: 0, transferencia: 0, divisa: 0 });

              const borderColors = { today: 'var(--primary)', week: 'var(--info)', month: 'var(--success)' };

              return (
                  <div key={range} style={{ 
                    padding: '1rem', 
                    backgroundColor: 'var(--muted)', 
                    borderRadius: 'var(--radius)',
                    borderLeft: `3px solid ${borderColors[range]}`,
                  }}>
                    <p className="text-sm font-medium" style={{ marginBottom: '0.5rem' }}>{label} ({dateInfo})</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="text-sm text-muted">Efectivo:</span>
                      <span className="text-sm font-medium">${stats.efectivo.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="text-sm text-muted">Transferencia:</span>
                      <span className="text-sm font-medium">${stats.transferencia.toFixed(2)}</span>
                    </div>
                    {stats.divisa > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span className="text-sm text-muted">Divisa:</span>
                        <span className="text-sm font-medium">${stats.divisa.toFixed(2)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                      <span className="font-medium">Total:</span>
                      <span className="font-semibold" style={{ color: 'var(--foreground)' }}>${stats.total.toFixed(2)}</span>
                    </div>
                  </div>
              );
          })}
        </div>
      </div>
    </Layout>
  );
}
