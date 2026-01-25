import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller.js';
import { requireAuth, requirePermission } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('inventory', 'read'), inventoryController.getAll);
router.get('/history', requirePermission('inventory', 'read'), inventoryController.getHistory);
router.post('/', requirePermission('inventory', 'create'), inventoryController.create);
router.post('/:id/stock', requirePermission('inventory', 'update'), inventoryController.addStock); 
router.post('/:id/output', requirePermission('inventory', 'update'), inventoryController.registerOutput); // Output FEFO
router.put('/:id', requirePermission('inventory', 'update'), inventoryController.update);
router.delete('/:id', requirePermission('inventory', 'delete'), inventoryController.delete);

export default router;
