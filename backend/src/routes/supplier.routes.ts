import { Hono } from 'hono';
import { SupplierController } from '../controllers/supplier.controller';
import { authMiddleware, Env } from '../middleware/auth.middleware';

const router = new Hono<Env>();

router.get('/', authMiddleware, SupplierController.getSuppliers);
router.post('/', authMiddleware, SupplierController.createSupplier);

export default router;
