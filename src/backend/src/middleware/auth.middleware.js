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
