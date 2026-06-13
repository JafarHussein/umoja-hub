import nodemailer from 'nodemailer';
import { logger } from '@/lib/utils';

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

export async function sendVerificationEmail(to: string, token: string): Promise<ISendEmailResult> {
  try {
    const baseUrl = process.env['NEXTAUTH_URL'] ?? 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
    const from = process.env['SMTP_FROM'] ?? process.env['SMTP_USER'];

    const info = await getTransporter().sendMail({
      from,
      to,
      subject: 'Verify your UmojaHub email',
      html: `<p>Welcome to UmojaHub!</p><p>Click the link below to verify your email address. This link expires in 24 hours.</p><p><a href="${verifyUrl}">Verify email address</a></p><p>If you did not create an account, you can ignore this email.</p>`,
    });

    logger.info('emailService', 'Verification email sent', { to, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('emailService', 'EXT_EMAIL_FAILED — verification email', { to, error });
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

export async function sendPasswordResetEmail(to: string, token: string): Promise<ISendEmailResult> {
  try {
    const baseUrl = process.env['NEXTAUTH_URL'] ?? 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;
    const from = process.env['SMTP_FROM'] ?? process.env['SMTP_USER'];

    const info = await getTransporter().sendMail({
      from,
      to,
      subject: 'Reset your UmojaHub password',
      html: `<p>You requested a password reset for your UmojaHub account.</p><p>Click the link below to set a new password. This link expires in 1 hour.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });

    logger.info('emailService', 'Password reset email sent', { to, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('emailService', 'EXT_EMAIL_FAILED — password reset email', { to, error });
    return { success: false };
  }
}
