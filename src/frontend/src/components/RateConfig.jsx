'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function RateConfig() {
  const { showToast } = useToast();
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRate();
  }, []);

  const fetchRate = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/config/rate');
      if (res.ok) {
        const data = await res.json();
        setRate(data.tasa);
      }
    } catch (e) {
      console.error(e);
      showToast('Error cargando tasa', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/config/rate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasa: rate }),
      });

      if (!res.ok) throw new Error('Error guardando tasa');

      showToast('Tasa actualizada correctamente', 'success');
    } catch (e) {
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="card" style={{ maxWidth: '500px' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <CurrencyDollarIcon style={{ width: '24px', height: '24px' }} />
        Tasa de Cambio (BCV)
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Tasa Actual (Bs/USD)</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)' }}>Bs.</span>
            <input
              type="number"
              step="0.01"
              className="form-input"
              value={rate}
              onChange={e => setRate(e.target.value)}
              placeholder="0.00"
              style={{ fontSize: '1.5rem', fontWeight: 600 }}
              required
            />
          </div>
          <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>
             Esta tasa se utilizara para calcular los montos en Bolivares en el sistema.
          </p>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Configuracion'}
          </button>
        </div>
      </form>
    </div>
  );
}
