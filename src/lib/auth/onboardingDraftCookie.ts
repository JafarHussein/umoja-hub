import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Signed cookie that carries the OnboardingDraft id across the OAuth round-trip
// (AUTH_ONBOARDING_FLOW_V2). The value is `<draftId>.<HMAC>` so a tampered or
// forged id is rejected — the raw ObjectId alone would let an attacker point at
// another in-flight draft. httpOnly + 30-min lifetime + the DB TTL bound it.
// ---------------------------------------------------------------------------

export const ONBOARDING_DRAFT_COOKIE = 'onboarding_draft';
const MAX_AGE_SECONDS = 30 * 60;

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error('NEXTAUTH_SECRET is not set');
  return s;
}

function hmac(id: string): string {
  return crypto.createHmac('sha256', secret()).update(id).digest('base64url');
}

export function signDraftId(id: string): string {
  return `${id}.${hmac(id)}`;
}

// Returns the verified draft id, or null if the cookie is absent/forged.
export function verifyDraftValue(value: string | undefined | null): string | null {
  if (!value) return null;
  const idx = value.lastIndexOf('.');
  if (idx <= 0) return null;
  const id = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const expected = hmac(id);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return id;
}

export const draftCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: MAX_AGE_SECONDS,
};

// Same attributes minus maxAge, with maxAge 0 — used to clear the cookie once a
// draft is consumed.
export const clearedDraftCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 0,
};
