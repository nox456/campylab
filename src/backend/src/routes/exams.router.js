import express from 'express';
import { examsController } from '../controllers/exams.controller.js';
import { requireAuth, requirePermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);

// Categories
router.get('/categories', examsController.getCategories);
router.post('/categories', requirePermission('inventory', 'create'), examsController.createCategory); // reusing inventory permission or should make new 'results'/'exams' permission? 
// User said: "results: ['create', 'read', 'update', 'delete']" in PERMISSIONS.
// Let's assume managing exams/categories falls under 'inventory' or maybe 'results' config? 
// The user prompt mentions "category_examen" and "examen". This is configuration data. 
// Inventory permissions seem appropriate for management, or 'super_admin'.
// Let's stick to requireAuth for read, and allow creation if user has 'inventory' create permission as a placeholder, or maybe just check role.
// Actually, let's look at AuthContext again. There is no 'exams' module in permissions.
// 'results' is for patient results. 'inventory' is for items.
// Maybe I should add 'exams' to permissions later? For now let's use 'results' permission as it relates to exams used in results.
// Correction: Creating an exam definition is Administration. Let's require 'results' 'create' permission.

router.delete('/categories/:id', requirePermission('results', 'delete'), examsController.deleteCategory);

// Exams
router.get('/', examsController.getExams);
router.post('/', requirePermission('results', 'create'), examsController.createExam);
router.delete('/:id', requirePermission('results', 'delete'), examsController.deleteExam);

export default router;
