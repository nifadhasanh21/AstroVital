// backend/src/routes/dashboard.routes.ts
import { Router } from 'express';
import { getDashboardData, simulateDeviceData } from '../controllers/dashboard.controller';

const router = Router();

router.get('/', getDashboardData);
router.post('/simulate', simulateDeviceData); // Test button er jonno

export default router;