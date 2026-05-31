import { Resend } from 'resend';
import { env } from '@/lib/env';
import { logger } from '@/lib/utils';

interface ISendEmailResult {
  success: boolean;
  messageId?: string;
}

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(env('RESEND_API_KEY'));
  }
  return resendClient;
}

export async function sendVerificationEmail(to: string, token: string): Promise<ISendEmailResult> {
  try {
    const baseUrl = process.env['NEXTAUTH_URL'] ?? 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    const { data, error } = await getResend().emails.send({
      from: env('RESEND_FROM_EMAIL'),
      to,
      subject: 'Verify your UmojaHub email',
      html: `<p>Welcome to UmojaHub!</p><p>Click the link below to verify your email address. This link expires in 24 hours.</p><p><a href="${verifyUrl}">Verify email address</a></p><p>If you did not create an account, you can ignore this email.</p>`,
    });

    if (error ?? !data) {
      logger.error('emailService', 'Resend error on verification email', { to, error });
      return { success: false };
    }

    logger.info('emailService', 'Verification email sent', { to, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    logger.error('emailService', 'EXT_EMAIL_FAILED — verification email', { to, error });
    return { success: false };
  }
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<ISendEmailResult> {
  try {
    const baseUrl = process.env['NEXTAUTH_URL'] ?? 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    const { data, error } = await getResend().emails.send({
      from: env('RESEND_FROM_EMAIL'),
      to,
      subject: 'Reset your UmojaHub password',
      html: `<p>You requested a password reset for your UmojaHub account.</p><p>Click the link below to set a new password. This link expires in 1 hour.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });

    if (error ?? !data) {
      logger.error('emailService', 'Resend error on password reset email', { to, error });
      return { success: false };
    }

    logger.info('emailService', 'Password reset email sent', { to, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error) {
    logger.error('emailService', 'EXT_EMAIL_FAILED — password reset email', { to, error });
    return { success: false };
  }
}
