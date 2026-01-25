import { client } from '../db/client.js';

export const examsStorage = {
  // Categories
  async createCategory(name, sample) {
    const result = await client.query(
      'INSERT INTO categoria_examen (nombre, muestra, activo) VALUES ($1, $2, true) RETURNING *',
      [name, sample]
    );
    return result.rows[0];
  },

  async getCategories() {
    // Return all for management
    const result = await client.query('SELECT * FROM categoria_examen ORDER BY nombre ASC');
    return result.rows;
  },

  async deleteCategory(id) {
    // Check if used by any exam
    const check = await client.query('SELECT count(*) FROM examen WHERE id_categoria_examen = $1', [id]);
    const usageCount = parseInt(check.rows[0].count);

    if (usageCount > 0) {
      throw new Error('No se puede eliminar: Esta categoria esta asociada a uno o mas examenes.');
    }
    
    // Hard Delete
    const result = await client.query('DELETE FROM categoria_examen WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },

  // Exams
  async getExams() {
    const result = await client.query(`
      SELECT e.*, c.nombre as categoria_nombre, c.muestra
      FROM examen e
      JOIN categoria_examen c ON e.id_categoria_examen = c.id
      ORDER BY e.nombre ASC
    `);
    
    return result.rows;
  },

  async createExam(examData, details) {
    try {
      await client.query('BEGIN');

      const { nombre, id_categoria_examen, precio } = examData;
      
      const examResult = await client.query(
        'INSERT INTO examen (nombre, id_categoria_examen, precio) VALUES ($1, $2, $3) RETURNING *',
        [nombre, id_categoria_examen, precio]
      );
      const examId = examResult.rows[0].id;

      for (const detail of details) {
        const vMin = (detail.valor_min !== undefined && detail.valor_min !== '') ? detail.valor_min : 0;
        const vMax = (detail.valor_max !== undefined && detail.valor_max !== '') ? detail.valor_max : 0;

        await client.query(
          `INSERT INTO detallado_examen (id_examen, nombre, unidad, valor_min, valor_max)
           VALUES ($1, $2, $3, $4, $5)`,
          [examId, detail.nombre, detail.unidad, vMin, vMax]
        );
      }

      await client.query('COMMIT');
      return { ...examResult.rows[0], detalles: details };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  },

  async getExamDetails(examId) {
    const result = await client.query(
      'SELECT * FROM detallado_examen WHERE id_examen = $1',
      [examId]
    );
    return result.rows;
  },

  async deleteExam(id) {
    // Check if used in Orders
    const checkOrder = await client.query('SELECT count(*) FROM detalle_orden WHERE id_examen = $1', [id]);
    const usageCount = parseInt(checkOrder.rows[0].count);

    if (usageCount > 0) {
       throw new Error('No se puede eliminar: Este examen ya ha sido utilizado en ordenes.');
    }
    
    // Hard Delete (Must delete details first)
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM detallado_examen WHERE id_examen = $1', [id]);
      const result = await client.query('DELETE FROM examen WHERE id = $1 RETURNING *', [id]);
      await client.query('COMMIT');
      return result.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  }
};
