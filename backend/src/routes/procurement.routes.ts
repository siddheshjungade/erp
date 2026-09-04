import { Hono } from 'hono';
import { ProcurementController } from '../controllers/procurement.controller';
import { authMiddleware, Env } from '../middleware/auth.middleware';

const router = new Hono<Env>();

router.post('/purchase', authMiddleware, ProcurementController.registerPurchase);

export default router;
