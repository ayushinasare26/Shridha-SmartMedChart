import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';

const router = Router();
router.use(authenticate as any);

router.get('/', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const wards = await prisma.ward.findMany({
      include: {
        _count: { select: { patients: true } },
      },
    });
    res.json(wards);
  } catch (error) { next(error); }
});

router.get('/:unit', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ward = await prisma.ward.findUnique({
      where: { unit: req.params.unit },
      include: {
        patients: {
          where: { status: 'ACTIVE' },
          include: {
            allergies: true,
            prescriptions: { where: { status: { in: ['ACTIVE', 'STAT'] } } },
          },
        },
      },
    });
    if (!ward) { res.status(404).json({ error: 'Ward not found' }); return; }
    res.json(ward);
  } catch (error) { next(error); }
});

export default router;
