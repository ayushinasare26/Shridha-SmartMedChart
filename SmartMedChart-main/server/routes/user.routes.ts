import { Router, Response, NextFunction } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';
import { createAuditLog } from '../utils/audit';

const router = Router();
router.use(authenticate as any);

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
    res.json(users);
  } catch (error) {
    next(error);
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

// POST /api/users/shifts/conclude — Conclude a shift, deactivating all doctors and nurses on that shift
router.post('/shifts/conclude', authorize('ADMIN') as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { shiftType } = req.body; // 'MORNING', 'ROTATING', 'NIGHT', or 'ALL'
    const whereClause: any = {
      role: { in: ['DOCTOR', 'NURSE'] },
    };
    if (shiftType && shiftType !== 'ALL') {
      whereClause.shiftType = shiftType;
    }

    const updated = await prisma.user.updateMany({
      where: whereClause,
      data: { onDuty: false },
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'SHIFT_CONCLUDED',
      resource: 'Shift',
      detail: `Admin ${req.user?.name} concluded ${shiftType || 'ALL'} shift. ${updated.count} clinicians marked DEACTIVATED (Shift Over).`,
      req: req as any,
    });

    res.json({ success: true, count: updated.count, shiftType: shiftType || 'ALL' });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/shifts/start — Activate all doctors and nurses on a shift
router.post('/shifts/start', authorize('ADMIN') as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { shiftType } = req.body; // 'MORNING', 'ROTATING', 'NIGHT'
    const whereClause: any = {
      role: { in: ['DOCTOR', 'NURSE'] },
    };
    if (shiftType && shiftType !== 'ALL') {
      whereClause.shiftType = shiftType;
    }

    const updated = await prisma.user.updateMany({
      where: whereClause,
      data: { onDuty: true },
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'SHIFT_ACTIVATED',
      resource: 'Shift',
      detail: `Admin ${req.user?.name} activated ${shiftType || 'ALL'} shift. ${updated.count} clinicians marked ACTIVE (On-Duty).`,
      req: req as any,
    });

    res.json({ success: true, count: updated.count, shiftType: shiftType || 'ALL' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id/shift — Reassign clinician shift, ward, and status
router.patch('/:id/shift', authorize('ADMIN') as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { shiftType, onDuty, ward, notes } = req.body;
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Staff member not found' });
      return;
    }

    const dataToUpdate: any = {};
    if (shiftType !== undefined) dataToUpdate.shiftType = shiftType;
    if (onDuty !== undefined) dataToUpdate.onDuty = Boolean(onDuty);
    if (ward !== undefined) dataToUpdate.ward = ward;

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        role: true,
        staffId: true,
        shiftType: true,
        onDuty: true,
        ward: true,
        department: true,
        title: true,
        specialty: true,
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'SHIFT_REASSIGNED',
      resource: 'User',
      resourceId: updated.id,
      detail: `${updated.name} (${updated.role}) shift set to ${updated.shiftType} & status ${updated.onDuty ? 'ACTIVE (On-Duty)' : 'DEACTIVATED (Shift Over)'}${notes ? ` [Handover Notes: ${notes}]` : ''}`,
      req: req as any,
    });

    res.json(updated);
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
