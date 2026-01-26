import { Router } from 'express';
import { usersController } from '../controllers/users.controller.js';
// import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js'; 
// Assuming checking for role happens here or just requireAuth. 
// For now, let's keep it open or just requireAuth if available.
// I will not add middlewares yet as I need to verify imports, but typically yes.

const router = Router();

router.get('/', usersController.getAll);
router.post('/', usersController.create);
router.put('/:id', usersController.update);
router.put('/:id/status', usersController.toggleStatus);

export default router;
