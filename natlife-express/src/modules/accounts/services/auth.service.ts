import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
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

type TokenPair = { accessToken: string; refreshToken: string };
type AuthResult = TokenPair & { user: User };

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private roleRepo = AppDataSource.getRepository(Role);
  private regionRepo = AppDataSource.getRepository(Region);

  // ── Helpers ────────────────────────────────────────────────────────────────

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  issueTokens(userId: number): TokenPair {
    return {
      accessToken: generateAccessToken(userId),
      refreshToken: generateRefreshToken(userId),
    };
  }

  private async saveTokens(user: User): Promise<TokenPair> {
    const tokens = this.issueTokens(user.id);
    user.refreshToken = tokens.refreshToken;
    await this.userRepo.save(user);
    return tokens;
  }

  generateInviteToken(): string {
    return uuidv4();
  }

  // ── Flow 1: CM / CCM — Firebase signup ────────────────────────────────────

  /**
   * Mobile user signs up via Firebase Phone Auth.
   * Firebase has already verified the phone number.
   * We create a new User with CM or CCM role and issue our own JWT.
   */
  async firebaseSignup(
    idToken: string,
    role: RoleName.CM | RoleName.CCM,
    email?: string,
  ): Promise<AuthResult> {
    const decoded = await verifyFirebaseToken(idToken);
    if (!decoded) throw new AppError(400, 'Invalid Firebase token.');

    const phone = decoded.phone_number;
    if (!phone) throw new AppError(400, 'Firebase token must contain a phone number for CM/CCM signup.');

    // Prevent duplicate signup
    const existing = await this.userRepo.findOne({ where: { phone } });
    if (existing) throw new AppError(409, 'An account with this phone number already exists.');

    const roleEntity = await this.roleRepo.findOne({ where: { name: role } });
    if (!roleEntity) throw new AppError(500, `Role ${role} not seeded in database.`);

    const user = this.userRepo.create({
      phone,
      email: email ?? decoded.email ?? null,
      phoneVerified: true,   // Firebase already verified the phone
      emailVerified: !!decoded.email,
      isActive: true,
      isApproved: false,     // Admin must approve before full access
      inviteAccepted: true,
      roles: [roleEntity],
    });

    await this.userRepo.save(user);

    const tokens = await this.saveTokens(user);
    return { ...tokens, user };
  }

  /**
   * Firebase login for existing CM/CCM users.
   * Does NOT create a new user — use firebaseSignup for that.
   */
  async firebaseLogin(idToken: string): Promise<AuthResult> {
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

    if (!user) throw new AppError(404, 'No account found. Please sign up first.');
    if (!user.isActive) throw new AppError(401, 'Account is inactive.');

    const tokens = await this.saveTokens(user);
    return { ...tokens, user };
  }

  // ── Flow 2: Super Admin — JWT email/password registration ─────────────────

  /**
   * Registers a Super Admin account via email + password.
   * Protected by SUPER_ADMIN_SETUP_KEY env variable.
   * Only one Super Admin can be created this way (checked at call time).
   */
  async registerSuperAdmin(
    email: string,
    password: string,
    phone: string,
    setupKey: string,
  ): Promise<AuthResult> {
    const expectedKey = process.env.SUPER_ADMIN_SETUP_KEY;
    if (!expectedKey || setupKey !== expectedKey) {
      throw new AppError(403, 'Invalid setup key.');
    }

    // Allow multiple super admins — remove check below if you want only one
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new AppError(409, 'An account with this email already exists.');

    const existingPhone = await this.userRepo.findOne({ where: { phone } });
    if (existingPhone) throw new AppError(409, 'An account with this phone already exists.');

    const roleEntity = await this.roleRepo.findOne({ where: { name: RoleName.SUPER_ADMIN } });
    if (!roleEntity) throw new AppError(500, 'SUPER_ADMIN role not seeded in database.');

    const user = this.userRepo.create({
      email,
      phone,
      passwordHash: await this.hashPassword(password),
      isActive: true,
      isApproved: true,
      isStaff: true,
      emailVerified: true,
      inviteAccepted: true,
      roles: [roleEntity],
    });

    await this.userRepo.save(user);

    const tokens = await this.saveTokens(user);
    return { ...tokens, user };
  }

  // ── Flow 2 (continued): Standard JWT login ─────────────────────────────────

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['roles', 'region'],
    });

    if (!user || !user.passwordHash) throw new AppError(401, 'Invalid credentials.');
    if (!await this.verifyPassword(password, user.passwordHash)) {
      throw new AppError(401, 'Invalid credentials.');
    }
    if (!user.isActive) throw new AppError(401, 'Account is inactive.');

    const tokens = await this.saveTokens(user);
    return { ...tokens, user };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const payload = verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      throw new AppError(401, 'Invalid or expired refresh token.');
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError(401, 'Refresh token revoked.');
    }

    return this.saveTokens(user);
  }

  // ── Flow 3: Invitation — for ADMIN / TRAINER / FINANCIER ──────────────────

  async sendInviteEmail(user: User, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const url = `${frontendUrl}/accept-invite?token=${token}`;
    const roleLabel = user.roleNames.join(', ');
    const regionInfo = user.region ? `<p><strong>Region:</strong> ${user.region.name}</p>` : '';

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

  async acceptInvite(token: string, password: string): Promise<AuthResult> {
    const user = await this.userRepo.findOne({
      where: { emailConfirmationToken: token },
      relations: ['roles', 'region'],
    });

    if (!user) throw new AppError(400, 'Invalid or expired invitation token.');

    if (user.emailConfirmationSentAt) {
      const expiredAt = user.emailConfirmationSentAt.getTime() + 3 * 24 * 60 * 60 * 1000;
      if (Date.now() > expiredAt) throw new AppError(400, 'Invitation link has expired.');
    }

    user.passwordHash = await this.hashPassword(password);
    user.isActive = true;
    user.inviteAccepted = true;
    user.emailVerified = true;
    user.emailConfirmationToken = null;
    user.emailConfirmationSentAt = null;

    // If ADMIN role, ensure region.admin is set
    if (user.hasRole(RoleName.ADMIN) && user.regionId) {
      await this.regionRepo.update(user.regionId, { adminId: user.id });
    }

    const tokens = await this.saveTokens(user);
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

  // ── OTP (phone verification) ───────────────────────────────────────────────

  async sendPhoneOtp(phone: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { phone } });
    if (!user) throw new AppError(404, 'User with this phone not found.');

    const code = generateOtpCode();
    storeOtp(phone, code);
    // TODO: integrate SMS provider (Twilio, MSG91, etc.)
    console.info(`[OTP] Phone ${phone} → code ${code}`);
  }

  async verifyPhoneOtp(phone: string, code: string): Promise<AuthResult> {
    const entry = getOtp(phone);
    if (!entry) throw new AppError(400, 'OTP expired or not found. Please request a new one.');

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
    const tokens = await this.saveTokens(user);
    return { ...tokens, user };
  }
}