/**
 * The one map from a role to the page that role calls home.
 *
 * This existed in three places that had already drifted apart: the middleware
 * sent a lecturer to `/dashboard/lecturer/queue`, while the access-denied
 * screen's "Go to my dashboard" button sent the same lecturer to
 * `/dashboard/lecturer/reviews/pending` — a route that does not exist, so
 * recovering from a permission error dropped them on a 404.
 *
 * Every landing page below is a real route. Keep it that way: this is the
 * destination for post-authentication redirects, access-denied recovery, and
 * the account menu, so a wrong entry here strands users in three places at once.
 */

import { Role } from '@/types';

export const ROLE_HOME: Record<Role, string> = {
  [Role.FARMER]: '/dashboard/farmer/listings',
  // Buyers live in the marketplace — `/dashboard/buyer` has no index route.
  [Role.BUYER]: '/marketplace',
  [Role.STUDENT]: '/dashboard/student',
  [Role.LECTURER]: '/dashboard/lecturer/queue',
  [Role.ADMIN]: '/dashboard/admin/verification-queue',
  [Role.INSTITUTION]: '/dashboard/institution',
};

/** Human-readable role name, for telling someone which account they are using. */
export const ROLE_LABEL: Record<Role, string> = {
  [Role.FARMER]: 'Farmer',
  [Role.BUYER]: 'Buyer',
  [Role.STUDENT]: 'Student',
  [Role.LECTURER]: 'Lecturer',
  [Role.ADMIN]: 'Admin',
  [Role.INSTITUTION]: 'Institution',
};

/** Home for a role, or the site root when the role is not yet known. */
export function homeForRole(role: Role | null | undefined): string {
  if (!role) return '/';
  return ROLE_HOME[role] ?? '/';
}
