import { Router } from 'express';
import { paymentsController } from '../controllers/payments.controller.js';
import { requireAuth, requirePermission } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('payments', 'read'), paymentsController.getAll);
router.get('/order/:id', requirePermission('payments', 'read'), paymentsController.getByOrder);
router.post('/', requirePermission('payments', 'create'), paymentsController.create);

export default router;
