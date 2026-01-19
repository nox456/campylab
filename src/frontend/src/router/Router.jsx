'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Patients from '../pages/Patients';
import PatientHistory from '../pages/PatientHistory';
import Orders from '../pages/Orders';
import OrderDetail from '../pages/OrderDetail';
import Payments from '../pages/Payments';
import Results from '../pages/Results';
import Inventory from '../pages/Inventory';

export default function Router() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');
  const [params, setParams] = useState({});

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/';
      const [path, queryString] = hash.split('?');
      setCurrentPath(path);
      
      // Parse query params
      if (queryString) {
        const searchParams = new URLSearchParams(queryString);
        const paramsObj = {};
        for (const [key, value] of searchParams) {
          paramsObj[key] = value;
        }
        setParams(paramsObj);
      } else {
        setParams({});
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial call
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-4 text-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Extract dynamic params from path
  const pathParts = currentPath.split('/');
  
  // Route matching
  if (currentPath === '/' || currentPath === '/dashboard') {
    return <Dashboard />;
  }
  
  if (currentPath === '/pacientes') {
    return <Patients />;
  }
  
  if (currentPath.startsWith('/pacientes/') && pathParts[2]) {
    return <PatientHistory patientId={pathParts[2]} />;
  }
  
  if (currentPath === '/ordenes') {
    return <Orders />;
  }
  
  if (currentPath.startsWith('/ordenes/') && pathParts[2]) {
    return <OrderDetail orderId={pathParts[2]} />;
  }
  
  if (currentPath === '/pagos') {
    return <Payments />;
  }
  
  if (currentPath === '/resultados') {
    return <Results />;
  }
  
  if (currentPath === '/inventario') {
    return <Inventory />;
  }

  // 404
  return (
    <Dashboard />
  );
}

export function navigate(path) {
  window.location.hash = path;
}

export function Link({ to, children, className, ...props }) {
  const handleClick = (e) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={`#${to}`} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}
