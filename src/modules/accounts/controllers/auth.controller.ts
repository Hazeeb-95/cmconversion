import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest } from '../../../shared/types';

const authService = new AuthService();
const userService = new UserService();

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  const serialized = await userService.serializeUser(result.user);
  res.json({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: serialized,
  });
}

export async function refreshTokenHandler(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshTokens(refreshToken);
  res.json(tokens);
}

export async function sendPhoneOtpHandler(req: Request, res: Response): Promise<void> {
  const { phone } = req.body;
  await authService.sendPhoneOtp(phone);
  res.json({ detail: 'OTP sent.' });
}

export async function verifyPhoneOtpHandler(req: Request, res: Response): Promise<void> {
  const { phone, code } = req.body;
  const result = await authService.verifyPhoneOtp(phone, code);
  const serialized = await userService.serializeUser(result.user);
  res.json({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: serialized,
  });
}

export async function firebaseLoginHandler(req: Request, res: Response): Promise<void> {
  const { idToken } = req.body;
  const result = await authService.firebaseLogin(idToken);
  const serialized = await userService.serializeUser(result.user);
  res.json({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: serialized,
  });
}

export async function acceptInviteHandler(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body;
  const result = await authService.acceptInvite(token, password);
  const serialized = await userService.serializeUser(result.user);
  res.json({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: serialized,
  });
}

export async function resendInviteHandler(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  await authService.resendInvite(email);
  res.json({ detail: 'Invitation resent.' });
}

export async function sendBatchInvitesHandler(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user;
  const { users } = req.body;
  const userService = new UserService();
  const result = await userService.sendBatchInvites(users, user);
  res.status(201).json({
    created: result.created.length,
    skipped: result.skipped,
  });
}

export async function getMeHandler(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user;
  const serialized = await userService.serializeUser(user);
  res.json(serialized);
}
