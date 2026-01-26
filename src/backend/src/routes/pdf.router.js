import { Router } from 'express';
import { pdfController } from '../controllers/pdf.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);


router.get('/result/:id', pdfController.generateResultPDF);
router.post('/email/:id', pdfController.emailResultPDF);

export default router;
