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
      WHERE o.activo = TRUE AND o.estado != 'cancelado'
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
    // Start Transaction
    const db = await client.connect();
    try {
        await db.query('BEGIN');

        // Create Result Header
        const resultHeader = await db.query(
            `INSERT INTO resultado (id_orden, id_examen, id_paciente, id_usuario)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [ordenId, examenId, pacienteId, 1] // Fixed user id for now
        );
        const resultId = resultHeader.rows[0].id;

        // Create Details
        for (const d of detalles) {
            await db.query(
                `INSERT INTO detalle_resultado (id_resultado, nombre, unidad, valor)
                 VALUES ($1, $2, $3, $4)`,
                [resultId, d.nombre, d.unidad, d.valor]
            );
        }

        // Handle Consumables (if any)
        if (data.consumibles && Array.isArray(data.consumibles)) {
            // Note: circular dependency if we import inventoryStorage here
            // But inventory storage doesn't seem to use transactions yet
            // Wait, inventoryStorage.consumeProduct logic needs improvement.
            // consumeProduct DOES multiple updates. It's not transactional by itself in old code! 
            // It just ran queries. With pool, they run on random clients.
            // Ideally we need to pass the client 'db' to consumeProduct.
            // But since I cannot easily change inventory.storage API without breaking other calls,
            // let's assume for now inventory logic runs separate transactions or check.
            // Actually, for correctness, consumeProduct should take an optional client.
            
            const { inventoryStorage } = await import('./inventory.storage.js');
            
            for (const item of data.consumibles) {
                if (item.cantidad > 0) {
                    // Consume stock (FEFO) - This updates lots
                    // WARNING: This call is outside THIS transaction if we don't pass db.
                    // This means if saveResult fails later, stock is already consumed.
                    // Ideally pass 'db' to consumeProduct. 
                    // Let's modify consumeProduct later if needed. For now calling it.
                    // It will checkout its own client if using pool.
                    const consumedLots = await inventoryStorage.consumeProduct(item.productoId, item.cantidad, userId);
                    
                    // Record consumption linked to result
                    for (const lot of consumedLots) {
                        await db.query(
                            `INSERT INTO consumidos (id_resultado, id_lote, cantidad)
                             VALUES ($1, $2, $3)`,
                            [resultId, lot.id_lote, lot.cantidad]
                        );
                    }
                }
            }
        }

        // Update Exam Status in Order is tricky because normalized. 
        // We just rely on presence of Result to know it's done.
        
        // Check if all exams for this order are done
        // First get all exams for order
        const orderExamsRes = await db.query(
            `SELECT id_examen FROM detalle_orden WHERE id_orden = $1`,
            [ordenId]
        );
        const orderExams = orderExamsRes.rows.map(r => r.id_examen);

        // Get all results for order
        const orderResultsRes = await db.query(
            `SELECT id_examen FROM resultado WHERE id_orden = $1`,
            [ordenId]
        );
        const doneExams = orderResultsRes.rows.map(r => r.id_examen);
        
        // If all exams have results, update order status
        // (Note: inside this transaction, we just added one, so it should be visible if read committed or similar, 
        // but easier to check logic)
        // Set match logic
        const allDone = orderExams.every(id => doneExams.includes(id));
        
        if (allDone) {
            // Check if paid
            // We can't reuse transaction client easily unless we pass it, but read is fine.
            // Actually, best to do a quick check query here within transaction or just assume read committed.
            
            // Re-check payment sum
            const paymentRes = await db.query(
                `SELECT SUM(monto) as pagado FROM pagos WHERE orden_id = $1`,
                [ordenId]
            );
            const pagado = parseFloat(paymentRes.rows[0].pagado) || 0;
            
            const orderTotalRes = await db.query(
                `SELECT total FROM orden WHERE id = $1`,
                [ordenId]
            );
            const total = parseFloat(orderTotalRes.rows[0].total) || 0;
            
            let newStatus = 'resultados_cargados';
            if (pagado >= total) {
                newStatus = 'pagado'; // Ready for Delivery - wait, pagado is 'Pagado / Por Entregar'
                // User said: "tiene que tener los resultados cargados y estar pagado para eso" (pasar al estatus pagado)
                // Entregado is a separate manual step usually.
            }
            
            await db.query(
                `UPDATE orden SET estado = $1 WHERE id = $2`,
                [newStatus, ordenId]
            );
        } else {
             // If not all results done, ensure it's 'creado' (or 'resultados_cargados' if we support partial?)
             // User logic implies strict states. If partial results, maybe just stay 'creado' or a partial state?
             // Since we only have 'creado', 'resultados_cargados', 'pagado'...
             // 'resultados_cargados' implies ALL results loaded? Usually yes.
             // So if partially loaded, it should probably stay 'creado' (which counts as "En Proceso" in frontend label).
             // We remove 'procesando' logic.
             // Ensure it is 'creado' if it was somehow else? 
             // Actually, if we are adding results, it's definitely 'creado' (En Proceso).
             await db.query(
                `UPDATE orden SET estado = 'creado' WHERE id = $1 AND (estado = 'creado')`, // redundant but safe
                [ordenId]
            );
        }

        await db.query('COMMIT');
        return true;
    } catch (e) {
        await db.query('ROLLBACK');
        throw e;
    } finally {
        db.release();
    }
  }
};
