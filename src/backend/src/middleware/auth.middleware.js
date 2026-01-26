import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.config.js';

export function requireAuth(req, res, next) {
  const token = req.cookies[authConfig.cookieName];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie(authConfig.cookieName);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  const token = req.cookies[authConfig.cookieName];

  if (token) {
    try {
      const decoded = jwt.verify(token, authConfig.jwtSecret);
      req.user = decoded;
    } catch {
      // Invalid token, continue without user
    }
  }
  next();
}
// Role permissions mapping (Should match frontend/shared logic)
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

export function requirePermission(moduleName, action) {
  return (req, res, next) => {
    // Temporary override: Allow all actions
    next();
    
    /*
    // Usually requireAuth runs first, so req.user exists
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { role } = req.user;
    const userPermissions = PERMISSIONS[role] || PERMISSIONS.user;
    
    // Check if module exists in permissions
    if (!userPermissions[moduleName]) {
       return res.status(403).json({ error: 'Access denied' });
    }

    // Check action
    if (!userPermissions[moduleName].includes(action)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
    */
  };
}
