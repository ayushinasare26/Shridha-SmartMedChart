import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/impersonate', authController.impersonate);
router.get('/me', authController.getMe);

export default router;
