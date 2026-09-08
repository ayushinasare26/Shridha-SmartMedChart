import { Router } from 'express';
import * as noteController from '../controllers/note.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate as any);

router.get('/', noteController.getNotes);
router.post('/', authorize('DOCTOR', 'NURSE', 'ADMIN') as any, noteController.createNote);
router.patch('/:id/acknowledge', authorize('DOCTOR', 'ADMIN') as any, noteController.acknowledgeNote);

export default router;
