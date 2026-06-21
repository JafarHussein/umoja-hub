import mongoose from 'mongoose';
import { logger } from '@/lib/utils';
import { NotificationType, NotificationChannel } from '@/types';

// ---------------------------------------------------------------------------
// notify — persist an in-app notification for a user. Mirrors the sendSMS
// contract: safe to call from any trigger chain, never throws (failures are
// logged, not propagated), so adding it to a lifecycle path cannot break the
// underlying operation. Callers should NOT await it for correctness; treat it
// as fire-and-forget like the existing SMS/email side effects.
// ---------------------------------------------------------------------------

export interface NotifyInput {
  userId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body?: string;
  relatedEntity?: { kind: string; id: string | mongoose.Types.ObjectId };
  channel?: NotificationChannel;
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
}
