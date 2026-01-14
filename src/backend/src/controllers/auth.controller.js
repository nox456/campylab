import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.config.js';
import { usersStorage } from '../storage/users.storage.js';

const SALT_ROUNDS = 10;

export const authController = {
  async register(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (usersStorage.findByEmail(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = usersStorage.create(email, passwordHash);

    const token = jwt.sign({ userId: user.id }, authConfig.jwtSecret, {
      expiresIn: authConfig.jwtExpiresIn,
    });

    res.cookie(authConfig.cookieName, token, authConfig.cookieOptions);
    res.status(201).json({ user: usersStorage.sanitize(user) });
  },

  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = usersStorage.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
    res.json({ message: 'Logged out successfully' });
  },

  me(req, res) {
    const user = usersStorage.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: usersStorage.sanitize(user) });
  },
};
