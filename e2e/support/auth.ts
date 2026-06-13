import path from 'node:path';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// Per-role test fixtures for the Phase 4 harness.
//
// These are deterministic, harness-owned accounts (`e2e+<role>@umojahub.test`)
// provisioned idempotently by global-setup — they never touch the seed data set
// and are safe to run against any database. Each carries the verification state
// the role's screens branch on (e.g. UI-03 lockout overlays read `isVerified`).
//
// To add a fixture (e.g. an unverified farmer for UI-03), append a row here and
// global-setup will provision + mint a session for it on the next run.
// ---------------------------------------------------------------------------

export type E2ERole = 'farmer' | 'buyer' | 'student' | 'lecturer' | 'admin';

export interface E2EUserFixture {
  key: E2ERole;
  role: Role;
  email: string;
  firstName: string;
  /** Drives the role-specific `isVerified` session claim + DB sub-doc flag. */
  isVerified: boolean;
  /** A guarded route that exists today — used by the auth smoke test. */
  landing: string;
}

export const E2E_USERS: E2EUserFixture[] = [
  {
    key: 'farmer',
    role: Role.FARMER,
    email: 'e2e+farmer@umojahub.test',
    firstName: 'E2E Farmer',
    isVerified: true,
    landing: '/dashboard/farmer/listings',
  },
  {
    key: 'buyer',
    role: Role.BUYER,
    email: 'e2e+buyer@umojahub.test',
    firstName: 'E2E Buyer',
    isVerified: true,
    landing: '/dashboard/buyer/orders',
  },
  {
    key: 'student',
    role: Role.STUDENT,
    email: 'e2e+student@umojahub.test',
    firstName: 'E2E Student',
    isVerified: false,
    landing: '/dashboard/student',
  },
  {
    key: 'lecturer',
    role: Role.LECTURER,
    email: 'e2e+lecturer@umojahub.test',
    firstName: 'E2E Lecturer',
    isVerified: true,
    landing: '/dashboard/lecturer/queue',
  },
  {
    key: 'admin',
    role: Role.ADMIN,
    email: 'e2e+admin@umojahub.test',
    firstName: 'E2E Admin',
    isVerified: false,
    landing: '/dashboard/admin/verification-queue',
  },
];

/** Directory holding the per-role storage-state files (git-ignored). */
export const AUTH_DIR = path.join(__dirname, '..', '.auth');

/** Storage-state path for a role, consumed via `test.use({ storageState })`. */
export function authFile(role: E2ERole): string {
  return path.join(AUTH_DIR, `${role}.json`);
}
