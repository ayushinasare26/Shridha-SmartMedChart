import { Router } from 'express';
import * as prescriptionController from '../controllers/prescription.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate as any);

router.get('/', prescriptionController.getPrescriptions);
router.get('/:id', prescriptionController.getPrescription);
router.post('/', authorize('DOCTOR') as any, prescriptionController.createPrescription);
router.patch('/:id', authorize('DOCTOR', 'PHARMACIST') as any, prescriptionController.updatePrescription);
router.post('/:id/sign', authorize('DOCTOR') as any, prescriptionController.signPrescription);
router.post('/:id/override', authorize('DOCTOR') as any, prescriptionController.overridePrescription);
router.post('/:id/hold', authorize('DOCTOR', 'NURSE', 'PHARMACIST') as any, prescriptionController.holdPrescription);
router.post('/:id/discontinue', authorize('DOCTOR') as any, prescriptionController.discontinuePrescription);
router.post('/:id/pharmacy-verify', authorize('PHARMACIST') as any, prescriptionController.pharmacyVerify);

export default router;
