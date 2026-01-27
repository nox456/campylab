'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

const PERMISSIONS = {
  admin: {
    patients: ['create', 'read', 'update', 'delete'],
    orders: ['create', 'read', 'update', 'delete'],
    payments: ['create', 'read', 'update', 'delete'],
    results: ['create', 'read', 'update', 'delete'],
    inventory: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    exams: ['create', 'read', 'update', 'delete'],
    dashboard: ['view_income'], // Can see income stats
  },
  bioanalista: {
    patients: ['create', 'read', 'update'],
    orders: ['create', 'read', 'update'],
    payments: [], // No access to payments
    results: ['create', 'read', 'update', 'delete'],
    inventory: ['create', 'read', 'update', 'delete'],
    users: [], // No access to users/config
    exams: ['read'],
    dashboard: ['view'], // Can see dashboard but not income
  },
  asistente: {
    patients: ['create', 'read', 'update'],
    orders: ['create', 'read', 'update'],
    payments: [], // No access to payments
    results: [], // No access to results
    inventory: ['create', 'read', 'update', 'delete'],
    users: [], // No access to users/config
    exams: [], // No access to exams
    dashboard: ['view'], // Can see dashboard but not income
  },
  user: {
    patients: ['read'],
    orders: ['read'],
    payments: ['read'],
    results: ['read'],
    inventory: ['read'],
    users: [],
    exams: ['read'],
    dashboard: ['view'],
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { user: userData } = await authApi.me();
      const role = userData.role || 'user';
      setUser({
        ...userData,
        permissions: PERMISSIONS[role] || PERMISSIONS.user,
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const { user: userData } = await authApi.login(username, password);
      const role = userData.role || 'user';
      setUser({
        ...userData,
        permissions: PERMISSIONS[role] || PERMISSIONS.user,
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Credenciales incorrectas' };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    }
    setUser(null);
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
