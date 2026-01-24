import { client } from '../db/client.js';

export const usersStorage = {
  async findByEmail(email) {
    const result = await client.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await client.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async create(email, passwordHash) {
    const result = await client.query(
      `INSERT INTO usuarios (email, password)
       VALUES ($1, $2)
       RETURNING *`,
      [email.toLowerCase(), passwordHash]
    );
    return result.rows[0];
  },

  sanitize(user) {
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },
};
