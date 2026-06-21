// Insert helper. Mongoose's create() types reject conditional `undefined`
// fields under exactOptionalPropertyTypes even though Mongoose ignores them at
// runtime. This wrapper accepts a loose document and returns a typed hydrated
// doc (with _id), so generators can build payloads with optional fields freely.

import type mongoose from 'mongoose';
import type { Ledger } from './ledger';

export async function createDoc<T>(
  model: mongoose.Model<T>,
  doc: Record<string, unknown>
): Promise<mongoose.HydratedDocument<T>> {
  const created = await (model.create as (d: unknown) => Promise<unknown>)(doc);
  return created as mongoose.HydratedDocument<T>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Insert a backdated, ledger-tracked in-app notification. Notifications older
// than ~12 days are marked read (readAt shortly after creation); recent ones are
// left unread so each user has a believable unread backlog.
export async function pushNotification(
  ledger: Ledger,
  fields: {
    userId: mongoose.Types.ObjectId;
    type: string;
    title: string;
    body?: string;
    relatedEntity?: { kind: string; id: mongoose.Types.ObjectId };
    createdAt: Date;
  }
): Promise<void> {
  const { default: Notification } = await import('../../src/lib/models/Notification.model');
  const ageDays = (Date.now() - fields.createdAt.getTime()) / DAY_MS;
  const readAt = ageDays > 12 ? new Date(fields.createdAt.getTime() + 6 * 60 * 60 * 1000) : null;
  const doc = await createDoc(Notification, {
    userId: fields.userId,
    type: fields.type,
    title: fields.title,
    body: fields.body,
    relatedEntity: fields.relatedEntity,
    channel: 'IN_APP',
    readAt,
    createdAt: fields.createdAt,
    updatedAt: readAt ?? fields.createdAt,
  });
  ledger.track('Notification', doc);
}
