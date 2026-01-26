import express from 'express';
import authRouter from './auth.router.js';
import patientsRouter from './patients.router.js';
import examsRouter from './exams.router.js';
import { requireAuth } from '../middleware/auth.middleware.js';

import inventoryRouter from './inventory.router.js';
import ordersRouter from './orders.router.js';
import resultsRouter from './results.router.js';
import paymentsRouter from './payments.router.js';
import dashboardRouter from './dashboard.router.js';
import usersRouter from './users.router.js';
import configRouter from './config.router.js';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/dashboard', requireAuth, dashboardRouter);
router.use('/patients', requireAuth, patientsRouter);
router.use('/exams', requireAuth, examsRouter);
router.use('/inventory', requireAuth, inventoryRouter);
router.use('/orders', requireAuth, ordersRouter);
router.use('/results', requireAuth, resultsRouter);
router.use('/payments', requireAuth, paymentsRouter);
router.use('/users', requireAuth, usersRouter);
router.use('/config', requireAuth, configRouter);

export default router;
