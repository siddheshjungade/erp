import { Router } from 'express';
import { LeadsController } from '../controllers/leads.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, LeadsController.getLeads);
router.post('/', authMiddleware, LeadsController.createLead);

export default router;
