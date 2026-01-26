import { configStorage } from '../storage/config.storage.js';

export const configController = {
  async getRate(req, res) {
    try {
      const rate = await configStorage.get('tasa_dolar');
      res.json({ tasa: rate || '0' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error obteniendo tasa' });
    }
  },

  async updateRate(req, res) {
    try {
      const { tasa } = req.body;
      if (tasa === undefined) {
        return res.status(400).json({ error: 'Tasa es requerida' });
      }
      const updated = await configStorage.set('tasa_dolar', String(tasa));
      res.json({ tasa: updated.valor });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error actualizando tasa' });
    }
  },
};
