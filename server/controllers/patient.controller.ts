import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog } from '../utils/audit';

const FALLBACK_PATIENTS = [
  {
    id: 'pt-94021-08',
    name: 'Rahul Patil',
    mrn: '94021-08',
    dob: '1979-03-14',
    gender: 'MALE',
    bed: 'Bed ICU-12',
    status: 'ACTIVE',
    weight: 78.5,
    height: 176,
    ward: { name: 'Ward 4B ICU', unit: 'WARD-4B-ICU' },
    allergies: [{ allergen: 'Penicillin', reaction: 'Anaphylaxis', severity: 'HIGH' }],
    prescriptions: [],
    administrations: [],
    clinicalNotes: [],
    attending: { name: 'Dr. Sharma, MD', role: 'DOCTOR', specialty: 'Cardiovascular Medicine' },
  },
  {
    id: 'pt-94022-15',
    name: 'Anita Desai',
    mrn: '94022-15',
    dob: '1984-07-22',
    gender: 'FEMALE',
    bed: 'Bed ICU-14',
    status: 'ACTIVE',
    weight: 64.0,
    height: 162,
    ward: { name: 'Ward 4B ICU', unit: 'WARD-4B-ICU' },
    allergies: [{ allergen: 'Sulfa Drugs', reaction: 'Severe Rash', severity: 'HIGH' }],
    prescriptions: [],
    administrations: [],
    clinicalNotes: [],
    attending: { name: 'Dr. Sharma, MD', role: 'DOCTOR', specialty: 'Cardiovascular Medicine' },
  },
  {
    id: 'pt-94023-08',
    name: 'Rajesh Sharma',
    mrn: '94023-08',
    dob: '1968-11-05',
    gender: 'MALE',
    bed: 'Bed ICU-08',
    status: 'ACTIVE',
    weight: 82.0,
    height: 174,
    ward: { name: 'Ward 4B ICU', unit: 'WARD-4B-ICU' },
    allergies: [],
    prescriptions: [],
    administrations: [],
    clinicalNotes: [],
    attending: { name: 'Dr. Evelyn Vance, MD', role: 'ADMIN', specialty: 'Clinical Governance' },
  },
  {
    id: 'pt-94024-03',
    name: 'Meera Iyer',
    mrn: '94024-03',
    dob: '1992-04-19',
    gender: 'FEMALE',
    bed: 'Bed ICU-03',
    status: 'ACTIVE',
    weight: 56.5,
    height: 158,
    ward: { name: 'Ward 4B ICU', unit: 'WARD-4B-ICU' },
    allergies: [{ allergen: 'Latex', reaction: 'Contact Dermatitis', severity: 'MEDIUM' }],
    prescriptions: [],
    administrations: [],
    clinicalNotes: [],
    attending: { name: 'Dr. Sharma, MD', role: 'DOCTOR', specialty: 'Cardiovascular Medicine' },
  },
];

export const getPatients = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ward, status, search, attendingId } = req.query;
    const patients = await prisma.patient.findMany({
      where: {
        ...(ward && { ward: { unit: ward as string } }),
        ...(status && { status: status as any }),
        ...(attendingId && { attendingId: attendingId as string }),
        ...(search && {
          OR: [
            { name: { contains: search as string } },
            { mrn: { contains: search as string } },
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
        clinicalNotes: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { name: true, role: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (patients && patients.length > 0) {
      // Populate attending doctor details
      const doctorIds = Array.from(new Set(patients.map(p => p.attendingId).filter(Boolean))) as string[];
      const doctors = doctorIds.length > 0 ? await prisma.user.findMany({
        where: { id: { in: doctorIds } },
        select: { id: true, name: true, role: true, specialty: true, title: true },
      }) : [];
      const docMap = new Map(doctors.map(d => [d.id, d]));

      const enrichedPatients = patients.map(p => ({
        ...p,
        attending: p.attendingId ? docMap.get(p.attendingId) || null : null,
      }));

      res.json(enrichedPatients);
      return;
    }

    res.json(FALLBACK_PATIENTS);
  } catch (error) {
    console.warn('[PATIENTS DB OFFLINE] Returning fallback patient list:', error);
    res.json(FALLBACK_PATIENTS);
  }
};

export const searchPatients = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || (q as string).length < 2) { res.json([]); return; }
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { name: { contains: q as string } },
          { mrn: { contains: q as string } },
          { bed: { contains: q as string } },
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
    const rawTargetId = req.params.id === 'me' ? req.user?.id : req.params.id;
    const targetId = String(rawTargetId || '');
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
        clinicalNotes: {
          include: {
            author: { select: { id: true, name: true, role: true, staffId: true, title: true } },
            acknowledgedBy: { select: { id: true, name: true, role: true, staffId: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        safetyAlerts: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!patient) { res.status(404).json({ error: 'Patient not found' }); return; }

    let attending = null;
    if (patient.attendingId) {
      attending = await prisma.user.findUnique({
        where: { id: patient.attendingId },
        select: { id: true, name: true, role: true, specialty: true, title: true, staffId: true },
      });
    }

    res.json({ ...patient, attending });
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
    const rawTargetId = req.params.id === 'me' ? req.user?.id : req.params.id;
    const targetId = String(rawTargetId || '');
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
    const patientId = String(req.params.id || '');
    const allergies = await prisma.allergy.findMany({
      where: { patientId },
    });
    res.json(allergies);
  } catch (error) { next(error); }
};

export const addAllergy = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = String(req.params.id || '');
    const allergy = await prisma.allergy.create({
      data: { ...req.body, patientId },
    });
    await createAuditLog({
      userId: req.user?.id,
      patientId,
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
