import { Router } from 'express';
import * as scheduleController from '../controllers/schedule.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate as any);

router.get('/', scheduleController.getSchedules);
router.get('/ward', scheduleController.getWardSchedule);
router.get('/:id', scheduleController.getSchedule);
router.post('/administer', authorize('NURSE', 'DOCTOR', 'ADMIN') as any, scheduleController.administerMedication);
router.patch('/:id/hold', authorize('NURSE', 'DOCTOR', 'PHARMACIST') as any, scheduleController.holdSchedule);
router.patch('/:id/delay', authorize('NURSE') as any, scheduleController.delaySchedule);

export default router;
