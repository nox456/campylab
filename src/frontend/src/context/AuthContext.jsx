'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Role permissions
const PERMISSIONS = {
  super_admin: {
    patients: ['create', 'read', 'update', 'delete'],
    orders: ['create', 'read', 'update', 'delete'],
    payments: ['create', 'read', 'update', 'delete'],
    results: ['create', 'read', 'update', 'delete'],
    inventory: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
  },
  bioanalista: {
    patients: ['read'],
    orders: ['read'],
    payments: [],
    results: ['create', 'read', 'update'],
    inventory: ['read'],
    users: [],
  },
  recepcionista: {
    patients: ['create', 'read', 'update'],
    orders: ['create', 'read'],
    payments: ['create', 'read'],
    results: [],
    inventory: [],
    users: [],
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('campylab_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (cedula, password) => {
    // Simulated login - in production, this would call the backend API
    // For demo purposes, we'll create mock users
    const mockUsers = [
      { cedula: 12345678, nombre: 'Admin Usuario', rol: 'super_admin', correo: 'admin@campylab.com' },
      { cedula: 23456789, nombre: 'Ana Bioanalista', rol: 'bioanalista', correo: 'ana@campylab.com' },
      { cedula: 34567890, nombre: 'Carlos Recepcionista', rol: 'recepcionista', correo: 'carlos@campylab.com' },
    ];

    const foundUser = mockUsers.find(u => u.cedula === parseInt(cedula));
    
    if (foundUser && password === '123456') { // Demo password
      const userData = { ...foundUser, permissions: PERMISSIONS[foundUser.rol] };
      setUser(userData);
      localStorage.setItem('campylab_user', JSON.stringify(userData));
      return { success: true };
    }
    
    return { success: false, error: 'Credenciales incorrectas' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('campylab_user');
  };

  const hasPermission = (module, action) => {
    if (!user || !user.permissions) return false;
    return user.permissions[module]?.includes(action) || false;
  };

  const canAccessModule = (module) => {
    if (!user || !user.permissions) return false;
    return user.permissions[module]?.length > 0 || false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, canAccessModule }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
