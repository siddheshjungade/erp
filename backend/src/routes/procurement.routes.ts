import { Router } from 'express';
import { ProcurementController } from '../controllers/procurement.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/purchase', authMiddleware, ProcurementController.registerPurchase);

export default router;
