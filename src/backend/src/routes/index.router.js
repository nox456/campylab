import express from 'express';
import authRouter from './auth.router.js';
import patientsRouter from './patients.router.js';
import examsRouter from './exams.router.js';
import { requireAuth } from '../middleware/auth.middleware.js';

import inventoryRouter from './inventory.router.js';
import ordersRouter from './orders.router.js';
import resultsRouter from './results.router.js';
import paymentsRouter from './payments.router.js';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/patients', requireAuth, patientsRouter);
router.use('/exams', requireAuth, examsRouter);
router.use('/inventory', requireAuth, inventoryRouter);
router.use('/orders', requireAuth, ordersRouter);
router.use('/results', requireAuth, resultsRouter);
router.use('/payments', requireAuth, paymentsRouter);

export default router;
