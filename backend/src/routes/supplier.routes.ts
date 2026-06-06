import { Router } from 'express';
import { SupplierController } from '../controllers/supplier.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, SupplierController.getSuppliers);
router.post('/', authMiddleware, SupplierController.createSupplier);

export default router;
