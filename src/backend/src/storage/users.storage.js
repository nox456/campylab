import { client } from '../db/client.js';

export const usersStorage = {
  async findByEmail(email) {
    const result = await client.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  async findByUsername(username) {
    const result = await client.query(
      'SELECT * FROM usuarios WHERE username = $1',
      [username.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  async findByCedula(cedula) {
    const result = await client.query(
      'SELECT * FROM usuarios WHERE cedula = $1',
      [cedula]
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

  async findAll() {
    const result = await client.query('SELECT * FROM usuarios ORDER BY id ASC');
    return result.rows;
  },

  async create(user) {
    const { 
      nombre, cedula, email, username, telefono, direccion, password, role 
    } = user;
    
    // Default role 'user' if not provided (though DB has default)
    // We expect password to be already hashed
    
    const result = await client.query(
      `INSERT INTO usuarios (nombre, cedula, email, username, telefono, direccion, password, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [nombre, cedula, email.toLowerCase(), username.toLowerCase(), telefono, direccion, password, role || 'user']
    );
    return result.rows[0];
  },

  async update(id, user) {
    const { nombre, cedula, email, username, telefono, direccion, role } = user;
    const result = await client.query(
      `UPDATE usuarios 
       SET nombre = $1, cedula = $2, email = $3, username = $4, telefono = $5, direccion = $6, role = $7
       WHERE id = $8
       RETURNING *`,
      [nombre, cedula, email.toLowerCase(), username.toLowerCase(), telefono, direccion, role, id]
    );
    return result.rows[0];
  },

  async toggleStatus(id) {
    const result = await client.query(
      'UPDATE usuarios SET activo = NOT COALESCE(activo, true) WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  sanitize(user) {
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },
};
