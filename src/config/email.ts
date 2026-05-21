import { Resend } from 'resend';

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[Email] RESEND_API_KEY is not set — emails will NOT be sent.');
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

export const DEFAULT_FROM = process.env.DEFAULT_FROM_EMAIL || 'onboarding@resend.dev';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] Skipping email — RESEND_API_KEY not configured.');
    console.warn('[Email] Would have sent to:', opts.to, '| Subject:', opts.subject);
    return;
  }

  const resend = getResend();
  const from = opts.from ?? DEFAULT_FROM;
  const to = Array.isArray(opts.to) ? opts.to : [opts.to];

  console.log('[Email] Sending to:', to, '| Subject:', opts.subject, '| From:', from);

  const { data, error } = await resend.emails.send({ from, to, subject: opts.subject, html: opts.html });

  if (error) {
    console.error('[Email] Resend error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  console.log('[Email] Sent successfully. ID:', data?.id);
}
