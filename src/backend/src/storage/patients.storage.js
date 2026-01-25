import { client } from '../db/client.js';

export const patientsStorage = {
  async findAll() {
    const result = await client.query('SELECT * FROM pacientes ORDER BY id DESC');
    return result.rows;
  },

  async findById(id) {
    const result = await client.query('SELECT * FROM pacientes WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByCedula(cedula) {
    const result = await client.query('SELECT * FROM pacientes WHERE cedula = $1', [cedula]);
    return result.rows[0] || null;
  },

  async create(patient) {
    const { nombre, cedula, email, telefono, direccion, sexo, fecha_nacimiento } = patient;
    const result = await client.query(
      `INSERT INTO pacientes (nombre, cedula, email, telefono, direccion, sexo, fecha_nacimiento)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nombre, cedula, email, telefono, direccion, sexo, fecha_nacimiento]
    );
    return result.rows[0];
  },

  async update(id, patient) {
    const { nombre, cedula, email, telefono, direccion, sexo, fecha_nacimiento } = patient;
    const result = await client.query(
      `UPDATE pacientes
       SET nombre = $1, cedula = $2, email = $3, telefono = $4, direccion = $5, sexo = $6, fecha_nacimiento = $7
       WHERE id = $8
       RETURNING *`,
      [nombre, cedula, email, telefono, direccion, sexo, fecha_nacimiento, id]
    );
    return result.rows[0];
  },

  async toggleStatus(id) {
    const result = await client.query(
      'UPDATE pacientes SET activo = NOT activo WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
};
