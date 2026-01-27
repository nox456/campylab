'use client';

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Link } from '../router/Router';
import {
  UsersIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';



export default function Dashboard() {
  const { user, canAccessModule, hasPermission } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    ordersToday: 0,
    pendingResults: 0,
    lowStockItems: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        console.log('Dashboard Data:', data);
        if (data) {
            setStats({
                totalPatients: Number(data.stats?.totalPatients) || 0,
                ordersToday: Number(data.stats?.ordersToday) || 0,
                pendingResults: Number(data.stats?.pendingResults) || 0,
                lowStockItems: Number(data.stats?.lowStockItems) || 0,
                totalRevenue: Number(data.stats?.totalRevenue) || 0,
            });
            setRecentOrders(data.recentOrders || []);
            setLowStockItems(data.lowStockItems || []);
        }
      })
      .catch(err => {
        console.error('Error loading dashboard:', err);
      });
  }, []);

  const getStatusBadge = (status) => {
    const badges = {
      creado: 'badge badge-info',
      resultados_cargados: 'badge badge-warning',
      pagado: 'badge badge-success',
      entregado: 'status-pill status-completed',
      cancelado: 'status-pill status-cancelled',
    };
    const labels = {
      creado: 'En espera de Resultados',
      resultados_cargados: 'En Espera de Pago',
      pagado: 'Pagado',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    };
    return { class: badges[status] || 'badge badge-neutral', label: labels[status] || status };
  };

  return (
    <Layout title="Dashboard">
      {/* Welcome message */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600 }}>
              Bienvenido, {user?.nombre}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.25rem' }}>
              Panel de control del sistema de laboratorio
            </p>
          </div>
          <ClockIcon style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.5)' }} />
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {canAccessModule('patients') && (
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p className="stat-card-value">{stats.totalPatients}</p>
                <p className="stat-card-label">Pacientes Registrados</p>
              </div>
              <div className="stat-card-icon" style={{ backgroundColor: 'rgba(8, 145, 178, 0.1)' }}>
                <UsersIcon style={{ width: '24px', height: '24px', color: 'var(--primary)' }} />
              </div>
            </div>
          </div>
        )}

        {canAccessModule('orders') && (
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p className="stat-card-value">{stats.ordersToday}</p>
                <p className="stat-card-label">Ordenes Hoy</p>
              </div>
              <div className="stat-card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                <ClipboardDocumentListIcon style={{ width: '24px', height: '24px', color: 'var(--info)' }} />
              </div>
            </div>
          </div>
        )}

        {canAccessModule('results') && (
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p className="stat-card-value">{stats.pendingResults}</p>
                <p className="stat-card-label">Resultados Pendientes</p>
              </div>
              <div className="stat-card-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                <BeakerIcon style={{ width: '24px', height: '24px', color: 'var(--warning)' }} />
              </div>
            </div>
          </div>
        )}

        {hasPermission('dashboard', 'view_income') && (
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p className="stat-card-value">${stats.totalRevenue.toFixed(2)}</p>
                <p className="stat-card-label">Ingresos Hoy</p>
              </div>
              <div className="stat-card-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <CurrencyDollarIcon style={{ width: '24px', height: '24px', color: 'var(--success)' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Recent Orders */}
        {canAccessModule('orders') && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Ordenes Recientes</h3>
              <Link to="/ordenes" className="btn btn-sm btn-outline">
                Ver todas
              </Link>
            </div>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Paciente</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => {
                    const statusBadge = getStatusBadge(order.status);
                    return (
                      <tr key={order.id}>
                        <td>#{order.id.toString().padStart(4, '0')}</td>
                        <td>{order.patient}</td>
                        <td>{order.date}</td>
                        <td>
                          <span className={statusBadge.class}>{statusBadge.label}</span>
                        </td>
                        <td>${Number(order.total).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Low Stock Alert */}
        {canAccessModule('inventory') && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ExclamationTriangleIcon style={{ width: '20px', height: '20px', color: 'var(--danger)' }} />
                Stock Bajo
              </h3>
              <Link to="/inventario" className="btn btn-sm btn-outline">
                Ver inventario
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {lowStockItems.map(item => (
                <div 
                  key={item.id} 
                  style={{ 
                    padding: '0.75rem', 
                    backgroundColor: 'var(--muted)', 
                    borderRadius: 'var(--radius)',
                    borderLeft: '3px solid var(--danger)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.name}</span>
                    <span className="badge badge-danger">
                      {item.current} / {item.minimum}
                    </span>
                  </div>
                  <div style={{ 
                    marginTop: '0.5rem', 
                    height: '4px', 
                    backgroundColor: 'var(--border)', 
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{ 
                      width: `${(item.current / item.minimum) * 100}%`, 
                      height: '100%', 
                      backgroundColor: 'var(--danger)',
                      borderRadius: '2px',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions for different roles */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>Acciones Rapidas</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {canAccessModule('patients') && (
            <Link to="/pacientes" className="btn btn-primary">
              <UsersIcon style={{ width: '18px', height: '18px' }} />
              Nuevo Paciente
            </Link>
          )}
          {canAccessModule('orders') && (
            <Link to="/ordenes" className="btn btn-primary">
              <ClipboardDocumentListIcon style={{ width: '18px', height: '18px' }} />
              Nueva Orden
            </Link>
          )}
          {canAccessModule('results') && (
            <Link to="/resultados" className="btn btn-primary">
              <BeakerIcon style={{ width: '18px', height: '18px' }} />
              Cargar Resultados
            </Link>
          )}
          {canAccessModule('inventory') && (
            <Link to="/inventario" className="btn btn-secondary">
              <ArrowTrendingUpIcon style={{ width: '18px', height: '18px' }} />
              Registrar Entrada
            </Link>
          )}
        </div>
      </div>
    </Layout>
  );
}
