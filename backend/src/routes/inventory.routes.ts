import { Hono } from 'hono';
import { InventoryController } from '../controllers/inventory.controller';
import { authMiddleware, Env } from '../middleware/auth.middleware';

const router = new Hono<Env>();

router.get('/', authMiddleware, InventoryController.getInventory);
router.post('/', authMiddleware, InventoryController.createInventoryItem);

export default router;
