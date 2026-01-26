import { Router } from 'express';
import { configController } from '../controllers/config.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/rate', configController.getRate);
router.put('/rate', configController.updateRate);

export default router;
