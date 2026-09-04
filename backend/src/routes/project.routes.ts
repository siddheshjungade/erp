import { Hono } from 'hono';
import { ProjectController } from '../controllers/project.controller';
import { authMiddleware, Env } from '../middleware/auth.middleware';

const router = new Hono<Env>();

router.post('/', authMiddleware, ProjectController.createProject);
router.get('/', authMiddleware, ProjectController.getProjects);
router.get('/dispatches', authMiddleware, ProjectController.getDispatches);
router.post('/dispatch', authMiddleware, ProjectController.dispatchMaterial);
router.post('/allocate', authMiddleware, ProjectController.allocateMaterial);

export default router;
