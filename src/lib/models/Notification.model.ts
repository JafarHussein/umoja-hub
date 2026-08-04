import mongoose, { Schema } from 'mongoose';
import { NotificationType, NotificationChannel } from '@/types';

// ---------------------------------------------------------------------------
// Notification — a persisted, per-user in-app notification. Complements the
// existing fire-and-forget SMS/email (which are transient and not stored): this
// backs the in-app notification center with a read/unread inbox. Written
// non-blocking at lifecycle milestones (order/escrow/verification/payout/review)
// via src/lib/notifications/notify.ts. `readAt` is null until
// the user marks it read; `channel` records any out-of-band delivery alongside.
// ---------------------------------------------------------------------------

const relatedEntitySchema = new Schema(
  {
    kind: { type: String, trim: true },
    id: { type: Schema.Types.ObjectId },
  },
  { _id: false }
);

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, trim: true, maxlength: 1000 },
    relatedEntity: { type: relatedEntitySchema, default: undefined },
    channel: {
      type: String,
      enum: Object.values(NotificationChannel),
      default: NotificationChannel.IN_APP,
    },
    // Null while unread; set to the read timestamp when the user opens it.
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Unread-count and per-user inbox queries.
notificationSchema.index({ userId: 1, readAt: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

notificationSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type NotificationDoc = mongoose.InferSchemaType<typeof notificationSchema>;
const Notification: mongoose.Model<NotificationDoc> =
  (mongoose.models['Notification'] as mongoose.Model<NotificationDoc>) ??
  mongoose.model('Notification', notificationSchema);

export default Notification;
