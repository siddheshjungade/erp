import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/google', AuthController.login);
router.get('/google/callback', AuthController.callback);
router.get('/callback', AuthController.callback);
router.get('/me', authMiddleware, AuthController.getMe);
router.post('/initialize', authMiddleware, AuthController.initializeSheet);
router.post('/logout', AuthController.logout);

export default router;
