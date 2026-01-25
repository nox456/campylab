import { Router } from 'express';
import { ordersController } from '../controllers/orders.controller.js';
import { requirePermission } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requirePermission('orders', 'read'), ordersController.getAll);
router.get('/:id', requirePermission('orders', 'read'), ordersController.getById);
router.post('/', requirePermission('orders', 'create'), ordersController.create);
router.put('/:id/status', requirePermission('orders', 'update'), ordersController.updateStatus);
router.delete('/:id', requirePermission('orders', 'delete'), ordersController.delete);

export default router;
