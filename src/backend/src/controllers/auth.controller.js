import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.config.js';
import { usersStorage } from '../storage/users.storage.js';

const SALT_ROUNDS = 10;

export const authController = {
  async register(req, res) {
    return res.status(403).json({ error: 'El registro público está desactivado por el administrador.' });
  },

  async login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const user = await usersStorage.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.activo) {
       return res.status(403).json({ error: 'El usuario está inactivo' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ userId: user.id }, authConfig.jwtSecret, {
      expiresIn: authConfig.jwtExpiresIn,
    });

    res.cookie(authConfig.cookieName, token, authConfig.cookieOptions);
    res.json({ user: usersStorage.sanitize(user) });
  },

  logout(req, res) {
    res.clearCookie(authConfig.cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.json({ message: 'Sesión cerrada exitosamente' });
  },

  async me(req, res) {
    const user = await usersStorage.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: usersStorage.sanitize(user) });
  },
};
