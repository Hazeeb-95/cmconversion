import { Router, Request, Response } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { requireRoles } from '../../../middleware/permissions';
import { RoleName, ApplicationStatus, PaymentType, PaymentMethod, PaymentClearance } from '../../../shared/constants';
import { ApplicationService } from '../services/application.service';
import { AuthenticatedRequest } from '../../../shared/types';

const router = Router();
const appService = new ApplicationService();

// List applications
router.get(
  '/app/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.FINANCIER, RoleName.TRAINER, RoleName.CM, RoleName.CCM),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const applications = await appService.listApplications(user);
    res.json({ count: applications.length, results: applications });
  },
);

// Create application
router.post(
  '/app/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.CM, RoleName.CCM),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const application = await appService.createApplication(req.body, user);
    res.status(201).json(application);
  },
);

// Get application by ID
router.get(
  '/app/:id/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.FINANCIER, RoleName.CM, RoleName.CCM),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const application = await appService.getApplication(parseInt(req.params.id, 10), user);
    res.json(application);
  },
);

// Update application (ADMIN full update, FINANCIER/TRAINER partial)
router.patch(
  '/app/:id/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.FINANCIER, RoleName.TRAINER),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const application = await appService.updateApplication(
      parseInt(req.params.id, 10),
      req.body,
      user,
    );
    res.json(application);
  },
);

// Activity logs for an application
router.get(
  '/app/logs/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN),
  async (req: Request, res: Response) => {
    const appId = req.query.applicationId
      ? parseInt(req.query.applicationId as string, 10)
      : undefined;
    const logs = await appService.getApplicationLogs(appId!);
    res.json({ count: logs.length, results: logs });
  },
);

// Application constants
router.get('/constants/', (_req, res) => {
  res.json({
    applicationStatus: Object.values(ApplicationStatus),
    paymentType: Object.values(PaymentType),
    paymentMethod: Object.values(PaymentMethod),
    paymentClearance: Object.values(PaymentClearance),
  });
});

export default router;
