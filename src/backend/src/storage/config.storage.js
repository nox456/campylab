import { client } from '../db/client.js';

export const configStorage = {
  async get(key) {
    const result = await client.query(
      'SELECT valor FROM configuracion WHERE clave = $1',
      [key]
    );
    return result.rows[0]?.valor || null;
  },

  async set(key, value) {
    const result = await client.query(
      `INSERT INTO configuracion (clave, valor)
       VALUES ($1, $2)
       ON CONFLICT (clave)
       DO UPDATE SET valor = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, value]
    );
    return result.rows[0];
  },
};
