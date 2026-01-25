import { Router } from 'express';
import authRouter from './auth.router.js';
import patientsRouter from './patients.router.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/patients', patientsRouter);

export default router;
