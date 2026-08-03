import { OnboardingStage, UserStatus } from '@/types';

// Abandoned pending accounts (AUTH_ONBOARDING_FLOW_V3 §8).
//
// V3 creates a real User row at the OAuth callback, before the person has set a
// password or picked a role. Most finish; some close the tab. What is left is a
// row holding a verified email and a derived username, and nothing else — no
// password, no role, no data, and no route it can reach.
//
// V2 had no equivalent because it created nothing until the end: its
// OnboardingDraft was a side record with a 30-minute Mongo TTL. A TTL index is
// not available here — it would sit on the User collection and no expiry field
// can safely be added to real accounts — so the cleanup is explicit.
//
// Two mechanisms, because they solve different halves of the problem:
//
//   1. Reclaim on sign-in (the one that matters to a person). Someone who
//      abandoned a Google attempt and comes back on GitHub is otherwise met with
//      "an account with this email already exists" and cannot get in at all. The
//      callback drops the stale row and starts them cleanly. This is immediate
//      and does not wait for a scheduler.
//
//   2. The weekly sweep (hygiene). Reclaims the long tail nobody returns to, so
//      abandoned rows stop holding usernames. Weekly is fine for this precisely
//      because mechanism 1 already covers the case a user can feel — the
//      platform runs on Vercel Hobby, which allows two cron entries total.
//
// Why deleting is safe: a pending account confers nothing. Anyone who returns
// re-authenticates with the same provider-verified email and gets a fresh one,
// losing nothing they had entered.

// Matches the 30-minute TTL V2's OnboardingDraft used. Comfortably longer than
// filling in a three-field form, so a live signup is never swept mid-flow, and
// short enough that a squatted username frees up quickly.
export const PENDING_ACCOUNT_TTL_MS = 30 * 60 * 1000;

interface IPendingCandidate {
  onboardingStage?: string | null;
  createdAt?: Date | null;
}

// True when this row is an onboarding attempt that was started and left.
//
// Deliberately scoped to PASSWORD_SETUP. An account that reached ROLE_SELECTION
// has a password the user chose — a real credential — so it is kept even
// without a role: they can sign in and finish. Only the stage where nothing has
// been entered is disposable.
export function isStalePendingAccount(user: IPendingCandidate, now: Date = new Date()): boolean {
  if (user.onboardingStage !== OnboardingStage.PASSWORD_SETUP) return false;
  if (!user.createdAt) return false;
  return now.getTime() - user.createdAt.getTime() > PENDING_ACCOUNT_TTL_MS;
}

export interface IPruneResult {
  deleted: number;
}

// Delete every pending account older than the TTL. The filter is narrow on
// purpose: the stage, the age, and the absence of a password all have to hold,
// so no query mistake here can reach an account that someone actually uses.
export async function prunePendingAccounts(now: Date = new Date()): Promise<IPruneResult> {
  const { default: User } = await import('@/lib/models/User.model');
  const cutoff = new Date(now.getTime() - PENDING_ACCOUNT_TTL_MS);

  const result = await User.deleteMany({
    onboardingStage: OnboardingStage.PASSWORD_SETUP,
    createdAt: { $lt: cutoff },
    role: null,
    // In Mongo `$eq: null` matches both an explicit null and a missing field,
    // which is what "never set a password" looks like on these rows.
    hashedPassword: { $eq: null },
    status: UserStatus.ACTIVE,
  });

  return { deleted: result.deletedCount ?? 0 };
}
