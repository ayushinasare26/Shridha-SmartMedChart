import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';
import { createAuditLog } from '../utils/audit';

const router = Router();
router.use(authenticate as any);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { patientId, isResolved } = req.query;
    const alerts = await prisma.safetyAlert.findMany({
      where: {
        ...(patientId && { patientId: patientId as string }),
        ...(isResolved !== undefined && { isResolved: isResolved === 'true' }),
      },
      include: {
        patient: { select: { id: true, name: true, mrn: true, bed: true } },
        prescription: { select: { id: true, medicationName: true } },
        overrideBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(alerts);
  } catch (error) { next(error); }
});

router.post('/:id/override', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { overrideReason } = req.body;
    const alert = await prisma.safetyAlert.update({
      where: { id: req.params.id },
      data: {
        isOverridden: true,
        isResolved: true,
        overrideById: req.user?.id,
        overrideReason,
        overriddenAt: new Date(),
        resolvedAt: new Date(),
      },
    });
    await createAuditLog({
      userId: req.user?.id,
      patientId: alert.patientId,
      action: 'ALERT_OVERRIDDEN',
      resource: 'SafetyAlert',
      resourceId: alert.id,
      detail: `${alert.alertType} overridden: ${overrideReason}`,
      req: req as any,
      severity: 'STAT',
    });
    res.json(alert);
  } catch (error) { next(error); }
});

router.patch('/:id/resolve', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const alert = await prisma.safetyAlert.update({
      where: { id: req.params.id },
      data: { isResolved: true, resolvedAt: new Date() },
    });
    res.json(alert);
  } catch (error) { next(error); }
});

export default router;
