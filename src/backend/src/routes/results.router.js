import { Router } from 'express';
import { resultsController } from '../controllers/results.controller.js';
import { requirePermission } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/pending', requirePermission('results', 'read'), resultsController.getPendingOrders);
router.get('/exam-parameters/:id', requirePermission('results', 'read'), resultsController.getExamParameters);
router.post('/', requirePermission('results', 'create'), resultsController.saveResult);

export default router;
