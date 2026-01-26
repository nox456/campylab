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

      // Check if patient exists (Cedula)
      const existingPatient = await patientsStorage.findByCedula(cedula);
      if (existingPatient) {
        return res.status(409).json({ error: 'Ya existe un paciente con esta cedula' });
      }

      // Check if email exists
      if (email) {
          const emailPatient = await patientsStorage.findByEmail(email);
          if (emailPatient) {
              return res.status(409).json({ error: 'Ya existe un paciente con este correo electronico' });
          }
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
      if (error.code === '23505') {
          // Unique violation
          if (error.detail.includes('email')) {
              return res.status(409).json({ error: 'El correo electronico ya esta registrado' });
          }
          if (error.detail.includes('cedula')) {
              return res.status(409).json({ error: 'La cedula ya esta registrada' });
          }
      }
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
        return res.status(409).json({ error: 'Ya existe otro paciente con esta cedula' });
      }

      // Check if new email conflicts
      if (email) {
          const conflictEmail = await patientsStorage.findByEmail(email);
          if (conflictEmail && conflictEmail.id !== parseInt(id)) {
              return res.status(409).json({ error: 'Ya existe otro paciente con este correo electronico' });
          }
      }

      const updatedPatient = await patientsStorage.update(id, {
        nombre,
        cedula,
        email: email || null,
        telefono,
        direccion,
        sexo,
        fecha_nacimiento
      });

      res.json(updatedPatient);
    } catch (error) {
      if (error.code === '23505') {
          if (error.detail.includes('email')) {
              return res.status(409).json({ error: 'El correo electronico ya esta registrado por otro paciente' });
          }
          if (error.detail.includes('cedula')) {
              return res.status(409).json({ error: 'La cedula ya esta registrada por otro paciente' });
          }
      }
      console.error('Error updating patient:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      
      const existingPatient = await patientsStorage.findById(id);
      if (!existingPatient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const updatedPatient = await patientsStorage.toggleStatus(id);
      res.json(updatedPatient);
    } catch (error) {
      console.error('Error toggling patient status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
