import { Hono } from 'hono';
import { LeadsController } from '../controllers/leads.controller';
import { authMiddleware, Env } from '../middleware/auth.middleware';

const router = new Hono<Env>();

router.get('/', authMiddleware, LeadsController.getLeads);
router.post('/', authMiddleware, LeadsController.createLead);

export default router;
