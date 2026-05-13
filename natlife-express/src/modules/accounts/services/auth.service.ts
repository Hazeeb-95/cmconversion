import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { AppDataSource } from '../../../config/database';
import { User } from '../models/user.entity';
import { Role } from '../models/role.entity';
import { Region } from '../models/region.entity';
import { sendEmail } from '../../../config/email';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from '../../../middleware/auth';
import {
  storeOtp,
  getOtp,
  incrementAttempts,
  deleteOtp,
} from '../../../config/otp-cache';
import { OTP_MAX_ATTEMPTS, OTP_LENGTH, RoleName } from '../../../shared/constants';
import { AppError } from '../../../middleware/error-handler';
import { verifyFirebaseToken } from '../../../config/firebase';

const SALT_ROUNDS = 12;

function generateOtpCode(): string {
  return Math.floor(10 ** (OTP_LENGTH - 1) + Math.random() * 9 * 10 ** (OTP_LENGTH - 1))
    .toString()
    .padStart(OTP_LENGTH, '0');
}

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private roleRepo = AppDataSource.getRepository(Role);

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  issueTokens(userId: number): { accessToken: string; refreshToken: string } {
    return {
      accessToken: generateAccessToken(userId),
      refreshToken: generateRefreshToken(userId),
    };
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      throw new AppError(401, 'Invalid or expired refresh token.');
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError(401, 'Refresh token revoked.');
    }

    const tokens = this.issueTokens(user.id);
    user.refreshToken = tokens.refreshToken;
    await this.userRepo.save(user);
    return tokens;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['roles', 'region'],
    });

    if (!user || !user.passwordHash) {
      throw new AppError(401, 'Invalid credentials.');
    }

    const valid = await this.verifyPassword(password, user.passwordHash);
    if (!valid) throw new AppError(401, 'Invalid credentials.');
    if (!user.isActive) throw new AppError(401, 'Account is inactive.');

    const tokens = this.issueTokens(user.id);
    user.refreshToken = tokens.refreshToken;
    await this.userRepo.save(user);
    return { ...tokens, user };
  }

  async sendPhoneOtp(phone: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { phone } });
    if (!user) throw new AppError(404, 'User with this phone not found.');

    const code = generateOtpCode();
    storeOtp(phone, code);
    // In production: integrate SMS provider here
    console.info(`[OTP] Phone ${phone} → code ${code}`);
  }

  async verifyPhoneOtp(
    phone: string,
    code: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const entry = getOtp(phone);
    if (!entry) throw new AppError(400, 'OTP expired or not found.');

    const attempts = incrementAttempts(phone);
    if (attempts > OTP_MAX_ATTEMPTS) {
      deleteOtp(phone);
      throw new AppError(429, 'Too many OTP attempts. Please request a new code.');
    }

    if (entry.code !== code) throw new AppError(400, 'Invalid OTP code.');

    deleteOtp(phone);
    const user = await this.userRepo.findOne({
      where: { phone },
      relations: ['roles', 'region'],
    });
    if (!user) throw new AppError(404, 'User not found.');

    user.phoneVerified = true;
    const tokens = this.issueTokens(user.id);
    user.refreshToken = tokens.refreshToken;
    await this.userRepo.save(user);
    return { ...tokens, user };
  }

  async firebaseLogin(
    idToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const decoded = await verifyFirebaseToken(idToken);
    if (!decoded) throw new AppError(400, 'Invalid Firebase token.');

    const phone = decoded.phone_number;
    const email = decoded.email;
    if (!phone && !email) throw new AppError(400, 'Firebase token has no phone or email.');

    let user = phone
      ? await this.userRepo.findOne({ where: { phone }, relations: ['roles', 'region'] })
      : null;

    if (!user && email) {
      user = await this.userRepo.findOne({ where: { email }, relations: ['roles', 'region'] });
    }

    if (!user) throw new AppError(404, 'No account found for this Firebase credential.');
    if (!user.isActive) throw new AppError(401, 'Account is inactive.');

    const tokens = this.issueTokens(user.id);
    user.refreshToken = tokens.refreshToken;
    await this.userRepo.save(user);
    return { ...tokens, user };
  }

  async sendInviteEmail(user: User, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const url = `${frontendUrl}/accept-invite?token=${token}`;
    const roleLabel = user.roleNames.join(', ');

    const regionInfo =
      user.region ? `<p><strong>Region:</strong> ${user.region.name}</p>` : '';

    const html = `
      <h2>Welcome to NatLife</h2>
      <p>You have been invited as <strong>${roleLabel}</strong>.</p>
      ${regionInfo}
      <p>Click the link below to accept your invitation and set your password:</p>
      <a href="${url}">${url}</a>
      <p>This link expires in 3 days.</p>
    `;

    await sendEmail({ to: user.email!, subject: 'Your NatLife Invitation', html });
  }

  generateInviteToken(): string {
    return uuidv4();
  }

  async acceptInvite(
    token: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const user = await this.userRepo.findOne({
      where: { emailConfirmationToken: token },
      relations: ['roles', 'region'],
    });

    if (!user) throw new AppError(400, 'Invalid or expired invitation token.');

    const sentAt = user.emailConfirmationSentAt;
    if (sentAt) {
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - sentAt.getTime() > threeDaysMs) {
        throw new AppError(400, 'Invitation token has expired.');
      }
    }

    user.passwordHash = await this.hashPassword(password);
    user.isActive = true;
    user.inviteAccepted = true;
    user.emailVerified = true;
    user.emailConfirmationToken = null;
    user.emailConfirmationSentAt = null;

    const tokens = this.issueTokens(user.id);
    user.refreshToken = tokens.refreshToken;
    await this.userRepo.save(user);
    return { ...tokens, user };
  }

  async resendInvite(email: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['roles', 'region'],
    });
    if (!user) throw new AppError(404, 'User not found.');
    if (user.inviteAccepted) throw new AppError(400, 'Invitation already accepted.');

    const token = this.generateInviteToken();
    user.emailConfirmationToken = token;
    user.emailConfirmationSentAt = new Date();
    await this.userRepo.save(user);
    await this.sendInviteEmail(user, token);
  }
}
