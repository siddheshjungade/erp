import { Hono } from 'hono';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware, Env } from '../middleware/auth.middleware';

const router = new Hono<Env>();

router.get('/google', AuthController.login);
router.get('/google/callback', AuthController.callback);
router.get('/callback', AuthController.callback);
router.get('/me', authMiddleware, AuthController.getMe);
router.post('/initialize', authMiddleware, AuthController.initializeSheet);
router.post('/logout', AuthController.logout);

export default router;
