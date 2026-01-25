import { client } from '../db/client.js';

export const inventoryStorage = {
  // Get all products with aggregated stock from lots
  async findAll() {
    const query = `
      SELECT 
        p.*,
        COALESCE(SUM(l.cantidad_actual), 0) as stock_total,
        json_agg(
          json_build_object(
            'id', l.id,
            'codigo_lote', l.codigo_lote,
            'fecha_vencimiento', l.fecha_vencimiento,
            'cantidad_actual', l.cantidad_actual
          ) 
        ) FILTER (WHERE l.id IS NOT NULL AND l.cantidad_actual > 0) as lotes_activos
      FROM productos p
      LEFT JOIN lotes l ON p.id = l.producto_id
      GROUP BY p.id
      ORDER BY p.nombre ASC
    `;
    const result = await client.query(query);
    return result.rows;
  },

  async findById(id) {
    const query = `
      SELECT * FROM productos WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    return result.rows[0] || null;
  },

  // Create a new Product definition
  async createProduct(product) {
    const { nombre, codigo_barras, unit, description, stock_minimo } = product;
    const result = await client.query(
      `INSERT INTO productos (nombre, codigo_barras, unidad_medida, descripcion, stock_minimo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, codigo_barras, unit, description, stock_minimo || 0]
    );
    return result.rows[0];
  },

  // Add a Lot to a Product (Entrada)
  async addLot(lot) {
    const { producto_id, codigo_lote, fecha_vencimiento, cantidad, costo_unitario } = lot;
    const result = await client.query(
      `INSERT INTO lotes (producto_id, codigo_lote, fecha_vencimiento, cantidad_inicial, cantidad_actual, costo_unitario)
       VALUES ($1, $2, $3, $4, $4, $5)
       RETURNING *`,
      [producto_id, codigo_lote, fecha_vencimiento, cantidad, costo_unitario || 0]
    );
    return result.rows[0];
  },

  // Update Product Metadata
  async updateProduct(id, product) {
    const { nombre, codigo_barras, unit, description, stock_minimo } = product;
    const result = await client.query(
      `UPDATE productos
       SET nombre = $1, codigo_barras = $2, unidad_medida = $3, descripcion = $4, stock_minimo = $5
       WHERE id = $6
       RETURNING *`,
      [nombre, codigo_barras, unit, description, stock_minimo, id]
    );
    return result.rows[0];
  },

  async deleteProduct(id) {
     const result = await client.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
     return result.rows[0];
  },

  // FEFO Strategy or Specific Lot Removal
  async removeStock(productId, quantity, lotId = null) {
    let query = '';
    let params = [];

    if (lotId) {
        // Specific Lot
         query = `SELECT * FROM lotes WHERE id = $1 AND producto_id = $2`;
         params = [lotId, productId];
    } else {
        // FEFO (Automatic)
        query = `SELECT * FROM lotes 
       WHERE producto_id = $1 AND cantidad_actual > 0 
       ORDER BY fecha_vencimiento ASC NULLS LAST, fecha_entrada ASC`;
       params = [productId];
    }

    const lotsResult = await client.query(query, params);
    
    let lots = lotsResult.rows;
    if (lots.length === 0) {
        throw new Error(lotId ? 'Lote no encontrado o invalido' : 'No hay stock disponible');
    }

    let remaining = quantity;
    const updates = [];

    // Calculate total available (for validation)
    const totalAvailable = lots.reduce((sum, l) => sum + l.cantidad_actual, 0);
    // Only check total availability if NOT targeting a specific lot (or check specific lot stock)
    if (totalAvailable < quantity) {
        throw new Error(`Stock insuficiente. Disponible: ${totalAvailable}, Solicitado: ${quantity}`);
    }

    // Iterate and deduct
    for (const lot of lots) {
        if (remaining <= 0) break;

        const deduct = Math.min(lot.cantidad_actual, remaining);
        updates.push({
            id: lot.id,
            newQuantity: lot.cantidad_actual - deduct,
            deducted: deduct
        });
        remaining -= deduct;
    }

    // Apply updates
    for (const update of updates) {
        await client.query(
            'UPDATE lotes SET cantidad_actual = $1 WHERE id = $2',
            [update.newQuantity, update.id]
        );
    }

    return updates;
  }
};
