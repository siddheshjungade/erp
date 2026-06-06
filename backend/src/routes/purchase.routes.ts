import { Router } from 'express';
import { ProcurementController } from '../controllers/procurement.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, ProcurementController.registerPurchaseOrder);

export default router;
