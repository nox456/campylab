'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

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
  user: {
    patients: ['read'],
    orders: ['read'],
    payments: ['read'],
    results: ['read'],
    inventory: ['read'],
    users: [],
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

  const login = async (email, password) => {
    try {
      const { user: userData } = await authApi.login(email, password);
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

  const register = async (email, password) => {
    try {
      const { user: userData } = await authApi.register(email, password);
      const role = userData.role || 'user';
      setUser({
        ...userData,
        permissions: PERMISSIONS[role] || PERMISSIONS.user,
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Error al registrar' };
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
    // Temporary override: Allow all actions for dev
    return true;
    
    // if (!user || !user.permissions) return false;
    // return user.permissions[module]?.includes(action) || false;
  };

  const canAccessModule = (module) => {
    if (!user || !user.permissions) return false;
    return user.permissions[module]?.length > 0 || false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, hasPermission, canAccessModule }}>
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
