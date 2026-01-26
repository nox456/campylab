import { resultsStorage } from '../storage/results.storage.js';

export const resultsController = {
  async getPendingOrders(req, res) {
    try {
      const orders = await resultsStorage.findAllPending();
      res.json(orders);
    } catch (error) {
      console.error('Error fetching pending results:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getExamParameters(req, res) {
    try {
        const { id } = req.params;
        const params = await resultsStorage.getExamParameters(id);
        res.json(params);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error fetching exam parameters' });
    }
  },

  async saveResult(req, res) {
      try {
          const { ordenId, examenId, pacienteId, detalles, consumibles } = req.body;
          // In a real app we'd get userId from req.user
          const userId = req.user ? req.user.userId : 1; 

          if (!ordenId || !examenId || !pacienteId || !detalles) {
              return res.status(400).json({ error: 'Missing required fields' });
          }
          
          const result = await resultsStorage.saveResult({
              ordenId, examenId, pacienteId, userId, detalles, consumibles
          });
          
          res.status(201).json(result);
      } catch (e) {
          console.error(e);
          res.status(500).json({ error: e.message || 'Error saving result' });
      }
  }
};
