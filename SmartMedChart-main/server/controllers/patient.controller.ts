import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog } from '../utils/audit';

export const getPatients = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ward, status, search } = req.query;
    const patients = await prisma.patient.findMany({
      where: {
        ...(ward && { ward: { unit: ward as string } }),
        ...(status && { status: status as any }),
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { mrn: { contains: search as string, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        allergies: true,
        ward: true,
        prescriptions: {
          where: { status: { in: ['ACTIVE', 'STAT'] } },
          include: { prescriber: { select: { name: true } } },
        },
        administrations: {
          take: 1,
          orderBy: { signedAt: 'desc' },
          include: {
            administeredBy: { select: { name: true, role: true } },
            schedule: {
              include: {
                prescription: { select: { medicationName: true } },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(patients);
  } catch (error) { next(error); }
};

export const searchPatients = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || (q as string).length < 2) { res.json([]); return; }
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { name: { contains: q as string, mode: 'insensitive' } },
          { mrn: { contains: q as string, mode: 'insensitive' } },
          { bed: { contains: q as string, mode: 'insensitive' } },
        ],
      },
      include: { ward: true, allergies: true },
      take: 10,
    });
    res.json(patients);
  } catch (error) { next(error); }
};

export const getPatient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetId = req.params.id === 'me' ? req.user?.id : req.params.id;
    if (!targetId) {
      res.status(400).json({ error: 'Patient ID required' });
      return;
    }

    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { id: targetId },
          { mrn: targetId },
        ],
      },
      include: {
        allergies: true,
        ward: true,
        prescriptions: {
          include: {
            prescriber: { select: { id: true, name: true, role: true } },
            schedules: {
              where: { status: { in: ['PENDING', 'GIVEN', 'HELD', 'DELAYED'] } },
              include: {
                administeredBy: { select: { id: true, name: true, role: true, staffId: true } },
                administrationRecord: {
                  include: {
                    administeredBy: { select: { id: true, name: true, role: true, staffId: true } },
                  },
                },
              },
              orderBy: { scheduledTime: 'asc' },
              take: 25,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        administrations: {
          include: {
            administeredBy: { select: { id: true, name: true, role: true, staffId: true } },
            schedule: {
              include: {
                prescription: { select: { medicationName: true, dose: true, unit: true, route: true } },
              },
            },
          },
          orderBy: { signedAt: 'desc' },
          take: 20,
        },
        safetyAlerts: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!patient) { res.status(404).json({ error: 'Patient not found' }); return; }
    res.json(patient);
  } catch (error) { next(error); }
};

export const createPatient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      mrn,
      dob,
      sex,
      weight,
      weightUnit,
      bed,
      admissionDiagnosis,
      codeStatus,
      npoStatus,
      isolationStatus,
      status,
      wardId,
      wardUnit,
      allergy,
      emergencyContactName,
      emergencyContactRelation,
      emergencyContactPhone,
    } = req.body;

    if (!name || !mrn) {
      res.status(400).json({ error: 'Patient name and MRN are required.' });
      return;
    }

    // Check duplicate MRN
    const existingPatient = await prisma.patient.findUnique({ where: { mrn } });
    if (existingPatient) {
      res.status(400).json({ error: `A patient with MRN ${mrn} is already admitted (${existingPatient.name}).` });
      return;
    }

    // Find ward if wardId not provided
    let targetWardId = wardId;
    if (!targetWardId) {
      const defaultWard = await prisma.ward.findFirst({
        where: { unit: wardUnit || 'WARD-4B-ICU' }
      });
      if (defaultWard) {
        targetWardId = defaultWard.id;
      }
    }

    // Parse DOB to Date
    const parsedDob = dob ? new Date(dob) : new Date('1980-01-01');

    // Create patient
    const patient = await prisma.patient.create({
      data: {
        name,
        mrn,
        dob: parsedDob,
        sex: sex || 'Male',
        weight: typeof weight === 'number' ? weight : (parseFloat(weight) || 72),
        weightUnit: weightUnit || 'kg',
        bed: bed || 'ICU-15',
        admissionDiagnosis: admissionDiagnosis || 'Acute Inpatient Care',
        codeStatus: codeStatus || 'Full',
        npoStatus: Boolean(npoStatus),
        isolationStatus: Boolean(isolationStatus),
        status: status || 'ACTIVE',
        ...(targetWardId && { wardId: targetWardId }),
        ...(emergencyContactName && { emergencyContactName }),
        ...(emergencyContactRelation && { emergencyContactRelation }),
        ...(emergencyContactPhone && { emergencyContactPhone }),
      },
    });

    // If an allergy was specified and not NKDA, add it
    if (allergy && typeof allergy === 'string' && !allergy.toUpperCase().includes('NKDA') && !allergy.toUpperCase().includes('NO KNOWN')) {
      await prisma.allergy.create({
        data: {
          patientId: patient.id,
          allergen: allergy,
          severity: 'Moderate',
          reaction: 'Documented on admission',
        }
      }).catch(() => {});
    }

    // Update ward occupancy if wardId present
    if (targetWardId) {
      await prisma.ward.update({
        where: { id: targetWardId },
        data: { occupancy: { increment: 1 } },
      }).catch(() => {});
    }

    await createAuditLog({
      userId: req.user?.id,
      patientId: patient.id,
      action: 'PATIENT_CREATED',
      resource: 'Patient',
      resourceId: patient.id,
      detail: `Patient ${patient.name} (MRN: ${patient.mrn}, Bed: ${patient.bed}) admitted`,
      req: req as any,
    });

    res.status(201).json(patient);
  } catch (error) { next(error); }
};

export const updatePatient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetId = req.params.id === 'me' ? req.user?.id : req.params.id;
    if (!targetId) {
      res.status(400).json({ error: 'Patient ID required' });
      return;
    }

    if (req.user?.role === 'PATIENT' && req.user?.id !== targetId) {
      res.status(403).json({ error: 'Patients can only update their own records' });
      return;
    }

    // If patient role, whitelist allowed editable fields
    let updateData = req.body;
    if (req.user?.role === 'PATIENT') {
      updateData = {
        ...(req.body.emergencyContactName !== undefined && { emergencyContactName: req.body.emergencyContactName }),
        ...(req.body.emergencyContactRelation !== undefined && { emergencyContactRelation: req.body.emergencyContactRelation }),
        ...(req.body.emergencyContactPhone !== undefined && { emergencyContactPhone: req.body.emergencyContactPhone }),
      };
    }

    const patient = await prisma.patient.update({
      where: { id: targetId },
      data: updateData,
    });

    const isContactUpdate = Boolean(req.body.emergencyContactPhone || req.body.emergencyContactName);
    await createAuditLog({
      userId: req.user?.id,
      patientId: patient.id,
      action: isContactUpdate ? 'EMERGENCY_CONTACT_UPDATED' : 'PATIENT_UPDATED',
      resource: 'Patient',
      resourceId: patient.id,
      detail: isContactUpdate
        ? `Emergency contact updated for ${patient.name}: ${patient.emergencyContactName || 'N/A'} (${patient.emergencyContactPhone || 'N/A'})`
        : `Patient record updated`,
      req: req as any,
    });
    res.json(patient);
  } catch (error) { next(error); }
};

export const getPatientAllergies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allergies = await prisma.allergy.findMany({
      where: { patientId: req.params.id },
    });
    res.json(allergies);
  } catch (error) { next(error); }
};

export const addAllergy = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allergy = await prisma.allergy.create({
      data: { ...req.body, patientId: req.params.id },
    });
    await createAuditLog({
      userId: req.user?.id,
      patientId: req.params.id,
      action: 'ALLERGY_ADDED',
      resource: 'Allergy',
      resourceId: allergy.id,
      detail: `Allergy to ${allergy.allergen} documented`,
      req: req as any,
      severity: 'Warning',
    });
    res.status(201).json(allergy);
  } catch (error) { next(error); }
};

export const deletePatient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.administrationRecord.deleteMany({ where: { patientId: id } });
      await tx.medicationSchedule.deleteMany({ where: { patientId: id } });
      await tx.safetyAlert.deleteMany({ where: { patientId: id } });
      await tx.prescription.deleteMany({ where: { patientId: id } });
      await tx.allergy.deleteMany({ where: { patientId: id } });
      await tx.notification.deleteMany({ where: { patientId: id } });
      await tx.auditLog.updateMany({ where: { patientId: id }, data: { patientId: null } });
      if (patient.wardId) {
        await tx.ward.update({
          where: { id: patient.wardId },
          data: { occupancy: { decrement: 1 } },
        }).catch(() => {});
      }
      await tx.patient.delete({ where: { id } });
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'PATIENT_DISCHARGED_REMOVED',
      resource: 'Patient',
      resourceId: id,
      detail: `Patient ${patient.name} (MRN: ${patient.mrn}, Bed: ${patient.bed || 'N/A'}) discharged and removed from system`,
      req: req as any,
    });

    res.json({ message: `Patient ${patient.name} successfully removed.`, id });
  } catch (error) { next(error); }
};

export const purgeAllPatients = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.administrationRecord.deleteMany();
      await tx.medicationSchedule.deleteMany();
      await tx.safetyAlert.deleteMany();
      await tx.prescription.deleteMany();
      await tx.allergy.deleteMany();
      await tx.notification.deleteMany();
      await tx.auditLog.updateMany({ data: { patientId: null } });
      await tx.patient.deleteMany();
      await tx.ward.updateMany({ data: { occupancy: 0 } });
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'ALL_PATIENTS_PURGED',
      resource: 'Patient',
      detail: 'All test/dummy patients purged by administrator for real clinical data testing',
      req: req as any,
      severity: 'Warning',
    });

    res.json({ message: 'All dummy patient data has been purged. All beds are now available.' });
  } catch (error) { next(error); }
};

