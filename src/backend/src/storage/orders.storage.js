import { client } from '../db/client.js';

export const ordersStorage = {
  async findAll(filters = {}) {
    let query = `
      SELECT o.*, 
             p.nombre as paciente_nombre, 
             p.cedula as paciente_cedula
      FROM orden o
      JOIN pacientes p ON o.id_paciente = p.id
      WHERE o.activo = TRUE
    `;
    
    const values = [];
    let paramCount = 1;

    if (filters.patientId) {
        query += ` AND o.id_paciente = $${paramCount}`;
        values.push(filters.patientId);
        paramCount++;
    }

    query += ` ORDER BY o.fecha DESC, o.id DESC`;

    const result = await client.query(query, values);
    return result.rows;
  },

  async findById(id) {
    // Get Order Header
    const orderQuery = `
      SELECT o.*, 
             p.nombre as paciente_nombre, 
             p.cedula as paciente_cedula,
             p.email as paciente_email,
             p.sexo as paciente_sexo,
             p.fecha_nacimiento as paciente_nacimiento,
             p.telefono as paciente_telefono,
             p.direccion as paciente_direccion
      FROM orden o
      JOIN pacientes p ON o.id_paciente = p.id
      WHERE o.id = $1
    `;
    const orderResult = await client.query(orderQuery, [id]);
    const order = orderResult.rows[0];

    if (!order) return null;

    // Get Order Details (Exams)
    const detailsQuery = `
      SELECT d.*, e.nombre as examen_nombre, e.precio
      FROM detalle_orden d
      JOIN examen e ON d.id_examen = e.id
      WHERE d.id_orden = $1
    `;
    const detailsResult = await client.query(detailsQuery, [id]);
    
    // Get Results if available
    const resultsQuery = `
      SELECT r.id as result_id, r.id_examen,
             dr.nombre as param_nombre, dr.unidad, dr.valor,
             de.valor_min as min, de.valor_max as max
      FROM result r
      JOIN detalle_resultado dr ON r.id = dr.id_resultado
      JOIN detallado_examen de ON de.id_examen = r.id_examen AND de.nombre = dr.nombre
      WHERE r.id_orden = $1
    `;
    // Note: The above query assumes perfect matching of names. 
    // Actually, `resultado` table connects Order+Exam.
    // Let's adjust to fetch result details properly.
    
    const rawResultsQuery = `
        SELECT r.id_examen, dr.nombre, dr.unidad, dr.valor, 
               u.nombre as bioanalista
        FROM resultado r
        JOIN detalle_resultado dr ON r.id = dr.id_resultado
        JOIN usuarios u ON r.id_usuario = u.id
        WHERE r.id_orden = $1
    `;
    
    const rawResults = await client.query(rawResultsQuery, [id]);
    
    // Attach results to exams
    const exams = detailsResult.rows.map(exam => {
        const examResults = rawResults.rows.filter(r => r.id_examen === exam.id_examen);
        return {
            ...exam,
            resultados: examResults.map(r => ({
                nombre: r.nombre,
                unidad: r.unidad,
                valor: r.valor
            }))
        };
    });

    // Calculate Age
    const dob = new Date(order.paciente_nacimiento);
    const ageDifMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);

    // Get Consumibles used in this order
    const consumiblesQuery = `
      SELECT p.nombre, l.codigo_lote, c.cantidad, p.unidad_medida as unidad
      FROM consumidos c
      JOIN resultado r ON c.id_resultado = r.id
      JOIN lotes l ON c.id_lote = l.id
      JOIN productos p ON l.producto_id = p.id
      WHERE r.id_orden = $1
    `;
    const consumiblesResult = await client.query(consumiblesQuery, [id]);

    // Get Payments
    const paymentsQuery = `
      SELECT p.*, u.nombre as usuario
      FROM pagos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.orden_id = $1
      ORDER BY p.fecha DESC
    `;
    const paymentsResult = await client.query(paymentsQuery, [id]);
    const pagos = paymentsResult.rows;
    
    // Calculate total paid
    const pagado = pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);

    return { 
        ...order, 
        paciente: {
            ...order.paciente, // spread existing properties if any (actually they are flattened)
            nombre: order.paciente_nombre,
            cedula: order.paciente_cedula,
            email: order.paciente_email,
            sexo: order.paciente_sexo,
            telefono: order.paciente_telefono,
            direccion: order.paciente_direccion,
            edad: age
        },
        exams,
        pagos,
        pagado, 
        consumibles: consumiblesResult.rows
    };
  },

  async create(orderData) {
    const { id_paciente, total, estado, prioridad, observaciones, exams } = orderData;
    
    // Start Transaction
    try {
        await client.query('BEGIN');

        // Create Header
        const orderResult = await client.query(
            `INSERT INTO orden (id_paciente, total, estado, prioridad, observaciones)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [id_paciente, total, estado || 'pendiente', prioridad || 'rutina', observaciones]
        );
        const orderId = orderResult.rows[0].id;

        // Create Details
        for (const examId of exams) {
            // Get current price if needed, or pass it. Assuming passed or fetched from DB. 
            // Better to fetch current price from exam table to ensure accuracy or use passed price.
            // Let's assume we fetch it to be safe or simple insert.
            // But frontend calculated total. Let's trust frontend or re-fetch.
            // Re-fetching price is safer.
            const priceResult = await client.query('SELECT precio FROM examen WHERE id = $1', [examId]);
            const price = priceResult.rows[0]?.precio || 0;

            await client.query(
                `INSERT INTO detalle_orden (id_orden, id_examen, precio)
                 VALUES ($1, $2, $3)`,
                [orderId, examId, price]
            );
        }

        await client.query('COMMIT');
        return this.findById(orderId);
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }
  },

  async updateStatus(id, status) {
    const result = await client.query(
      `UPDATE orden SET estado = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    // Soft delete
    const result = await client.query(
        `UPDATE orden SET activo = FALSE WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
  }
};
