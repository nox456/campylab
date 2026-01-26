'use client';

import { useState } from 'react';
import Layout from '../components/Layout';
import Users from './Users';
import RateConfig from '../components/RateConfig';
import { UserGroupIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function Configuration() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <Layout title="Configuracion del Sistema">
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--border)',
          gap: '2rem'
        }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 0',
              borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'users' ? 'var(--primary)' : 'var(--muted-foreground)',
              fontWeight: 500,
              background: 'none',
              border: 'none', // Reset defaults except bottom
              borderBottomWidth: '2px', // Ensure thickness
              cursor: 'pointer'
            }}
          >
            <UserGroupIcon style={{ width: '20px', height: '20px' }} />
            Gestion de Usuarios
          </button>

          <button
            onClick={() => setActiveTab('rate')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 0',
              borderBottom: activeTab === 'rate' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'rate' ? 'var(--primary)' : 'var(--muted-foreground)',
              fontWeight: 500,
              background: 'none',
              border: 'none',
              borderBottomWidth: '2px',
              cursor: 'pointer'
            }}
          >
            <CurrencyDollarIcon style={{ width: '20px', height: '20px' }} />
            Tasa de Cambio
          </button>
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'users' && <Users isEmbed={true} />}
        {activeTab === 'rate' && <RateConfig />}
      </div>
    </Layout>
  );
}
