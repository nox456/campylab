import { ordersStorage } from '../storage/orders.storage.js';

export const ordersController = {
  async getAll(req, res) {
    try {
      const filters = {
          patientId: req.query.patientId
      };
      const orders = await ordersStorage.findAll(filters);
      // Calculate pagado/pendiente logic if needed. For now assuming pagado = 0 unless integrated with Invoice.
      // Or we can assume 'pagado' status implies full payment.
      const mapped = orders.map(o => ({
          ...o,
          pagado: o.estado === 'pagado' || o.estado === 'entregado' ? o.total : 0 // Simple logic for now
      }));
      res.json(mapped);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
        const { id } = req.params;
        const order = await ordersStorage.findById(id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error fetching order' });
    }
  },

  async create(req, res) {
    try {
      const { pacienteId, exams, prioridad, observaciones, total } = req.body;

      if (!pacienteId || !exams || exams.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newOrder = await ordersStorage.create({
        id_paciente: pacienteId,
        exams, // Array of IDs
        prioridad,
        observaciones,
        total,
        estado: 'creado'
      });

      res.status(201).json(newOrder);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async updateStatus(req, res) {
      try {
          const { id } = req.params;
          const { estado } = req.body;
          const updated = await ordersStorage.updateStatus(id, estado);
          res.json(updated);
      } catch (e) {
          console.error(e);
          res.status(500).json({ error: 'Error updating status' });
      }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await ordersStorage.delete(id);
      res.json({ message: 'Order deleted successfully' });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
