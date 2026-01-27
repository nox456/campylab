'use client';

import Pagination from '../components/Pagination';
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
  /* const [showFilters, setShowFilters] = useState(false); */
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchPayments();
    fetchExchangeRate();
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, methodFilter]);

  const fetchExchangeRate = async () => {
    try {
      const res = await fetch('/api/config/rate');
      if (res.ok) {
        const data = await res.json();
        setExchangeRate(parseFloat(data.tasa) || 0);
      }
    } catch (e) {
      console.error('Error fetching rate:', e);
    }
  };

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

  // Pagination Logic
  const totalItems = filteredPayments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  // Calculate totals
  // Calculate totals (Global, ignoring filters)
  const totals = payments.reduce((acc, p) => {
    const amount = parseFloat(p.monto) || 0;
    
    // Total Global Amount
    acc.total += amount;

    // Categorize by Currency
    // Bs: Efectivo, Transferencia, Pago Movil, BioPago
    // USD: Divisa, Transferencia (USD)
    
    const isUSD = p.metodo === 'Divisa' || p.metodo === 'Transferencia (USD)';
    const isBs = ['Efectivo', 'Transferencia', 'Pago Movil', 'BioPago'].includes(p.metodo);

    if (isUSD) {
        acc.usd += amount;
    } else if (isBs) {
        acc.bs += amount;
    } else {
        // Fallback for unknown methods, treat as Bs or keep separate? 
        // Assuming default is Bs if not specified as USD
        acc.bs += amount;
    }

    return acc;
  }, { total: 0, bs: 0, usd: 0 });

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
      {/* ... Summary Cards Code ... */}
      {/* (Skipping Summary Cards re-write to save tokens, assuming they are unchanged until Header Actions) */}
      {/* Wait, I can't skip nicely with replace_file_content if I want to wrap everything. 
          Actually, I targeted EndLine 268 which is the end of the Table Div.
          I replaced everything from StartLine 3 which is imports. 
          So I need to include EVERYTHING in between.
      */}
      
      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {/* Total Recaudado (Mixed Check) */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-card-value">${totals.total.toFixed(2)}</p>
              <p className="stat-card-label">Total Recaudado (Global)</p>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(75, 85, 99, 0.1)' }}>
              <BanknotesIcon style={{ width: '24px', height: '24px', color: 'var(--foreground)' }} />
            </div>
          </div>
        </div>

        {/* Total Bs */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-card-value">Bs. {(totals.bs * exchangeRate).toFixed(2)}</p>
              <p className="stat-card-label">Total Bolívares</p>
               <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>
                  Equivalente: ${totals.bs.toFixed(2)}
               </p>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(8, 145, 178, 0.1)' }}>
              <CreditCardIcon style={{ width: '24px', height: '24px', color: 'var(--primary)' }} />
            </div>
          </div>
        </div>

        {/* Total USD */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p className="stat-card-value">${totals.usd.toFixed(2)}</p>
              <p className="stat-card-label">Total Divisas (USD)</p>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <CurrencyDollarIcon style={{ width: '24px', height: '24px', color: 'var(--success)' }} />
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
            <input
              type="date"
              className="form-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ width: '160px' }}
            />
            <select
              className="form-select"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              style={{ width: '150px' }}
            >
              <option value="">Metodo: Todos</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Divisa">Divisa (USD)</option>
              <option value="Pago Movil">Pago Movil</option>
              <option value="BioPago">BioPago</option>
            </select>
        </div>
          <button className="btn btn-outline">
            <DocumentTextIcon style={{ width: '18px', height: '18px' }} />
            Exportar Reporte
          </button>
        </div>



      {/* Payments Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Historial de Pagos</h3>
          <span className="badge badge-neutral">{filteredPayments.length} registros</span>
        </div>
        <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
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
              {currentPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    <CurrencyDollarIcon style={{ width: '48px', height: '48px', color: 'var(--muted-foreground)', margin: '0 auto 0.5rem' }} />
                    <p className="text-muted">No se encontraron pagos</p>
                  </td>
                </tr>
              ) : (
                currentPayments.map(payment => (
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
