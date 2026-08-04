import mongoose from 'mongoose';
import { logger } from '@/lib/utils';
import { NotificationType, NotificationChannel, Role } from '@/types';
import type { EmailAudience } from '@/lib/integrations/emailTemplates';

// ---------------------------------------------------------------------------
// notify — persist an in-app notification for a user, and (best-effort) send a
// matching branded email. Mirrors the sendSMS contract: safe to call from any
// trigger chain, never throws (failures are logged, not propagated), so adding
// it to a lifecycle path cannot break the underlying operation. Callers should
// NOT await it for correctness; treat it as fire-and-forget like the existing
// SMS side effect. The email half is a strict no-op when SMTP is unconfigured
// or under test, and when the notification type opts out of email.
// ---------------------------------------------------------------------------

export interface NotifyInput {
  userId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body?: string;
  relatedEntity?: { kind: string; id: string | mongoose.Types.ObjectId };
  channel?: NotificationChannel;
  /**
   * Who is being written to. Set to ADMIN by `notifyAdmins`; callers do not
   * pass it. It exists because the pipe had no way to tell the two apart, so an
   * operational broadcast borrowed the subject's wording wholesale — an
   * administrator alerted to a farmer's order was told to "open your orders to
   * see the latest status", about an order that was not theirs, under a footer
   * claiming activity on their own account.
   */
  audience?: EmailAudience;
}

// Per-type email policy. A type with no entry here is in-app only — high-volume
// or low-signal notifications opt out of email rather than becoming spam.
const EMAIL_NEXT_STEP: Partial<Record<NotificationType, string>> = {
  [NotificationType.WELCOME]: 'Open your dashboard to take your first step.',
  [NotificationType.ORDER_UPDATE]: 'Open your orders to see the latest status.',
  [NotificationType.ESCROW_UPDATE]: 'Open the order to track the escrow balance.',
  [NotificationType.VERIFICATION_UPDATE]: 'Open your dashboard to continue.',
  [NotificationType.PAYOUT_UPDATE]: 'Open your ledger to view the payout.',
  [NotificationType.REVIEW_UPDATE]: 'Open your project to read the review.',
  [NotificationType.GROUP_UPDATE]: 'Open your group to see the update.',
  [NotificationType.SYSTEM]: '',
};

// What an operator is being asked to do. Every one of these is a queue to work,
// never a thing that happened to the reader.
const ADMIN_NEXT_STEP: Partial<Record<NotificationType, string>> = {
  [NotificationType.VERIFICATION_UPDATE]: 'Open the verification queue to review the submission.',
  [NotificationType.ORDER_UPDATE]: 'Open the admin dashboard to review the order.',
  [NotificationType.ESCROW_UPDATE]: 'Open the escrow ledger to review the held funds.',
  [NotificationType.PAYOUT_UPDATE]: 'Open the payouts queue to settle the request.',
  [NotificationType.REVIEW_UPDATE]: 'Open the admin dashboard to review.',
  [NotificationType.GROUP_UPDATE]: 'Open the admin dashboard to review the group.',
  [NotificationType.WELCOME]: '',
  [NotificationType.SYSTEM]: '',
};

// Where an operator should land. Admin alerts used to route through the same
// per-role map as subjects, which sent every one of them to /dashboard/admin
// regardless of what the alert was about.
const ADMIN_PATH: Partial<Record<NotificationType, string>> = {
  [NotificationType.VERIFICATION_UPDATE]: '/dashboard/admin/verification-queue',
  [NotificationType.ESCROW_UPDATE]: '/dashboard/admin/escrow',
  [NotificationType.PAYOUT_UPDATE]: '/dashboard/admin/payouts',
  [NotificationType.ORDER_UPDATE]: '/dashboard/admin/mediation',
};

function dashboardPathFor(role: string | null, kind?: string): string {
  switch (role) {
    case Role.FARMER:
      if (kind === 'Order') return '/dashboard/farmer/orders';
      if (kind === 'WithdrawalRequest') return '/dashboard/farmer/ledger';
      if (kind === 'User') return '/dashboard/farmer/profile';
      return '/dashboard/farmer/listings';
    case Role.BUYER:
      return '/dashboard/buyer/orders';
    case Role.STUDENT:
      return '/dashboard/student';
    case Role.LECTURER:
      return '/dashboard/lecturer/queue';
    case Role.ADMIN:
      return '/dashboard/admin';
    default:
      return '/dashboard';
  }
}

async function dispatchEmail(input: NotifyInput): Promise<void> {
  // Bail out BEFORE any dynamic import so that in tests (where notify is called
  // fire-and-forget) no module load runs after the test has torn down — that
  // would raise Jest's "import outside the scope of the test" error.
  if (!process.env['SMTP_HOST'] || process.env['NODE_ENV'] === 'test') return;
  const isAdmin = input.audience === 'ADMIN';
  const nextStep = isAdmin ? ADMIN_NEXT_STEP[input.type] : EMAIL_NEXT_STEP[input.type];
  if (nextStep === undefined) return; // type opts out of email

  const { isEmailConfigured, sendLifecycleEmail } = await import(
    '@/lib/integrations/emailService'
  );
  if (!isEmailConfigured()) return;

  try {
    const { default: User } = await import('@/lib/models/User.model');
    const user = await User.findById(input.userId).select('email firstName role').lean();
    if (!user?.email) return;

    const base = process.env['NEXTAUTH_URL']?.replace(/\/$/, '') ?? '';
    const path = isAdmin
      ? (ADMIN_PATH[input.type] ?? '/dashboard/admin')
      : dashboardPathFor(user.role ?? null, input.relatedEntity?.kind);
    const ctaUrl = base ? `${base}${path}` : undefined;

    await sendLifecycleEmail(user.email, `UmojaHub — ${input.title}`, {
      audience: isAdmin ? 'ADMIN' : 'SUBJECT',
      ...(user.firstName ? { firstName: user.firstName } : {}),
      heading: input.title,
      intro: input.body ?? input.title,
      ...(nextStep ? { nextStep } : {}),
      ...(ctaUrl ? { ctaLabel: isAdmin ? 'Open the queue' : 'Open UmojaHub', ctaUrl } : {}),
    });
  } catch (error) {
    logger.error('notify', 'NOTIFY_EMAIL_FAILED — could not send lifecycle email', {
      userId: String(input.userId),
      type: input.type,
      error,
    });
  }
}

/**
 * Fan a notification out to every administrator. Used for operational alerts
 * (new verification request, new dispute, escrow release request). Never throws.
 */
export async function notifyAdmins(input: Omit<NotifyInput, 'userId' | 'audience'>): Promise<void> {
  try {
    const { default: User } = await import('@/lib/models/User.model');
    const admins = await User.find({ role: Role.ADMIN }).select('_id').lean();
    // Stamped here, not at the call sites: every fan-out is operational by
    // definition, and leaving it to twenty callers to remember is how the
    // subject's wording reached administrators in the first place.
    await Promise.all(
      admins.map((a) => notify({ ...input, userId: String(a._id), audience: 'ADMIN' }))
    );
  } catch (error) {
    logger.error('notify', 'NOTIFY_ADMINS_FAILED — could not fan out to admins', {
      type: input.type,
      error,
    });
  }
}

export async function notify(input: NotifyInput): Promise<void> {
  try {
    const { default: Notification } = await import('@/lib/models/Notification.model');
    // Build conditionally so optional fields are omitted (not set to undefined)
    // under exactOptionalPropertyTypes.
    const doc: Record<string, unknown> = {
      userId: input.userId,
      type: input.type,
      title: input.title,
      channel: input.channel ?? NotificationChannel.IN_APP,
      readAt: null,
    };
    if (input.body !== undefined) doc.body = input.body;
    if (input.relatedEntity) {
      doc.relatedEntity = { kind: input.relatedEntity.kind, id: input.relatedEntity.id };
    }
    await Notification.create(doc);
  } catch (error) {
    logger.error('notify', 'NOTIFY_FAILED — could not persist notification', {
      userId: String(input.userId),
      type: input.type,
      error,
    });
  }

  // Best-effort email — independent of the in-app persistence above.
  await dispatchEmail(input);
}
