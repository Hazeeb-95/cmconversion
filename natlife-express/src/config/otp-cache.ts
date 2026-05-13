import NodeCache from 'node-cache';
import { OTP_TTL_SECONDS } from '../shared/constants';

export const otpCache = new NodeCache({ stdTTL: OTP_TTL_SECONDS, checkperiod: 60 });

export interface OtpEntry {
  code: string;
  attempts: number;
}

export function storeOtp(phone: string, code: string): void {
  otpCache.set<OtpEntry>(phone, { code, attempts: 0 });
}

export function getOtp(phone: string): OtpEntry | undefined {
  return otpCache.get<OtpEntry>(phone);
}

export function incrementAttempts(phone: string): number {
  const entry = getOtp(phone);
  if (!entry) return 0;
  const updated = { ...entry, attempts: entry.attempts + 1 };
  otpCache.set<OtpEntry>(phone, updated);
  return updated.attempts;
}

export function deleteOtp(phone: string): void {
  otpCache.del(phone);
}
