import bcrypt from 'bcrypt';
import { usersStorage } from '../storage/users.storage.js';

const SALT_ROUNDS = 10;

export const usersController = {
  async getAll(req, res) {
    try {
      const users = await usersStorage.findAll();
      res.json(users.map(usersStorage.sanitize));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  },

  async create(req, res) {
    try {
      const { password, email, username, cedula, ...otherData } = req.body;
      
      if (!email || !password || !username) {
        return res.status(400).json({ error: 'Usuario, email y contraseña son requeridos' });
      }

      if (await usersStorage.findByEmail(email)) {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }

      if (await usersStorage.findByUsername(username)) {
        return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
      }

      if (cedula && await usersStorage.findByCedula(cedula)) {
        return res.status(409).json({ error: 'La cédula ya está registrada' });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await usersStorage.create({ ...otherData, cedula, email, username, password: passwordHash });
      
      res.status(201).json(usersStorage.sanitize(user));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      // Check if cedula is being changed and if it's already in use by another user
      if (data.cedula) {
        const existingUser = await usersStorage.findByCedula(data.cedula);
        if (existingUser && existingUser.id !== parseInt(id)) {
          return res.status(409).json({ error: 'La cédula ya está registrada' });
        }
      }
      
      // We do not update password here usually, or separate endpoint
      const updated = await usersStorage.update(id, data);
      res.json(usersStorage.sanitize(updated));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  },

  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const updated = await usersStorage.toggleStatus(id);
      res.json(usersStorage.sanitize(updated));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error al cambiar estado' });
    }
  }
};
