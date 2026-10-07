import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';

const router = Router();
router.use(authenticate as any);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { patientId, userId, action, severity, from, to, limit } = req.query;
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(patientId && { patientId: patientId as string }),
        ...(userId && { userId: userId as string }),
        ...(action && { action: { contains: action as string } }),
        ...(severity && { severity: severity as string }),
        ...(from && to && {
          createdAt: { gte: new Date(from as string), lte: new Date(to as string) },
        }),
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
        patient: { select: { id: true, name: true, mrn: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt((limit as string) || '100'),
    });
    res.json(logs);
  } catch (error) { next(error); }
});

export default router;
