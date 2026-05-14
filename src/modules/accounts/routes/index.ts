import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../../middleware/auth';
import { requireRoles } from '../../../middleware/permissions';
import { RoleName } from '../../../shared/constants';
import {
  // Flow 1 — Firebase (CM/CCM)
  firebaseSignupHandler,
  firebaseLoginHandler,
  // Flow 2 — JWT (Super Admin + invited users)
  registerSuperAdminHandler,
  loginHandler,
  refreshTokenHandler,
  // Flow 3 — Invitation (ADMIN / TRAINER / FINANCIER)
  sendBatchInvitesHandler,
  acceptInviteHandler,
  resendInviteHandler,
  // OTP
  sendPhoneOtpHandler,
  verifyPhoneOtpHandler,
  // Profile
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

// ── Rate limiters ─────────────────────────────────────────────────────────

const resendInviteLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { detail: 'Too many requests. Please wait before trying again.' },
  keyGenerator: (req) => req.ip ?? 'unknown',
});

const otpLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { detail: 'Too many OTP requests. Please wait 5 minutes.' },
  keyGenerator: (req) => req.ip ?? 'unknown',
});

const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { detail: 'Too many login attempts. Please try again later.' },
  keyGenerator: (req) => req.ip ?? 'unknown',
});

// ── Flow 1: CM / CCM — Firebase ──────────────────────────────────────────
// Mobile users sign up / log in via Firebase Phone Auth.

router.post('/auth/firebase/signup/', firebaseSignupHandler);   // new CM/CCM account
router.post('/firebase/login/', loginLimit, firebaseLoginHandler);         // existing CM/CCM login

// ── Flow 2: JWT — Super Admin & invited-user login ────────────────────────

router.post('/auth/super-admin/register/', registerSuperAdminHandler); // one-time setup
router.post('/auth/login/', loginLimit, loginHandler);                 // email + password
router.post('/auth/token/refresh/', refreshTokenHandler);              // refresh JWT

// ── Flow 3: Invitation — ADMIN / TRAINER / FINANCIER ─────────────────────

router.post(
  '/invite/send/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN),
  sendBatchInvitesHandler,
);
router.post('/invite/resend/', resendInviteLimit, resendInviteHandler);
router.post('/invite/accept/', acceptInviteHandler);

// ── OTP (phone verification after signup) ─────────────────────────────────

router.post('/auth/phone/otp/send/', otpLimit, sendPhoneOtpHandler);
router.post('/auth/phone/otp/verify/', verifyPhoneOtpHandler);

// ── Profile ───────────────────────────────────────────────────────────────

router.get('/me/', requireAuth, getMeHandler);

// ── User management (admin operations) ───────────────────────────────────

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

// ── Region management ────────────────────────────────────────────────────

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
