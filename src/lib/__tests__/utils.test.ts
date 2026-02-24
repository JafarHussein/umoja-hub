/**
 * @jest-environment node
 */
import {
  AppError,
  hashPassword,
  verifyPassword,
  requireRole,
  generateOrderReferenceId,
  slugify,
  countWords,
  hashContent,
} from '../utils';

// ---------------------------------------------------------------------------
// hashPassword / verifyPassword
// ---------------------------------------------------------------------------

describe('hashPassword', () => {
  it('returns a bcrypt hash string', async () => {
    const hash = await hashPassword('Secure@Password1');
    expect(typeof hash).toBe('string');
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  it('produces different hashes for the same password', async () => {
    const hash1 = await hashPassword('SamePassword1!');
    const hash2 = await hashPassword('SamePassword1!');
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifyPassword', () => {
  it('returns true for the correct password', async () => {
    const hash = await hashPassword('CorrectPassword!');
    await expect(verifyPassword('CorrectPassword!', hash)).resolves.toBe(true);
  });

  it('returns false for the wrong password', async () => {
    const hash = await hashPassword('CorrectPassword!');
    await expect(verifyPassword('WrongPassword!', hash)).resolves.toBe(false);
  });

  it('returns false for an empty password', async () => {
    const hash = await hashPassword('CorrectPassword!');
    await expect(verifyPassword('', hash)).resolves.toBe(false);
  });
});

// ---------------------------------------------------------------------------
// requireRole
// ---------------------------------------------------------------------------

describe('requireRole', () => {
  it('throws AUTH_REQUIRED with 401 when session is null', () => {
    expect(() => requireRole(null, 'FARMER')).toThrow(
      expect.objectContaining({ code: 'AUTH_REQUIRED', statusCode: 401 })
    );
  });

  it('throws AUTH_FORBIDDEN with 403 when role does not match', () => {
    const session = { user: { role: 'BUYER' } };
    expect(() => requireRole(session, 'FARMER')).toThrow(
      expect.objectContaining({ code: 'AUTH_FORBIDDEN', statusCode: 403 })
    );
  });

  it('throws AUTH_FORBIDDEN when user has no role', () => {
    const session = { user: {} };
    expect(() => requireRole(session, 'FARMER')).toThrow(
      expect.objectContaining({ code: 'AUTH_FORBIDDEN', statusCode: 403 })
    );
  });

  it('does not throw when role matches', () => {
    const session = { user: { role: 'FARMER' } };
    expect(() => requireRole(session, 'FARMER')).not.toThrow();
  });

  it('does not throw when role matches one of multiple accepted roles', () => {
    const session = { user: { role: 'ADMIN' } };
    expect(() => requireRole(session, 'FARMER', 'ADMIN')).not.toThrow();
  });

  it('throws AUTH_FORBIDDEN when role is not in the accepted list', () => {
    const session = { user: { role: 'STUDENT' } };
    expect(() => requireRole(session, 'FARMER', 'ADMIN')).toThrow(
      expect.objectContaining({ code: 'AUTH_FORBIDDEN', statusCode: 403 })
    );
  });
});

// ---------------------------------------------------------------------------
// AppError
// ---------------------------------------------------------------------------

describe('AppError', () => {
  it('sets name, message, statusCode, and code', () => {
    const err = new AppError('Not found', 404, 'DB_NOT_FOUND');
    expect(err.name).toBe('AppError');
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('DB_NOT_FOUND');
  });

  it('defaults statusCode to 500 when not provided', () => {
    const err = new AppError('Oops');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBeUndefined();
  });

  it('is an instance of Error', () => {
    expect(new AppError('test')).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// generateOrderReferenceId
// ---------------------------------------------------------------------------

describe('generateOrderReferenceId', () => {
  it('formats as UMJ-YYYY-XXXXXX', () => {
    const ref = generateOrderReferenceId(1);
    expect(ref).toMatch(/^UMJ-\d{4}-000001$/);
  });

  it('pads sequence numbers to 6 digits', () => {
    expect(generateOrderReferenceId(42)).toMatch(/^UMJ-\d{4}-000042$/);
    expect(generateOrderReferenceId(999999)).toMatch(/^UMJ-\d{4}-999999$/);
  });

  it('uses the current year', () => {
    const year = new Date().getFullYear().toString();
    expect(generateOrderReferenceId(1)).toContain(`UMJ-${year}-`);
  });
});

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify("Kenya's Best Maize!")).toBe('kenyas-best-maize');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello');
  });

  it('collapses multiple spaces into a single hyphen', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });

  it('handles already-lowercase input', () => {
    expect(slugify('post-harvest-storage')).toBe('post-harvest-storage');
  });
});

// ---------------------------------------------------------------------------
// countWords
// ---------------------------------------------------------------------------

describe('countWords', () => {
  it('counts words correctly', () => {
    expect(countWords('hello world')).toBe(2);
  });

  it('handles multiple spaces between words', () => {
    expect(countWords('hello   world')).toBe(2);
  });

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('returns 0 for whitespace-only string', () => {
    expect(countWords('   ')).toBe(0);
  });

  it('counts exactly 50 words correctly', () => {
    const text = Array.from({ length: 50 }, (_, i) => `word${i}`).join(' ');
    expect(countWords(text)).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// hashContent
// ---------------------------------------------------------------------------

describe('hashContent', () => {
  it('returns a 64-character hex string (SHA-256)', () => {
    const result = hashContent('some content');
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces the same hash for the same content', () => {
    expect(hashContent('consistent content')).toBe(hashContent('consistent content'));
  });

  it('trims whitespace before hashing', () => {
    expect(hashContent('  trimmed  ')).toBe(hashContent('trimmed'));
  });

  it('produces different hashes for different content', () => {
    expect(hashContent('content A')).not.toBe(hashContent('content B'));
  });
});
