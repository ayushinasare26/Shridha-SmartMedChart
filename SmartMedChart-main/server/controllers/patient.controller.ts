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

    // Enforce privacy for hospital staff (allied & support staff cannot see vitals or medical problems)
    if (req.user?.role === 'ALLIED_STAFF' || req.user?.role === 'OTHER_STAFF') {
      const sanitized = patients.map(p => ({
        id: p.id,
        name: p.name,
        mrn: p.mrn,
        bed: p.bed,
        status: p.status,
        ward: p.ward,
        wardId: p.wardId,
        attendingId: p.attendingId,
        emergencyContactName: p.emergencyContactName,
        emergencyContactRelation: p.emergencyContactRelation,
        emergencyContactPhone: p.emergencyContactPhone,
        // Conceal clinical problems, diagnoses, and vitals from hospital staff
        admissionDiagnosis: null,
        allergies: [],
        prescriptions: [],
        administrations: [],
        eGFR: null,
        creatinine: null,
        bilirubin: null,
        platelets: null,
        codeStatus: null,
        npoStatus: false,
        isolationStatus: false,
      }));
      res.json(sanitized);
      return;
    }

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

    if (req.user?.role === 'ALLIED_STAFF' || req.user?.role === 'OTHER_STAFF') {
      const sanitized = patients.map(p => ({
        id: p.id,
        name: p.name,
        mrn: p.mrn,
        bed: p.bed,
        ward: p.ward,
        admissionDiagnosis: null,
        allergies: [],
      }));
      res.json(sanitized);
      return;
    }

    res.json(patients);
  } catch (error) { next(error); }
};

export const getPatient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Prevent hospital staff from accessing confidential clinical medical charts, vitals, or diagnoses
    if (req.user?.role === 'ALLIED_STAFF' || req.user?.role === 'OTHER_STAFF') {
      res.status(403).json({ error: 'Access denied: Hospital staff cannot view confidential clinical charts, vitals, or medical problems.' });
      return;
    }

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
    const patient = await prisma.patient.create({ data: req.body });
    await createAuditLog({
      userId: req.user?.id,
      patientId: patient.id,
      action: 'PATIENT_CREATED',
      resource: 'Patient',
      resourceId: patient.id,
      detail: `Patient ${patient.name} (MRN: ${patient.mrn}) admitted`,
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
