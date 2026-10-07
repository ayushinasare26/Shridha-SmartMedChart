import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';

const router = Router();
router.use(authenticate as any);

router.get('/compliance', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { days = '7' } = req.query;
    const numDays = parseInt(days as string);
    const data = [];

    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);

      const [total, given, missed, delayed] = await Promise.all([
        prisma.medicationSchedule.count({ where: { scheduledTime: { gte: start, lte: end } } }),
        prisma.medicationSchedule.count({ where: { scheduledTime: { gte: start, lte: end }, status: 'GIVEN' } }),
        prisma.medicationSchedule.count({ where: { scheduledTime: { gte: start, lte: end }, status: 'MISSED' } }),
        prisma.medicationSchedule.count({ where: { scheduledTime: { gte: start, lte: end }, status: 'DELAYED' } }),
      ]);

      const compliance = total > 0 ? parseFloat(((given / total) * 100).toFixed(1)) : 0;
      data.push({
        date: start.toISOString().split('T')[0],
        compliance,
        total,
        given,
        missed,
        delayed,
      });
    }

    res.json(data);
  } catch (error) { next(error); }
});

router.get('/adr', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { days = '30' } = req.query;
    const numDays = parseInt(days as string);
    const start = new Date();
    start.setDate(start.getDate() - numDays);

    const alerts = await prisma.safetyAlert.groupBy({
      by: ['alertType', 'severity'],
      where: { createdAt: { gte: start } },
      _count: { id: true },
    });

    const byType = alerts.reduce((acc: any, a) => {
      if (!acc[a.alertType]) acc[a.alertType] = { type: a.alertType, total: 0, overridden: 0, critical: 0 };
      acc[a.alertType].total += a._count.id;
      if (a.severity === 'CRITICAL') acc[a.alertType].critical += a._count.id;
      return acc;
    }, {});

    res.json(Object.values(byType));
  } catch (error) { next(error); }
});

router.get('/administration-stats', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { days = '7' } = req.query;
    const numDays = parseInt(days as string);
    const data = [];

    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);

      const [total, barcodeScanned, fiveRightsVerified] = await Promise.all([
        prisma.administrationRecord.count({ where: { signedAt: { gte: start, lte: end } } }),
        prisma.administrationRecord.count({ where: { signedAt: { gte: start, lte: end }, barcodeScanned: true } }),
        prisma.administrationRecord.count({ where: { signedAt: { gte: start, lte: end }, fiveRightsVerified: true } }),
      ]);

      data.push({
        date: start.toISOString().split('T')[0],
        total,
        barcodeScanned,
        fiveRightsVerified,
        barcodeScanRate: total > 0 ? parseFloat(((barcodeScanned / total) * 100).toFixed(1)) : 0,
      });
    }

    res.json(data);
  } catch (error) { next(error); }
});

export default router;
