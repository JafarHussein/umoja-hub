/**
 * @jest-environment node
 *
 * AUTH_ONBOARDING_FLOW_V3 — the provider-identity extraction that lets
 * onboarding stop asking for things the provider already told us. If this
 * regresses, users get asked to retype their own name, which is the exact
 * friction the V3 redesign exists to remove.
 */

import type { Profile } from 'next-auth';
import {
  extractOAuthIdentity,
  resolveUniqueUsername,
  sanitizeUsername,
} from '../oauthIdentity';

// NextAuth's Profile is the OIDC base; Google and GitHub each add their own
// fields on top, so the fixtures are cast rather than declared against it.
const profile = (p: Record<string, unknown>): Profile => p as Profile;

describe('sanitizeUsername', () => {
  it('lowercases and replaces disallowed characters', () => {
    expect(sanitizeUsername('Wanjiku.Kamau')).toBe('wanjiku_kamau');
    expect(sanitizeUsername('brian-otieno')).toBe('brian_otieno');
  });

  it('collapses runs of underscores and trims the edges', () => {
    expect(sanitizeUsername('__a..b__')).toBe('a_b');
  });

  it('truncates to the 20-character limit', () => {
    expect(sanitizeUsername('a'.repeat(30))).toHaveLength(20);
  });

  it('returns empty when nothing usable survives, so the caller can fall back', () => {
    expect(sanitizeUsername('..')).toBe('');
    expect(sanitizeUsername('ab')).toBe('');
  });
});

describe('extractOAuthIdentity — Google', () => {
  it('prefers the structured given/family name over splitting the display name', () => {
    const id = extractOAuthIdentity(
      'google',
      profile({ given_name: 'Wanjiku', family_name: 'Kamau', name: 'Wrong Name', picture: 'https://p/x.jpg' }),
      'wanjiku.kamau@gmail.com'
    );
    expect(id.firstName).toBe('Wanjiku');
    expect(id.lastName).toBe('Kamau');
    expect(id.profilePhotoUrl).toBe('https://p/x.jpg');
    expect(id.usernameSeed).toBe('wanjiku_kamau');
  });

  it('falls back to splitting the display name', () => {
    const id = extractOAuthIdentity('google', profile({ name: 'Grace Ndungu' }), 'g@x.com');
    expect(id.firstName).toBe('Grace');
    expect(id.lastName).toBe('Ndungu');
  });

  it('keeps multi-word surnames intact', () => {
    const id = extractOAuthIdentity('google', profile({ name: 'Ana Maria De Souza' }), 'a@x.com');
    expect(id.firstName).toBe('Ana');
    expect(id.lastName).toBe('Maria De Souza');
  });

  it('falls back to the email local-part when the profile is bare', () => {
    const id = extractOAuthIdentity('google', profile({}), 'solo@gmail.com');
    expect(id.firstName).toBe('solo');
    expect(id.lastName).toBe('');
    expect(id.profilePhotoUrl).toBeUndefined();
  });
});

describe('extractOAuthIdentity — GitHub', () => {
  it('uses the handle for the username seed and captures it for studentData', () => {
    const id = extractOAuthIdentity(
      'github',
      profile({ login: 'brianotieno', name: 'Brian Otieno', avatar_url: 'https://gh/a.png' }),
      'brian@users.noreply.github.com'
    );
    expect(id.usernameSeed).toBe('brianotieno');
    expect(id.githubLogin).toBe('brianotieno');
    expect(id.firstName).toBe('Brian');
    expect(id.lastName).toBe('Otieno');
    expect(id.profilePhotoUrl).toBe('https://gh/a.png');
  });

  it('greets an unnamed GitHub user by handle rather than an email fragment', () => {
    const id = extractOAuthIdentity('github', profile({ login: 'devkenya' }), 'x7y2@users.noreply.github.com');
    expect(id.firstName).toBe('devkenya');
  });
});

describe('resolveUniqueUsername', () => {
  it('returns the seed untouched when it is free', async () => {
    expect(await resolveUniqueUsername('kamau', async () => false)).toBe('kamau');
  });

  it('appends a counter until it finds a free handle', async () => {
    const taken = new Set(['kamau', 'kamau_1', 'kamau_2']);
    expect(await resolveUniqueUsername('kamau', async (c) => taken.has(c))).toBe('kamau_3');
  });

  it('substitutes a fallback when the seed is empty', async () => {
    expect(await resolveUniqueUsername('', async () => false)).toBe('member');
  });

  it('keeps the result inside the 20-character limit when suffixing a long seed', async () => {
    const seed = 'a'.repeat(20);
    const taken = new Set([seed]);
    const result = await resolveUniqueUsername(seed, async (c) => taken.has(c));
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).not.toBe(seed);
  });
});
