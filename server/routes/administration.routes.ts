import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';

const router = Router();
router.use(authenticate as any);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.query;
    const records = await prisma.administrationRecord.findMany({
      where: { ...(patientId && { patientId: patientId as string }) },
      include: {
        administeredBy: { select: { id: true, name: true, role: true } },
        witness: { select: { id: true, name: true } },
        schedule: {
          include: {
            prescription: { select: { medicationName: true, dose: true, unit: true, route: true } },
          },
        },
      },
      orderBy: { signedAt: 'desc' },
      take: 50,
    });
    res.json(records);
  } catch (error) { next(error); }
});

export default router;
