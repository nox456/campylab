'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, navigate } from '../router/Router';
import { 
  HomeIcon, 
  UsersIcon, 
  ClipboardIcon, 
  CreditCardIcon, 
  BeakerIcon, 
  ArchiveBoxIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HomeIcon, module: 'dashboard' },
  { path: '/pacientes', label: 'Pacientes', icon: UsersIcon, module: 'patients' },
  { path: '/ordenes', label: 'Ordenes', icon: ClipboardIcon, module: 'orders' },
  { path: '/pagos', label: 'Pagos', icon: CreditCardIcon, module: 'payments' },
  { path: '/resultados', label: 'Resultados', icon: BeakerIcon, module: 'results' },
  { path: '/inventario', label: 'Inventario', icon: ArchiveBoxIcon, module: 'inventory' },
  { path: '/examenes', label: 'Examenes', icon: DocumentTextIcon, module: 'exams' },
  { path: '/configuracion', label: 'Configuración', icon: Cog6ToothIcon, module: 'users' },
];

export default function Layout({ children, title }) {
  const { user, logout, canAccessModule } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentPath = window.location.hash.slice(1) || '/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredMenu = menuItems.filter(item => 
    item.module === null || canAccessModule(item.module)
  );

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: { label: 'Super Admin', class: 'badge-info' },
      bioanalista: { label: 'Bioanalista', class: 'badge-success' },
      recepcionista: { label: 'Recepcionista', class: 'badge-warning' },
      user: { label: 'Usuario', class: 'badge-neutral' },
    };
    return badges[role] || { label: role, class: 'badge-neutral' };
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            display: 'none',
          }}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: '260px',
          backgroundColor: 'var(--card)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : undefined,
        }}
      >
        {/* Logo */}
        <div style={{ 
          padding: '1.5rem', 
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <img 
            src="/icon.png" 
            alt="Logo" 
            style={{ 
              width: '32px', 
              height: '32px', 
              objectFit: 'contain' 
            }} 
          />
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>
              CampyLab
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              Sistema de Laboratorio
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {filteredMenu.map(item => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || 
                (item.path !== '/dashboard' && currentPath.startsWith(item.path));
              
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius)',
                      color: isActive ? 'var(--primary)' : 'var(--card-foreground)',
                      backgroundColor: isActive ? 'rgba(8, 145, 178, 0.1)' : 'transparent',
                      fontWeight: isActive ? 500 : 400,
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon style={{ width: '20px', height: '20px' }} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--muted)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <UserCircleIcon style={{ width: '40px', height: '40px', color: 'var(--muted-foreground)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--foreground)' }} className="truncate">
                {user?.nombre || user?.email}
              </p>
              <span className={`badge ${roleBadge.class}`} style={{ fontSize: '0.625rem' }}>
                {roleBadge.label}
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="btn btn-outline w-full"
            style={{ justifyContent: 'center' }}
          >
            <ArrowRightOnRectangleIcon style={{ width: '18px', height: '18px' }} />
            Cerrar Sesion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{
          height: '64px',
          backgroundColor: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }}
            >
              {sidebarOpen ? (
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              ) : (
                <Bars3Icon style={{ width: '20px', height: '20px' }} />
              )}
            </button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h2>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '1.5rem', backgroundColor: 'var(--background)' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .sidebar.open {
            transform: translateX(0) !important;
          }
          .sidebar-overlay {
            display: block !important;
          }
          main {
            margin-left: 0 !important;
          }
          header button {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
