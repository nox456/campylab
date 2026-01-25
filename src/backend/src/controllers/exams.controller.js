import { examsStorage } from '../storage/exams.storage.js';

export const examsController = {
  // Categories
  async getCategories(req, res) {
    try {
      const categories = await examsStorage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async createCategory(req, res) {
    try {
      const { nombre, muestra } = req.body;
      if (!nombre || !muestra) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const newCategory = await examsStorage.createCategory(nombre, muestra);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const deleted = await examsStorage.deleteCategory(id);
      res.json(deleted);
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(400).json({ error: error.message });
    }
  },

  // Exams
  async getExams(req, res) {
    try {
      const exams = await examsStorage.getExams();
      res.json(exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async createExam(req, res) {
    try {
      const { nombre, id_categoria_examen, precio, detalles } = req.body;

      if (!nombre || !id_categoria_examen || !precio || !detalles) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({ error: 'An exam must have at least one detail parameter.' });
      }

      const newExam = await examsStorage.createExam(
        { nombre, id_categoria_examen, precio },
        detalles
      );
      res.status(201).json(newExam);
    } catch (error) {
      console.error('Error creating exam:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async deleteExam(req, res) {
    try {
      const { id } = req.params;
      await examsStorage.deleteExam(id);
      res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
      console.error('Error deleting exam:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
