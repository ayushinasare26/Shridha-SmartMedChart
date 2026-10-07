import { Router, Response, NextFunction } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';
import { createAuditLog } from '../utils/audit';

const router = Router();
router.use(authenticate as any);

const FALLBACK_USERS = [
  {
    id: 'efa0f6af-8305-4237-b501-ab8a08f45ba2',
    name: 'Dr. Evelyn Vance, MD',
    email: 'evelyn.vance@metrohealth.org',
    role: 'ADMIN',
    staffId: 'ADM-9001',
    ward: 'Executive Suite - Governance',
    department: 'Clinical Governance & Healthcare Administration',
    title: 'Lead Hospital Administrator',
    specialty: 'Clinical Governance & Healthcare Administration',
    licenseNumber: 'MD-ADM-9001',
    shiftType: 'MORNING',
    onDuty: true,
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'adm-1002-hastings',
    name: 'Arthur Hastings, MBA',
    email: 'arthur.hastings@metrohealth.org',
    role: 'ADMIN',
    staffId: 'ADM-1002',
    ward: 'Hospital Operations Bureau',
    department: 'Hospital Operations & Staffing Bureau',
    title: 'Director of Hospital Operations',
    specialty: 'Staffing Logistics & Inpatient Flow',
    shiftType: 'MORNING',
    onDuty: true,
    isActive: true,
  },
  {
    id: 'doc-84729-sharma',
    name: 'Dr. Sharma, MD',
    email: 'sharma.md@metrohealth.org',
    role: 'DOCTOR',
    staffId: 'DOC-84729',
    ward: 'Ward 4B ICU',
    department: 'Cardiology & Intensive Care',
    title: 'Attending Intensivist',
    specialty: 'Cardiovascular Medicine',
    licenseNumber: 'MD-84729-US',
    shiftType: 'MORNING',
    onDuty: true,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'rn-88219-priya',
    name: 'Nurse Priya, RN',
    email: 'priya.rn@metrohealth.org',
    role: 'NURSE',
    staffId: 'RN-88219',
    ward: 'Ward 4B ICU',
    department: 'Acute Inpatient Care',
    title: 'Primary Bedside BSN',
    specialty: 'Critical Care Nursing',
    licenseNumber: 'RN-88219-US',
    shiftType: 'MORNING',
    onDuty: true,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813585-613d90610332?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'ph-31405-dave',
    name: 'Pharm. Dave',
    email: 'dave.pharm@metrohealth.org',
    role: 'PHARMACIST',
    staffId: 'PH-31405',
    ward: 'Central Pharmacy',
    department: 'Clinical Pharmacy',
    title: 'Clinical Pharmacist',
    specialty: 'Pharmacotherapy & Medication Safety',
    licenseNumber: 'RPH-31405-US',
    shiftType: 'MORNING',
    onDuty: true,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'rec-101-priya',
    name: 'Priya Sen, Receptionist',
    email: 'priya.sen@metrohealth.org',
    role: 'RECEPTIONIST',
    staffId: 'REC-101',
    ward: 'Admissions & Front Desk',
    department: 'Front Desk Admissions',
    title: 'Front Desk Admissions Officer',
    shiftType: 'MORNING',
    onDuty: true,
    isActive: true,
  },
  {
    id: 'lt-44201-mehta',
    name: 'Arjun Mehta, MLS',
    email: 'arjun.mehta@metrohealth.org',
    role: 'ALLIED_STAFF',
    staffId: 'LT-44201',
    ward: 'Central Pathology & Blood Bank',
    department: 'Central Pathology & Blood Bank',
    title: 'Senior Medical Lab Technologist',
    specialty: 'Diagnostic Hematology & Cross-matching',
    licenseNumber: 'MLS-44201-ASCP',
    shiftType: 'MORNING',
    onDuty: true,
    isActive: true,
  },
  {
    id: 'rt-55102-sharma',
    name: 'Pooja Sharma, RT(R)',
    email: 'pooja.sharma@metrohealth.org',
    role: 'ALLIED_STAFF',
    staffId: 'RT-55102',
    ward: 'Diagnostic Radiology & CT Imaging',
    department: 'Diagnostic Radiology & CT Imaging',
    title: 'Lead Radiologic Technologist',
    specialty: 'Bedside Mobile X-Ray & CT Imaging',
    licenseNumber: 'ARRT-55102',
    shiftType: 'MORNING',
    onDuty: true,
    isActive: true,
  },
];

// GET /api/users — List all hospital personnel
router.get('/', authorize('ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST') as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        staffId: true,
        ward: true,
        department: true,
        title: true,
        specialty: true,
        licenseNumber: true,
        shiftType: true,
        onDuty: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    });
    if (users && users.length > 0) {
      res.json(users);
      return;
    }
    res.json(FALLBACK_USERS);
  } catch (error) {
    console.warn('[USERS DB OFFLINE] Returning fallback staff list:', error);
    res.json(FALLBACK_USERS);
  }
});

// POST /api/users — Enroll new physician, nurse, pharmacist, or allied staff
router.post('/', authorize('ADMIN') as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bcrypt = await import('bcryptjs');
    const {
      email,
      name,
      role = 'DOCTOR',
      password = 'SmartMed@2024',
      staffId: customStaffId,
      ward = 'Ward 4B ICU',
      department,
      title,
      specialty,
      licenseNumber,
      shiftType = 'MORNING',
      onDuty = true,
      avatarUrl,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Staff member name is required' });
      return;
    }

    // Auto-generate staff ID if not provided
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const prefix =
      role === 'DOCTOR' ? 'DOC' :
      role === 'NURSE' ? 'RN' :
      role === 'PHARMACIST' ? 'PH' :
      role === 'ADMIN' ? 'ADM' : 'LT';
    const staffId = customStaffId || `${prefix}-${randomSuffix}`;

    // Auto-generate unique email if not provided
    const generatedEmail = email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@metrohealth.org`;

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: generatedEmail.toLowerCase(),
        name,
        role,
        passwordHash,
        staffId,
        ward,
        department: department || specialty || `${role} Clinical Services`,
        title,
        specialty,
        licenseNumber,
        shiftType,
        onDuty: Boolean(onDuty),
        avatarUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        staffId: true,
        ward: true,
        department: true,
        title: true,
        specialty: true,
        licenseNumber: true,
        shiftType: true,
        onDuty: true,
        avatarUrl: true,
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'STAFF_ENROLLED',
      resource: 'User',
      resourceId: user.id,
      detail: `Admin ${req.user?.name} enrolled ${user.name} (${user.role} - ${user.staffId})`,
      req: req as any,
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id/duty — Toggle clinician on-duty status
router.patch('/:id/duty', authorize('ADMIN') as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Staff member not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { onDuty: !existing.onDuty },
      select: { id: true, name: true, role: true, staffId: true, onDuty: true },
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'DUTY_TOGGLED',
      resource: 'User',
      resourceId: updated.id,
      detail: `${updated.name} duty status toggled to ${updated.onDuty ? 'ON DUTY' : 'OFF DUTY'}`,
      req: req as any,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id — Edit staff credentials or details
router.patch('/:id', authorize('ADMIN') as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { password, ...rest } = req.body;
    const data: any = { ...rest };
    if (password) {
      const bcrypt = await import('bcryptjs');
      data.passwordHash = await bcrypt.hash(password, 12);
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        staffId: true,
        ward: true,
        department: true,
        title: true,
        specialty: true,
        licenseNumber: true,
        shiftType: true,
        onDuty: true,
        isActive: true,
      },
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
