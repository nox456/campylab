'use client';

import { useState } from 'react';
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

// Mock patient data
const mockPatient = {
  cedula: 12345678,
  nombre: 'Maria Garcia',
  fecha_nacimiento: '1985-03-15',
  telefono: '0412-1234567',
  direccion: 'Calle Principal 123, Caracas',
  correo: 'maria@email.com',
  sexo: 'F',
  activo: true,
};

// Mock orders history
const mockOrders = [
  {
    id: 1,
    fecha: '2025-01-18',
    examenes: ['Hematologia Completa', 'Perfil Lipidico'],
    estado: 'pendiente',
    total: 150.00,
    pagado: false,
  },
  {
    id: 2,
    fecha: '2025-01-10',
    examenes: ['Glicemia', 'Urea', 'Creatinina'],
    estado: 'completado',
    total: 95.00,
    pagado: true,
  },
  {
    id: 3,
    fecha: '2024-12-15',
    examenes: ['Perfil Tiroideo'],
    estado: 'completado',
    total: 180.00,
    pagado: true,
  },
  {
    id: 4,
    fecha: '2024-11-20',
    examenes: ['Hematologia Completa', 'Orina'],
    estado: 'completado',
    total: 120.00,
    pagado: true,
  },
  {
    id: 5,
    fecha: '2024-10-05',
    examenes: ['Perfil Hepatico'],
    estado: 'completado',
    total: 200.00,
    pagado: true,
  },
];

export default function PatientHistory({ patientId }) {
  const [patient] = useState(mockPatient);
  const [orders] = useState(mockOrders);

  const getStatusBadge = (status) => {
    const badges = {
      pendiente: { class: 'status-pill status-pending', label: 'Pendiente' },
      procesando: { class: 'badge badge-info', label: 'Procesando' },
      completado: { class: 'status-pill status-completed', label: 'Completado' },
      cancelado: { class: 'status-pill status-cancelled', label: 'Cancelado' },
    };
    return badges[status] || { class: 'badge badge-neutral', label: status };
  };

  const calculateAge = (birthDate) => {
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
    const date = new Date(dateString);
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
                <p className="text-sm font-medium">{patient.telefono}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <EnvelopeIcon style={{ width: '20px', height: '20px', color: 'var(--muted-foreground)' }} />
              <div>
                <p className="text-xs text-muted">Correo</p>
                <p className="text-sm font-medium">{patient.correo}</p>
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
                  borderLeft: `3px solid ${order.estado === 'completado' ? 'var(--success)' : 'var(--warning)'}`,
                }}
              >
                {/* Timeline dot */}
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: order.estado === 'completado' ? 'var(--success)' : 'var(--warning)',
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
                      <span className={`badge ${order.pagado ? 'badge-success' : 'badge-danger'}`}>
                        {order.pagado ? 'Pagado' : 'Pendiente pago'}
                      </span>
                    </div>
                  </div>

                  {/* Exams list */}
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {order.examenes.map((examen, i) => (
                      <span 
                        key={i}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: 'var(--card)',
                          borderRadius: 'var(--radius)',
                          fontSize: '0.8125rem',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {examen}
                      </span>
                    ))}
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
                      Total: ${order.total.toFixed(2)}
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
