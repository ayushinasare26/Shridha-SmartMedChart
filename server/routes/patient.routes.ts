import { Router } from 'express';
import * as patientController from '../controllers/patient.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.get('/', patientController.getPatients);
router.get('/search', patientController.searchPatients);
router.get('/:id', patientController.getPatient);
router.post('/', authorize('DOCTOR', 'ADMIN') as any, patientController.createPatient);
router.patch('/:id', authorize('DOCTOR', 'NURSE', 'ADMIN', 'PATIENT') as any, patientController.updatePatient);
router.get('/:id/allergies', patientController.getPatientAllergies);
router.post('/:id/allergies', authorize('DOCTOR', 'PHARMACIST') as any, patientController.addAllergy);

export default router;
