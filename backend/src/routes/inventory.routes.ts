import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, InventoryController.getInventory);
router.post('/', authMiddleware, InventoryController.createInventoryItem);

export default router;
