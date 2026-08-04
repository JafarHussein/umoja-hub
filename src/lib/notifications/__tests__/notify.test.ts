/**
 * @jest-environment node
 */

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const created: Array<Record<string, unknown>> = [];
jest.mock('@/lib/models/Notification.model', () => ({
  __esModule: true,
  default: {
    create: (doc: Record<string, unknown>) => {
      created.push(doc);
      return Promise.resolve(doc);
    },
  },
}));

const ADMINS = [{ _id: 'admin-1' }, { _id: 'admin-2' }];
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    find: () => ({ select: () => ({ lean: () => Promise.resolve(ADMINS) }) }),
    findById: () => ({ select: () => ({ lean: () => Promise.resolve(null) }) }),
  },
}));

import { notify, notifyAdmins } from '../notify';
import { NotificationType } from '@/types';

beforeEach(() => {
  created.length = 0;
});

describe('notify', () => {
  it('never throws when persistence fails, so a lifecycle path cannot break', async () => {
    // The contract the whole platform relies on: notify is called
    // fire-and-forget from money-moving paths and must degrade to a logged
    // error, never propagate.
    await expect(
      notify({ userId: 'not-an-object-id', type: NotificationType.SYSTEM, title: 'x' })
    ).resolves.toBeUndefined();
  });
});

describe('notifyAdmins', () => {
  it('reaches every administrator', async () => {
    await notifyAdmins({ type: NotificationType.VERIFICATION_UPDATE, title: 'New request' });
    expect(created).toHaveLength(ADMINS.length);
    expect(created.map((d) => d.userId)).toEqual(['admin-1', 'admin-2']);
  });

  it('does not write the audience onto the stored notification', async () => {
    // `audience` decides email wording only. It is not part of the in-app
    // record, and leaking it into the document would put an undeclared field
    // on every admin notification.
    await notifyAdmins({ type: NotificationType.VERIFICATION_UPDATE, title: 'New request' });
    for (const doc of created) {
      expect(doc).not.toHaveProperty('audience');
    }
  });
});
