import { Resend } from 'resend';

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.NODE_ENV === 'development'
      ? (process.env.RESEND_TEST_API_KEY ?? process.env.RESEND_API_KEY)
      : process.env.RESEND_API_KEY;
    _resend = new Resend(key);
  }
  return _resend;
}

export const DEFAULT_FROM = process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: opts.from ?? DEFAULT_FROM,
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    html: opts.html,
  });
}
