import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../../middleware/auth';
import { requireRoles } from '../../../middleware/permissions';
import { RoleName } from '../../../shared/constants';
import {
  loginHandler,
  refreshTokenHandler,
  sendPhoneOtpHandler,
  verifyPhoneOtpHandler,
  firebaseLoginHandler,
  acceptInviteHandler,
  resendInviteHandler,
  sendBatchInvitesHandler,
  getMeHandler,
} from '../controllers/auth.controller';
import {
  listUsersHandler,
  getUserHandler,
  createUserHandler,
  updateUserHandler,
} from '../controllers/user.controller';
import {
  listRegionsHandler,
  getRegionHandler,
  createRegionHandler,
  updateRegionHandler,
} from '../controllers/region.controller';

const router = Router();

const resendInviteRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { detail: 'Too many requests. Please wait before trying again.' },
  keyGenerator: (req) => req.ip ?? 'unknown',
});

// Auth
router.post('/auth/login/', loginHandler);
router.post('/auth/token/refresh/', refreshTokenHandler);
router.post('/auth/phone/otp/send/', sendPhoneOtpHandler);
router.post('/auth/phone/otp/verify/', verifyPhoneOtpHandler);
router.post('/firebase/login/', firebaseLoginHandler);
router.get('/me/', requireAuth, getMeHandler);

// Invitations
router.post(
  '/invite/send/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN),
  sendBatchInvitesHandler,
);
router.post('/invite/resend/', resendInviteRateLimit, resendInviteHandler);
router.post('/invite/accept/', acceptInviteHandler);

// Users
router.get(
  '/users/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.TRAINER),
  listUsersHandler,
);
router.post(
  '/users/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN),
  createUserHandler,
);
router.get(
  '/users/:id/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.TRAINER),
  getUserHandler,
);
router.patch(
  '/users/:id/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN),
  updateUserHandler,
);

// Regions
router.get(
  '/regions/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN),
  listRegionsHandler,
);
router.post(
  '/regions/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN),
  createRegionHandler,
);
router.get(
  '/regions/:id/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN),
  getRegionHandler,
);
router.patch(
  '/regions/:id/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN),
  updateRegionHandler,
);

export default router;
