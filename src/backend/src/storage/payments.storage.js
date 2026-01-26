import { client } from '../db/client.js';

export const paymentsStorage = {
    async create(payment) {
        const { ordenId, monto, metodo, referencia, nota, userId } = payment;
        const result = await client.query(
            `INSERT INTO pagos (orden_id, monto, metodo, referencia, usuario_id, nota)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [ordenId, monto, metodo, referencia, userId, nota]
        );
        return result.rows[0];
    },

    async findAll(filters = {}) {
        let query = `
            SELECT p.*, 
                   o.id as orden_id,
                   pac.nombre as paciente,
                   u.nombre as usuario
            FROM pagos p
            JOIN orden o ON p.orden_id = o.id
            JOIN pacientes pac ON o.id_paciente = pac.id
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramValues = [];

        // Add filter logic if needed later
        
        query += ` ORDER BY p.fecha DESC LIMIT 100`;

        const result = await client.query(query, paramValues);
        return result.rows;
    },

    async findByOrderId(ordenId) {
        const result = await client.query(
            `SELECT p.*, u.nombre as usuario 
             FROM pagos p
             LEFT JOIN usuarios u ON p.usuario_id = u.id
             WHERE p.orden_id = $1
             ORDER BY p.fecha DESC`,
            [ordenId]
        );
        return result.rows;
    }
};
