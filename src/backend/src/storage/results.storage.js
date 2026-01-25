import { client } from '../db/client.js';

export const resultsStorage = {
  // Find all orders that have exams pending results
  async findAllPending() {
    // This is a bit complex: We want orders where NOT ALL exams have a corresponding result.
    // Or simpler: List all exams from active orders that don't have a record in 'resultado' table.
    
    // We'll return a structure similar to what the frontend expects:
    // List of Orders, each containing a list of Exams.
    
    const query = `
      SELECT 
        o.id as orden_id,
        o.fecha,
        o.prioridad,
        o.estado as orden_estado,
        p.id as paciente_id,
        p.nombre as paciente_nombre,
        p.cedula as paciente_cedula,
        p.sexo as paciente_sexo,
        p.fecha_nacimiento as paciente_nacimiento,
        e.id as examen_id,
        e.nombre as examen_nombre,
        CASE WHEN r.id IS NOT NULL THEN 'cargado' ELSE 'pendiente' END as estado_examen
      FROM orden o
      JOIN pacientes p ON o.id_paciente = p.id
      JOIN detalle_orden do_table ON o.id = do_table.id_orden
      JOIN examen e ON do_table.id_examen = e.id
      LEFT JOIN resultado r ON r.id_orden = o.id AND r.id_examen = e.id
      WHERE o.activo = TRUE AND o.estado != 'cancelada'
      ORDER BY o.fecha DESC, o.prioridad = 'urgente' DESC
    `;
    
    const result = await client.query(query);
    
    // Transform flat rows into nested structure
    const ordersMap = new Map();
    
    for (const row of result.rows) {
        if (!ordersMap.has(row.orden_id)) {
            // Calculate age roughly or let frontend do it
            const dob = new Date(row.paciente_nacimiento);
            const ageDifMs = Date.now() - dob.getTime();
            const ageDate = new Date(ageDifMs);
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);

            ordersMap.set(row.orden_id, {
                id: row.orden_id,
                fecha: new Date(row.fecha).toISOString().split('T')[0],
                prioridad: row.prioridad,
                estado: row.orden_estado,
                paciente: {
                    id: row.paciente_id,
                    nombre: row.paciente_nombre,
                    cedula: row.paciente_cedula,
                    sexo: row.paciente_sexo,
                    edad: age
                },
                examenes: []
            });
        }
        
        ordersMap.get(row.orden_id).examenes.push({
            id: row.examen_id,
            nombre: row.examen_nombre,
            estado: row.estado_examen
        });
    }
    
    return Array.from(ordersMap.values());
  },

  async getExamParameters(examId) {
    const result = await client.query(
        `SELECT nombre, unidad, valor_min as min, valor_max as max 
         FROM detallado_examen 
         WHERE id_examen = $1`,
        [examId]
    );
    return result.rows;
  },

  async saveResult(data) {
    const { ordenId, examenId, pacienteId, userId, detalles } = data; // detalles: [{ nombre, unidad, valor }]
    
    try {
        await client.query('BEGIN');
        
        // 1. Create Result Header
        const headerRes = await client.query(
            `INSERT INTO resultado (id_orden, id_examen, id_paciente, id_usuario)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [ordenId, examenId, pacienteId, userId || 1] // Default user 1 if not provided for now
        );
        const resultId = headerRes.rows[0].id;
        
        // 2. Insert Details
        for (const det of detalles) {
            await client.query(
                `INSERT INTO detalle_resultado (id_resultado, nombre, unidad, valor)
                 VALUES ($1, $2, $3, $4)`,
                [resultId, det.nombre, det.unidad, det.valor]
            );
        }
        
        // 3. Update Order Status if needed?
        // If all exams in the order are done, we could set order status to 'resultados_cargados'.
        // Check if any pending exams left
        const pendingCheck = await client.query(
            `SELECT count(*) as count 
             FROM detalle_orden do_table
             LEFT JOIN resultado r ON r.id_orden = do_table.id_orden AND r.id_examen = do_table.id_examen
             WHERE do_table.id_orden = $1 AND r.id IS NULL`,
             [ordenId]
        );
        
        if (parseInt(pendingCheck.rows[0].count) === 0) {
            await client.query(
                "UPDATE orden SET estado = 'resultados_cargados' WHERE id = $1",
                [ordenId]
            );
        } else {
             await client.query(
                "UPDATE orden SET estado = 'procesando' WHERE id = $1",
                [ordenId]
            );
        }

        await client.query('COMMIT');
        return { id: resultId };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }
  }
};
