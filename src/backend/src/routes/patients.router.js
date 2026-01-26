import { Router } from 'express';
import { patientsController } from '../controllers/patients.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

router.get('/', patientsController.getAll);
router.get('/:id', patientsController.getById);
router.post('/', patientsController.create);
router.put('/:id', patientsController.update);
router.patch('/:id/status', patientsController.toggleStatus);

export default router;
