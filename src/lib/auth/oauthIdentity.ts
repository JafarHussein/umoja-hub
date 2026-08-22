import type { Profile } from 'next-auth';
import { OAuthProvider } from '@/types';

// Everything we can learn about a person from their identity provider, so the
// onboarding flow never asks for something the provider already told us
// (AUTH_ONBOARDING_FLOW_V3).
//
// Google and GitHub expose different shapes: Google returns given_name/
// family_name/picture on an OIDC profile; GitHub returns a single `name` string,
// a `login` handle and an `avatar_url`. This module normalises both into the
// fields the User model stores, so the callback has no provider branching left.

export interface IOAuthIdentity {
  firstName: string;
  lastName: string;
  /** Provider avatar, when it supplies one. */
  profilePhotoUrl?: string;
  /** GitHub handle — seeds studentData.githubUsername. */
  githubLogin?: string;
  /** Candidate username, pre-sanitised but NOT yet checked for uniqueness. */
  usernameSeed: string;
}

interface IGoogleProfile {
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
}

interface IGitHubProfile {
  name?: string;
  login?: string;
  avatar_url?: string;
}

// Reduce any string to the username charset the platform allows: 3–20 chars of
// [a-z0-9_]. Returns '' when nothing usable survives, so the caller can fall
// back rather than persist a malformed handle.
export function sanitizeUsername(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20);
  return cleaned.length >= 3 ? cleaned : '';
}

// Split a single display name into first/last. Providers that give us the parts
// separately are handled before this is reached.
//
// Exported because email/password registration collects one name field and must
// store it exactly the way the OAuth path does — two implementations of "which
// part of this is the surname" would drift, and the identity step reads the
// result back as fact.
export function splitName(full: string | undefined): { firstName: string; lastName: string } {
  const tokens = (full ?? '').trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { firstName: '', lastName: '' };
  const [first, ...rest] = tokens;
  return { firstName: first ?? '', lastName: rest.join(' ') };
}

export function extractOAuthIdentity(
  provider: string,
  profile: Profile | undefined,
  email: string
): IOAuthIdentity {
  const emailLocalPart = email.split('@')[0] ?? email;

  if (provider === OAuthProvider.GITHUB) {
    const p = profile as IGitHubProfile | undefined;
    const split = splitName(p?.name);
    const identity: IOAuthIdentity = {
      // GitHub users often have no display name set; the handle is a better
      // greeting than an email fragment.
      firstName: split.firstName || p?.login || emailLocalPart,
      lastName: split.lastName,
      usernameSeed: sanitizeUsername(p?.login ?? emailLocalPart) || sanitizeUsername(emailLocalPart),
    };
    if (p?.avatar_url) identity.profilePhotoUrl = p.avatar_url;
    if (p?.login) identity.githubLogin = p.login;
    return identity;
  }

  // Google (and anything else OIDC-shaped).
  const p = profile as IGoogleProfile | undefined;
  const split = splitName(p?.name);
  const identity: IOAuthIdentity = {
    firstName: p?.given_name?.trim() || split.firstName || emailLocalPart,
    lastName: p?.family_name?.trim() || split.lastName,
    usernameSeed: sanitizeUsername(emailLocalPart),
  };
  if (p?.picture) identity.profilePhotoUrl = p.picture;
  return identity;
}

// Turn a username seed into one that is actually free, by appending a numeric
// suffix. `isTaken` is injected so this stays pure and unit-testable.
export async function resolveUniqueUsername(
  seed: string,
  isTaken: (candidate: string) => Promise<boolean>
): Promise<string> {
  const base = seed || 'member';
  if (!(await isTaken(base))) return base;

  // Cap the attempts: past a handful of collisions a random suffix is both
  // faster and less guessable than continuing to count.
  for (let n = 1; n <= 20; n++) {
    const candidate = `${base.slice(0, 20 - String(n).length - 1)}_${n}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 7);
    const candidate = `${base.slice(0, 20 - suffix.length - 1)}_${suffix}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error('Could not allocate a unique username');
}
