import { Hono } from 'hono';
import { ProcurementController } from '../controllers/procurement.controller';
import { authMiddleware, Env } from '../middleware/auth.middleware';

const router = new Hono<Env>();

router.post('/', authMiddleware, ProcurementController.registerPurchaseOrder);

export default router;
