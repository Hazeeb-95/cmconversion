import { Router, Request, Response } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { requireRoles } from '../../../middleware/permissions';
import { RoleName } from '../../../shared/constants';
import { CoreService } from '../services/core.service';
import { ActivityService } from '../services/activity.service';

const router = Router();
const coreService = new CoreService();
const activityService = new ActivityService();

// All app constants (public or authenticated)
router.get('/app/meta/constants/', (_req: Request, res: Response) => {
  res.json(coreService.getConstants());
});

// Send HTML email (admin only)
router.post(
  '/app/mail/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN),
  async (req: Request, res: Response) => {
    const { to, subject, html } = req.body;
    await coreService.sendHtmlMail(to, subject, html);
    res.json({ detail: 'Email sent.' });
  },
);

// Activity logs (admin only)
router.get(
  '/app/logs/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN),
  async (req: Request, res: Response) => {
    const { objectType, objectId, actorId } = req.query;
    const logs = await activityService.getLogs(
      objectType as string | undefined,
      objectId ? parseInt(objectId as string, 10) : undefined,
      actorId ? parseInt(actorId as string, 10) : undefined,
    );
    res.json({ count: logs.length, results: logs });
  },
);

export default router;
