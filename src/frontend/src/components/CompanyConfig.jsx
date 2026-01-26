'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default function CompanyConfig() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    rif: '',
    codigo: '',
    logoUrl: '',
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_pass: '',
  });

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/config/company');
      if (res.ok) {
        const data = await res.json();
        setFormData(data);
      }
    } catch (e) {
      console.error(e);
      showToast('Error cargando información de la empresa', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/config/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Error guardando información');

      showToast('Información actualizada correctamente', 'success');
    } catch (e) {
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="card" style={{ maxWidth: '700px' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <BuildingOfficeIcon style={{ width: '24px', height: '24px' }} />
        Información de la Empresa
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Nombre del Laboratorio *</label>
            <input
              type="text"
              className="form-input"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              placeholder="Laboratorio Clínico"
              required
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Dirección</label>
            <textarea
              className="form-input"
              value={formData.direccion}
              onChange={e => setFormData({...formData, direccion: e.target.value})}
              placeholder="Calle, ciudad, estado"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input
              type="text"
              className="form-input"
              value={formData.telefono}
              onChange={e => setFormData({...formData, telefono: e.target.value})}
              placeholder="+58 424-1234567"
            />
          </div>

          <div className="form-group">
            <label className="form-label">RIF</label>
            <input
              type="text"
              className="form-input"
              value={formData.rif}
              onChange={e => setFormData({...formData, rif: e.target.value})}
              placeholder="J-12345678-9"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Código</label>
            <input
              type="text"
              className="form-input"
              value={formData.codigo}
              onChange={e => setFormData({...formData, codigo: e.target.value})}
              placeholder="Código del laboratorio"
            />
          </div>

          <div className="form-group">
            <label className="form-label">URL del Logo (opcional)</label>
            <input
              type="text"
              className="form-input"
              value={formData.logoUrl}
              onChange={e => setFormData({...formData, logoUrl: e.target.value})}
              placeholder="https://ejemplo.com/logo.png"
            />
          </div>

          {/* SMTP Config Section */}
          <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Configuración de Correo (SMTP)</h4>
              <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
                  Necesario para enviar resultados por correo.
              </p>
          </div>

          <div className="form-group">
              <label className="form-label">Host SMTP</label>
              <input
                  type="text"
                  className="form-input"
                  value={formData.smtp_host}
                  onChange={e => setFormData({...formData, smtp_host: e.target.value})}
                  placeholder="smtp.gmail.com"
              />
          </div>
          <div className="form-group">
              <label className="form-label">Puerto SMTP</label>
              <input
                  type="text"
                  className="form-input"
                  value={formData.smtp_port}
                  onChange={e => setFormData({...formData, smtp_port: e.target.value})}
                  placeholder="587"
              />
          </div>
          <div className="form-group">
              <label className="form-label">Usuario SMTP (Email)</label>
              <input
                  type="text"
                  className="form-input"
                  value={formData.smtp_user}
                  onChange={e => setFormData({...formData, smtp_user: e.target.value})}
                  placeholder="tu_email@gmail.com"
              />
          </div>
          <div className="form-group">
              <label className="form-label">Contraseña SMTP</label>
              <input
                  type="password"
                  className="form-input"
                  value={formData.smtp_pass}
                  onChange={e => setFormData({...formData, smtp_pass: e.target.value})}
                  placeholder="••••••••"
              />
          </div>
        </div>

        <p className="text-sm text-muted" style={{ marginTop: '1rem' }}>
          Esta información se utilizará en los reportes PDF de resultados.
        </p>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
