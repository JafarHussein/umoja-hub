// Insert helper. Mongoose's create() types reject conditional `undefined`
// fields under exactOptionalPropertyTypes even though Mongoose ignores them at
// runtime. This wrapper accepts a loose document and returns a typed hydrated
// doc (with _id), so generators can build payloads with optional fields freely.

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import type { Ledger } from './ledger';
import { DEMO_PASSWORDS } from './content/accounts';
import { Role, BCRYPT_SALT_ROUNDS } from '../../src/types';

// Every demo user can sign in, including the generated population — a panel
// that asks "can I log in as one of these farmers?" should get a yes. Passwords
// are per-role, so one bcrypt hash is computed per distinct password and reused
// across everyone who shares it: hashing ~60 times at 12 rounds would add most
// of a minute to the run for no security value on a local demo database.
const hashCache = new Map<string, string>();

export async function demoPasswordHash(role: string): Promise<string> {
  const password = DEMO_PASSWORDS[role] ?? DEMO_PASSWORDS[Role.BUYER]!;
  const cached = hashCache.get(password);
  if (cached) return cached;
  const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  hashCache.set(password, hash);
  return hash;
}

export async function createDoc<T>(
  model: mongoose.Model<T>,
  doc: Record<string, unknown>
): Promise<mongoose.HydratedDocument<T>> {
  const created = await (model.create as (d: unknown) => Promise<unknown>)(doc);
  return created as mongoose.HydratedDocument<T>;
}

// Batched writer for append-only records.
//
// The world is built against a remote Atlas cluster, so a single insert costs a
// network round trip — roughly a quarter of a second. Three quarters of the
// documents in a run are append-only logs (payment events, escrow events,
// notifications, price history, receipts, ratings) that nothing reads back while
// the run is still going, and paying a round trip each turns a fast script into
// a twelve-minute one.
//
// So those go through here instead: the _id is generated locally, the ledger
// records it straight away (a reset stays exact even if the run dies before the
// flush), and the write is deferred into one insertMany per collection.
//
// Only append-only collections belong here. Anything a later step reads back or
// updates — listings, orders, engagements — is still written immediately, and
// the caller flushes before any step that reads what it queued.
export class Batcher {
  private readonly queues = new Map<
    string,
    { model: mongoose.Model<unknown>; docs: Record<string, unknown>[] }
  >();

  constructor(private readonly ledger: Ledger) {}

  // Queue a document and return the _id it will be written with.
  add(
    model: mongoose.Model<unknown>,
    collection: string,
    doc: Record<string, unknown>
  ): mongoose.Types.ObjectId {
    const _id = new mongoose.Types.ObjectId();
    const queue = this.queues.get(collection) ?? { model, docs: [] };
    queue.docs.push({ _id, ...doc });
    this.queues.set(collection, queue);
    this.ledger.track(collection, { _id });
    return _id;
  }

  get pending(): number {
    let n = 0;
    for (const q of this.queues.values()) n += q.docs.length;
    return n;
  }

  // Write everything queued so far. Safe to call as often as you like; a flush
  // with nothing pending costs nothing.
  async flush(): Promise<void> {
    for (const [, queue] of this.queues) {
      if (queue.docs.length === 0) continue;
      const docs = queue.docs;
      queue.docs = [];
      // ordered:false lets the driver pipeline the batch; the documents are
      // independent log rows, so insertion order carries no meaning.
      await queue.model.insertMany(docs, { ordered: false });
    }
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Insert a backdated, ledger-tracked in-app notification. Notifications older
// than ~12 days are marked read (readAt shortly after creation); recent ones are
// left unread so each user has a believable unread backlog.
export async function pushNotification(
  batcher: Batcher,
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
  batcher.add(Notification as unknown as mongoose.Model<unknown>, 'Notification', {
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
}
