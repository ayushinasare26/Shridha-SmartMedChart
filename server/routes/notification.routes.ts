import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';

const router = Router();
router.use(authenticate as any);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      include: { patient: { select: { id: true, name: true, mrn: true, bed: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error) { next(error); }
});

router.patch('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id, userId: req.user!.id },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (error) { next(error); }
});

router.patch('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) { next(error); }
});

export default router;
