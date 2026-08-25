import nodemailer from 'nodemailer';
import { logger } from '@/lib/utils';
import { isLoopbackUrl } from '@/lib/env';
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
 * A link inside an email is the one URL this platform emits that is guaranteed
 * to be opened somewhere else — another device, another network, most often a
 * phone. A loopback address cannot survive that trip: it resolves on the
 * machine that sent it and nowhere on earth besides, so the recipient gets
 * "This site can't be reached" and the workflow the email exists to continue
 * simply ends.
 *
 * This happened, and nothing caught it: the base URL came from NEXTAUTH_URL,
 * which is http://localhost:3000 during local development because OAuth
 * requires it to be, and a rehearsal that sends real mail through the real
 * SMTP account therefore posted loopback links to real inboxes. Every gate was
 * green throughout, because a link is only wrong relative to where it is read.
 *
 * So the check lives here, at the single point where mail leaves the process,
 * and it is loud. It does not suppress the email: a reset link that reaches the
 * wrong address is still recoverable by the person who asked for it, whereas an
 * email that never arrives is not. Set PUBLIC_SITE_URL to fix it.
 */
function warnIfUnreachable(link: string | undefined, context: string): void {
  if (!link || !isLoopbackUrl(link)) return;
  logger.error(
    'emailService',
    'EMAIL_LINK_UNREACHABLE — this email carries a loopback link that no recipient can open. Set PUBLIC_SITE_URL to the public address of this deployment.',
    { context, link }
  );
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
  warnIfUnreachable(params.ctaUrl, 'lifecycle');
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

export async function sendInstitutionalEmailPin(
  to: string,
  pin: string
): Promise<ISendEmailResult> {
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
  warnIfUnreachable(resetLink, 'password-reset');
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
