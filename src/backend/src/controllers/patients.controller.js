import { patientsStorage } from '../storage/patients.storage.js';

export const patientsController = {
  async getAll(req, res) {
    try {
      const patients = await patientsStorage.findAll();
      res.json(patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const patient = await patientsStorage.findById(id);
      
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      res.json(patient);
    } catch (error) {
      console.error('Error fetching patient:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req, res) {
    try {
      const { nombre, cedula, telefono, direccion, email, sexo, fecha_nacimiento } = req.body;

      // Basic validation
      if (!nombre || !cedula || !telefono || !direccion || !sexo || !fecha_nacimiento) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if patient exists
      const existingPatient = await patientsStorage.findByCedula(cedula);
      if (existingPatient) {
        return res.status(409).json({ error: 'Patient with this cedula already exists' });
      }

      const newPatient = await patientsStorage.create({
        nombre,
        cedula,
        email: email || null,
        telefono,
        direccion,
        sexo,
        fecha_nacimiento
      });

      res.status(201).json(newPatient);
    } catch (error) {
      console.error('Error creating patient:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, cedula, telefono, direccion, email, sexo, fecha_nacimiento } = req.body;

      if (!nombre || !cedula || !telefono || !direccion || !sexo || !fecha_nacimiento) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if patient exists
      const existingPatient = await patientsStorage.findById(id);
      if (!existingPatient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Check if new cedula conflicts with another patient
      const conflictPatient = await patientsStorage.findByCedula(cedula);
      if (conflictPatient && conflictPatient.id !== parseInt(id)) {
        return res.status(409).json({ error: 'Another patient with this cedula already exists' });
      }

      const updatedPatient = await patientsStorage.update(id, {
        nombre,
        cedula,
        email: email || null,
        telefono,
        direccion
      });

      res.json(updatedPatient);
    } catch (error) {
      console.error('Error updating patient:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const existingPatient = await patientsStorage.findById(id);
      if (!existingPatient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      await patientsStorage.delete(id);
      res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
      console.error('Error deleting patient:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
