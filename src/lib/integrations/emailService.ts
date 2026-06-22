import nodemailer from 'nodemailer';
import { logger } from '@/lib/utils';
import { renderLifecycleEmail, type LifecycleEmailParams } from '@/lib/integrations/emailTemplates';

interface ISendEmailResult {
  success: boolean;
  messageId?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env['SMTP_HOST'],
      port: Number(process.env['SMTP_PORT'] ?? 587),
      secure: process.env['SMTP_PORT'] === '465',
      auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASS'],
      },
    });
  }
  return transporter;
}

/**
 * True when an SMTP transport is configured. Lifecycle email is a best-effort
 * side effect: when SMTP is absent (CI, local dev without mail, test runs) we
 * skip silently rather than attempting a connection that would hang or error.
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env['SMTP_HOST']) && process.env['NODE_ENV'] !== 'test';
}

/**
 * Send a branded lifecycle email. Never throws — failures are logged and
 * reported via the result flag, mirroring the SMS/notify side-effect contract,
 * so callers can fire-and-forget from any lifecycle path.
 */
export async function sendLifecycleEmail(
  to: string,
  subject: string,
  params: LifecycleEmailParams
): Promise<ISendEmailResult> {
  if (!isEmailConfigured()) return { success: false };
  try {
    const from = process.env['SMTP_FROM'] ?? process.env['SMTP_USER'];
    const info = await getTransporter().sendMail({
      from,
      to,
      subject,
      html: renderLifecycleEmail(params),
    });
    logger.info('emailService', 'Lifecycle email sent', { to, subject, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('emailService', 'EXT_EMAIL_FAILED — lifecycle email', { to, subject, error });
    return { success: false };
  }
}

export async function sendInstitutionalEmailPin(to: string, pin: string): Promise<ISendEmailResult> {
  try {
    const from = process.env['SMTP_FROM'] ?? process.env['SMTP_USER'];

    const info = await getTransporter().sendMail({
      from,
      to,
      subject: 'Your UmojaHub student verification code',
      html: `<p>Your UmojaHub student verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${pin}</p><p>This code expires in 15 minutes. If you did not request it, you can ignore this email.</p>`,
    });

    logger.info('emailService', 'Institutional email pin sent', { to, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('emailService', 'EXT_EMAIL_FAILED — institutional email pin', { to, error });
    return { success: false };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<ISendEmailResult> {
  try {
    const from = process.env['SMTP_FROM'] ?? process.env['SMTP_USER'];

    const info = await getTransporter().sendMail({
      from,
      to,
      subject: 'Reset your UmojaHub password',
      html: `<p>We received a request to reset your UmojaHub password.</p><p><a href="${resetLink}">Choose a new password</a></p><p>This link expires in 30 minutes and can be used once. If you did not request a reset, you can safely ignore this email — your password will not change.</p>`,
    });

    logger.info('emailService', 'Password reset email sent', { to, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('emailService', 'EXT_EMAIL_FAILED — password reset', { to, error });
    return { success: false };
  }
}
