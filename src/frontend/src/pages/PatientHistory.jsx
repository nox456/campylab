'use client';

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Link } from '../router/Router';
import {
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export default function PatientHistory({ patientId }) {
  const [patient, setPatient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     if (patientId) {
         setLoading(true);
         // 1. Fetch Patient Info (re-used from Patients API or fetched via Patient ID)
         // Actually better to have a single endpoint?
         // We can do parallel fetch
         Promise.all([
             fetch(`/api/patients/${patientId}`).then(res => res.json()),
             fetch(`/api/orders?patientId=${patientId}`).then(res => res.json())
         ])
         .then(([patientData, ordersData]) => {
             setPatient(patientData);
             setOrders(ordersData);
             setLoading(false);
         })
         .catch(err => {
             console.error(err);
             setLoading(false);
         });
     }
  }, [patientId]);

  if (loading || !patient) {
      return (
          <Layout title="Historial del Paciente">
              <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando historial...</div>
          </Layout>
      );
  }

  const getStatusBadge = (status) => {
    const badges = {
      creado: { class: 'badge badge-neutral', label: 'Creado' },
      pendiente: { class: 'status-pill status-pending', label: 'Pendiente' },
      procesando: { class: 'badge badge-info', label: 'Procesando' },
      resultados_cargados: { class: 'badge badge-warning', label: 'Resultados' },
      entregado: { class: 'status-pill status-completed', label: 'Entregado' },
      pagado: { class: 'badge badge-success', label: 'Pagado' },
      cancelado: { class: 'status-pill status-cancelled', label: 'Cancelado' },
    };
    return badges[status] || { class: 'badge badge-neutral', label: status };
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Handle YYYY-MM-DD or ISO
    const date = new Date(dateString);
    // Adjust for timezone offset if it's strictly YYYY-MM-DD coming from DB without time
    // For simplicity using locale date, but ideally handle timezone correctly if needed.
    // If backend returns '2025-01-20', simple parsing works fine in most browsers or use UTC split.
    return date.toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout title="Historial del Paciente">
      {/* Back button */}
      <Link to="/pacientes" className="btn btn-outline" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeftIcon style={{ width: '18px', height: '18px' }} />
        Volver a Pacientes
      </Link>

      {/* Patient Info Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Avatar and basic info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: 'var(--primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <UserIcon style={{ width: '40px', height: '40px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{patient.nombre}</h2>
              <p className="text-muted">CI: {patient.cedula}</p>
              <span className={`badge ${patient.sexo === 'M' ? 'badge-info' : 'badge-warning'}`}>
                {patient.sexo === 'M' ? 'Masculino' : 'Femenino'} - {calculateAge(patient.fecha_nacimiento)} anos
              </span>
            </div>
          </div>

          {/* Contact info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon style={{ width: '20px', height: '20px', color: 'var(--muted-foreground)' }} />
              <div>
                <p className="text-xs text-muted">Fecha de Nacimiento</p>
                <p className="text-sm font-medium">{formatDate(patient.fecha_nacimiento)}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PhoneIcon style={{ width: '20px', height: '20px', color: 'var(--muted-foreground)' }} />
              <div>
                <p className="text-xs text-muted">Telefono</p>
                <p className="text-sm font-medium">{patient.telefono || 'No registrado'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <EnvelopeIcon style={{ width: '20px', height: '20px', color: 'var(--muted-foreground)' }} />
              <div>
                <p className="text-xs text-muted">Correo</p>
                <p className="text-sm font-medium">{patient.email || 'No registrado'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPinIcon style={{ width: '20px', height: '20px', color: 'var(--muted-foreground)' }} />
              <div>
                <p className="text-xs text-muted">Direccion</p>
                <p className="text-sm font-medium">{patient.direccion}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Timeline */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardDocumentListIcon style={{ width: '20px', height: '20px' }} />
            Historial de Ordenes ({orders.length})
          </h3>
          <Link to="/ordenes" className="btn btn-primary btn-sm">
            Nueva Orden
          </Link>
        </div>

        {/* Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order, index) => {
            const statusBadge = getStatusBadge(order.estado);
            return (
              <div 
                key={order.id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius)',
                  borderLeft: `3px solid ${order.estado === 'entregado' ? 'var(--success)' : 'var(--warning)'}`,
                }}
              >
                {/* Timeline dot */}
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: order.estado === 'entregado' || order.estado === 'pagado' ? 'var(--success)' : 'var(--warning)',
                  borderRadius: '50%',
                  marginTop: '0.25rem',
                  flexShrink: 0,
                }} />

                {/* Order info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                        Orden #{order.id.toString().padStart(4, '0')}
                      </p>
                      <p className="text-sm text-muted">{formatDate(order.fecha)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={statusBadge.class}>{statusBadge.label}</span>
                      <span className={`badge ${order.pagado > 0 && order.pagado >= order.total ? 'badge-success' : 'badge-danger'}`}>
                        {order.pagado > 0 && order.pagado >= order.total ? 'Pagado' : 'Pendiente pago'}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div style={{ marginTop: '0.75rem' }}>
                      <span className="text-sm text-muted">Prioridad: </span>
                      <strong className="text-sm capitalize">{order.prioridad}</strong>
                  </div>

                  {/* Footer */}
                  <div style={{ 
                    marginTop: '0.75rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border)',
                  }}>
                    <p style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                      Total: ${Number(order.total).toFixed(2)}
                    </p>
                    <Link to={`/ordenes/${order.id}`} className="btn btn-sm btn-outline">
                      <EyeIcon style={{ width: '16px', height: '16px' }} />
                      Ver Orden
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <ClipboardDocumentListIcon style={{ width: '48px', height: '48px', color: 'var(--muted-foreground)', margin: '0 auto 0.5rem' }} />
            <p className="text-muted">Este paciente no tiene ordenes registradas</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
