import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest } from '../../../shared/types';
import { RoleName } from '../../../shared/constants';
import { AppError } from '../../../middleware/error-handler';

const authService = new AuthService();
const userService = new UserService();

// ── Shared serializer helper ───────────────────────────────────────────────

async function sendAuthResponse(
  res: Response,
  result: { accessToken: string; refreshToken: string; user: import('../models/user.entity').User },
  status = 200,
): Promise<void> {
  const serialized = await userService.serializeUser(result.user);
  res.status(status).json({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: serialized,
  });
}

// ── Flow 1: CM / CCM — Firebase signup & login ────────────────────────────

/**
 * POST /accounts/auth/firebase/signup/
 * Body: { idToken: string, role: 'CM' | 'CCM', email?: string }
 *
 * Mobile CM/CCM user registers via Firebase Phone Auth.
 * Firebase has already verified their phone number.
 */
export async function firebaseSignupHandler(req: Request, res: Response): Promise<void> {
  const { idToken, role, phone, email } = req.body;

  if (!idToken) throw new AppError(400, 'idToken is required.');
  if (!phone) throw new AppError(400, 'phone is required.');
  if (role !== RoleName.CM && role !== RoleName.CCM) {
    throw new AppError(400, `role must be '${RoleName.CM}' or '${RoleName.CCM}'.`);
  }

  const result = await authService.firebaseSignup(idToken, role, phone, email);
  await sendAuthResponse(res, result, 201);
}

/**
 * POST /accounts/firebase/login/
 * Body: { idToken: string }
 *
 * Existing CM/CCM user logs in via Firebase.
 */
export async function firebaseLoginHandler(req: Request, res: Response): Promise<void> {
  const { idToken } = req.body;
  if (!idToken) throw new AppError(400, 'idToken is required.');

  const result = await authService.firebaseLogin(idToken);
  await sendAuthResponse(res, result);
}

// ── Flow 2: Super Admin — JWT registration & login ────────────────────────

/**
 * POST /accounts/auth/super-admin/register/
 * Body: { email, password, phone, setupKey }
 *
 * One-time Super Admin account creation. Protected by SUPER_ADMIN_SETUP_KEY env var.
 */
export async function registerSuperAdminHandler(req: Request, res: Response): Promise<void> {
  const { email, password, phone, setupKey } = req.body;

  if (!email || !password || !phone || !setupKey) {
    throw new AppError(400, 'email, password, phone, and setupKey are all required.');
  }
  if (password.length < 8) {
    throw new AppError(400, 'Password must be at least 8 characters.');
  }

  const result = await authService.registerSuperAdmin(email, password, phone, setupKey);
  await sendAuthResponse(res, result, 201);
}

/**
 * POST /accounts/auth/login/
 * Body: { email, password }
 *
 * Standard JWT login for Super Admin and invited users (ADMIN, TRAINER, FINANCIER).
 */
export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError(400, 'email and password are required.');

  const result = await authService.login(email, password);
  await sendAuthResponse(res, result);
}

/**
 * POST /accounts/auth/token/refresh/
 * Body: { refreshToken: string }
 */
export async function refreshTokenHandler(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError(400, 'refreshToken is required.');

  const tokens = await authService.refreshTokens(refreshToken);
  res.json(tokens);
}

// ── Flow 3: Invitation — ADMIN / TRAINER / FINANCIER ─────────────────────

/**
 * POST /accounts/invite/send/
 * Body: { users: [{ email, phone, roles, regionId? }] }
 * Auth: SUPER_ADMIN or ADMIN
 *
 * Batch-create users and send them invitation emails.
 */
export async function sendBatchInvitesHandler(req: Request, res: Response): Promise<void> {
  const requestingUser = (req as AuthenticatedRequest).user;
  const { users } = req.body;

  if (!Array.isArray(users) || users.length === 0) {
    throw new AppError(400, 'users array is required and must not be empty.');
  }

  const result = await userService.sendBatchInvites(users, requestingUser);
  res.status(201).json({
    created: result.created.length,
    skipped: result.skipped,
  });
}

/**
 * POST /accounts/invite/accept/
 * Body: { token: string, password: string }
 *
 * Invited user sets their password and activates their account.
 */
export async function acceptInviteHandler(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body;
  if (!token || !password) throw new AppError(400, 'token and password are required.');
  if (password.length < 8) throw new AppError(400, 'Password must be at least 8 characters.');

  const result = await authService.acceptInvite(token, password);
  await sendAuthResponse(res, result);
}

/**
 * POST /accounts/invite/resend/
 * Body: { email: string }
 * Rate-limited: 3 per minute per IP
 */
export async function resendInviteHandler(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  if (!email) throw new AppError(400, 'email is required.');

  await authService.resendInvite(email);
  res.json({ detail: 'Invitation email resent.' });
}

// ── OTP (phone verification) ──────────────────────────────────────────────

/**
 * POST /accounts/auth/phone/otp/send/
 * Body: { phone: string }
 */
export async function sendPhoneOtpHandler(req: Request, res: Response): Promise<void> {
  const { phone } = req.body;
  if (!phone) throw new AppError(400, 'phone is required.');

  await authService.sendPhoneOtp(phone);
  res.json({ detail: 'OTP sent.' });
}

/**
 * POST /accounts/auth/phone/otp/verify/
 * Body: { phone: string, code: string }
 */
export async function verifyPhoneOtpHandler(req: Request, res: Response): Promise<void> {
  const { phone, code } = req.body;
  if (!phone || !code) throw new AppError(400, 'phone and code are required.');

  const result = await authService.verifyPhoneOtp(phone, code);
  await sendAuthResponse(res, result);
}

// ── Authenticated user info ───────────────────────────────────────────────

/**
 * GET /accounts/me/
 * Auth: any authenticated user
 */
export async function getMeHandler(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user;
  const serialized = await userService.serializeUser(user);
  res.json(serialized);
}
