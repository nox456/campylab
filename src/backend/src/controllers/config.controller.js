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

  async getCompanyInfo(req, res) {
    try {
      const nombre = await configStorage.get('empresa_nombre');
      const direccion = await configStorage.get('empresa_direccion');
      const telefono = await configStorage.get('empresa_telefono');
      const rif = await configStorage.get('empresa_rif');
      const codigo = await configStorage.get('empresa_codigo');
      const logoUrl = await configStorage.get('empresa_logo_url');
      const smtp_host = await configStorage.get('smtp_host');
      const smtp_port = await configStorage.get('smtp_port');
      const smtp_user = await configStorage.get('smtp_user');
      const smtp_pass = await configStorage.get('smtp_pass');

      res.json({
        nombre: nombre || '',
        direccion: direccion || '',
        telefono: telefono || '',
        rif: rif || '',
        codigo: codigo || '',
        logoUrl: logoUrl || '',
        smtp_host: smtp_host || '',
        smtp_port: smtp_port || '',
        smtp_user: smtp_user || '',
        smtp_pass: smtp_pass || '',
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error obteniendo información de la empresa' });
    }
  },

  async updateCompanyInfo(req, res) {
    try {
      const { nombre, direccion, telefono, rif, codigo, logoUrl, smtp_host, smtp_port, smtp_user, smtp_pass } = req.body;

      if (nombre !== undefined) await configStorage.set('empresa_nombre', nombre);
      if (direccion !== undefined) await configStorage.set('empresa_direccion', direccion);
      if (telefono !== undefined) await configStorage.set('empresa_telefono', telefono);
      if (rif !== undefined) await configStorage.set('empresa_rif', rif);
      if (codigo !== undefined) await configStorage.set('empresa_codigo', codigo);
      if (logoUrl !== undefined) await configStorage.set('empresa_logo_url', logoUrl);

      // SMTP Settings
      if (smtp_host !== undefined) await configStorage.set('smtp_host', smtp_host);
      if (smtp_port !== undefined) await configStorage.set('smtp_port', smtp_port);
      if (smtp_user !== undefined) await configStorage.set('smtp_user', smtp_user);
      if (smtp_pass !== undefined) await configStorage.set('smtp_pass', smtp_pass);

      res.json({ success: true, message: 'Información actualizada correctamente' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error actualizando información de la empresa' });
    }
  },
};
