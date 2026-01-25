import { inventoryStorage } from '../storage/inventory.storage.js';

export const inventoryController = {
  async getAll(req, res) {
    try {
      const items = await inventoryStorage.findAll();
      // Transform data if needed for frontend expectation
      // Frontend expects: id, nombre, codigo, cantidad, minimo, unidad, proveedor (desc), lote (agg?), vencimiento (agg?)
      // We will send the full object and let frontend adapt.
      res.json(items);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req, res) {
    try {
      // Logic:
      // If creating a NEW PRODUCT, we insert into `productos`.
      // Optionally, user might be adding initial stock (Lot) at the same time.
      // Or user is adding a Lot to existing product.
      // Frontend form likely sends a mix.
      
      const { 
        nombre, codigo, unidad, descripcion, minimo, // Product fields
        lote, vencimiento, cantidad // Lot fields
      } = req.body;

      // 1. Create Product
      const product = await inventoryStorage.createProduct({
        nombre,
        codigo_barras: codigo,
        unit: unidad,
        description: descripcion,
        stock_minimo: parseInt(minimo)
      });

      // 2. If quantity > 0, create initial Lot automatically
      if (cantidad && parseInt(cantidad) > 0) {
        await inventoryStorage.addLot({
          producto_id: product.id,
          codigo_lote: lote || 'INICIAL',
          fecha_vencimiento: vencimiento || null,
          cantidad: parseInt(cantidad)
        }, req.user ? req.user.userId : 1);
      }

      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  // Endpoint to add stock (New Lot) to existing product
  async addStock(req, res) {
    try {
      const { id } = req.params; // Product ID
      const { lote, vencimiento, cantidad } = req.body;

      const newLot = await inventoryStorage.addLot({
        producto_id: id,
        codigo_lote: lote,
        fecha_vencimiento: vencimiento,
        cantidad: parseInt(cantidad)
      }, req.user ? req.user.userId : 1);

      res.status(201).json(newLot);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error adding stock' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, codigo, unidad, descripcion, minimo } = req.body;
      
      const updated = await inventoryStorage.updateProduct(id, {
        nombre,
        codigo_barras: codigo,
        unit: unidad,
        description: descripcion,
        stock_minimo: parseInt(minimo)
      });
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error updating product' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await inventoryStorage.deleteProduct(id);
      res.json({ message: 'Product deleted' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error deleting product' });
    }
  },

  async registerOutput(req, res) {
    try {
        const { id } = req.params;
        const { cantidad, motivo, loteId } = req.body;

        if (!cantidad || cantidad <= 0) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }

        // loteId can be null (FEFO) or a specific ID
        const changes = await inventoryStorage.removeStock(id, parseInt(cantidad), loteId || null, req.user ? req.user.userId : 1);
        
        res.json({ message: 'Stock removed successfully', details: changes });
    } catch (e) {
        console.error(e);
        res.status(400).json({ error: e.message });
    }
  },

  async getHistory(req, res) {
      try {
          const history = await inventoryStorage.getHistory();
          res.json(history);
      } catch (e) {
          console.error(e);
          res.status(500).json({ error: 'Error fetching history' });
      }
  }
};
