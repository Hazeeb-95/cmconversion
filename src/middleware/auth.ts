import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../modules/accounts/models/user.entity';
import { JwtPayload, AuthenticatedRequest } from '../shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export function generateAccessToken(userId: number): string {
  const expiry = (process.env.JWT_ACCESS_EXPIRY || '4h') as jwt.SignOptions['expiresIn'];
  return jwt.sign({ sub: userId, type: 'access' }, JWT_SECRET, { expiresIn: expiry });
}

export function generateRefreshToken(userId: number): string {
  const expiry = (process.env.JWT_REFRESH_EXPIRY || '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign({ sub: userId, type: 'refresh' }, JWT_SECRET, { expiresIn: expiry });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'Authentication credentials were not provided.' });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload || payload.type !== 'access') {
    res.status(401).json({ detail: 'Invalid or expired token.' });
    return;
  }

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({
    where: { id: payload.sub },
    relations: ['roles', 'region'],
  });

  if (!user || !user.isActive) {
    res.status(401).json({ detail: 'User not found or inactive.' });
    return;
  }

  (req as AuthenticatedRequest).user = user;
  next();
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload?.type === 'access') {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: payload.sub },
        relations: ['roles', 'region'],
      });
      if (user?.isActive) {
        (req as AuthenticatedRequest).user = user;
      }
    }
  }
  next();
}
