import express from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/', dashboardController.getDashboardData);

export default router;
