import { client } from '../db/client.js';

export const dashboardStorage = {
  async getStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Total Patients
    const patientsRes = await client.query('SELECT COUNT(*) FROM pacientes WHERE activo = true');
    const totalPatients = parseInt(patientsRes.rows[0].count);

    // Orders Today
    const ordersRes = await client.query('SELECT COUNT(*) FROM orden WHERE date(fecha) = $1', [today]);
    const ordersToday = parseInt(ordersRes.rows[0].count);

    // Pending Results (Orders waiting for results)
    // Statuses that imply pending results: 'creado', 'pendiente', 'procesando'
    const resultsRes = await client.query("SELECT COUNT(*) FROM orden WHERE estado IN ('creado', 'pendiente', 'procesando')");
    const pendingResults = parseInt(resultsRes.rows[0].count);

    // Low Stock (Product level)
    const lowStockRes = await client.query(`
      SELECT COUNT(*) 
      FROM (
        SELECT p.id, p.stock_minimo, COALESCE(SUM(l.cantidad_actual), 0) as stock_total
        FROM productos p
        LEFT JOIN lotes l ON p.id = l.producto_id
        GROUP BY p.id
      ) as stocks
      WHERE stock_total < stock_minimo
    `);
    const lowStockItems = parseInt(lowStockRes.rows[0].count);

    // Revenue Today (Payments made today)
    const revenueRes = await client.query('SELECT COALESCE(SUM(monto), 0) as total FROM pagos WHERE date(fecha) = $1', [today]);
    const totalRevenue = parseFloat(revenueRes.rows[0].total);

    return {
      totalPatients,
      ordersToday,
      pendingResults,
      lowStockItems,
      totalRevenue
    };
  },

  async getRecentOrders(limit = 5) {
      const query = `
        SELECT 
            o.id, 
            p.nombre as patient, 
            to_char(o.fecha, 'YYYY-MM-DD') as date, 
            o.estado as status,
            o.prioridad,
            o.total
        FROM orden o
        JOIN pacientes p ON o.id_paciente = p.id
        ORDER BY o.fecha DESC, o.id DESC
        LIMIT $1
      `;
      const result = await client.query(query, [limit]);
      return result.rows;
  },

  async getLowStockDetails(limit = 5) {
      const query = `
      SELECT * 
      FROM (
        SELECT 
            p.id, 
            p.nombre as name, 
            COALESCE(SUM(l.cantidad_actual), 0) as current, 
            p.stock_minimo as minimum
        FROM productos p
        LEFT JOIN lotes l ON p.id = l.producto_id
        GROUP BY p.id
      ) as stocks
      WHERE current < minimum
      ORDER BY (current::float / NULLIF(minimum, 0)) ASC
      LIMIT $1
      `;
      const result = await client.query(query, [limit]);
      return result.rows;
  }
};
