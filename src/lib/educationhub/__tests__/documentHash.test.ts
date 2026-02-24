/**
 * Unit tests for documentHash.ts
 * Spec: BUSINESS_LOGIC.md §7
 */

import { hashDocument } from '../documentHash';

describe('hashDocument', () => {
  test('returns a 64-character hex string (SHA-256)', () => {
    const hash = hashDocument('test content');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  test('same content produces same hash', () => {
    const content = 'My problem breakdown document content here.';
    expect(hashDocument(content)).toBe(hashDocument(content));
  });

  test('trailing whitespace is trimmed before hashing', () => {
    const base = 'My document content';
    expect(hashDocument(base)).toBe(hashDocument(`${base}   `));
    expect(hashDocument(base)).toBe(hashDocument(`   ${base}   `));
  });

  test('different content produces different hash', () => {
    const h1 = hashDocument('content A');
    const h2 = hashDocument('content B');
    expect(h1).not.toBe(h2);
  });

  test('empty string after trim still hashes correctly', () => {
    // Just validates it doesn't throw
    const hash = hashDocument('   ');
    expect(hash).toHaveLength(64);
  });

  test('long document hashes correctly', () => {
    const longContent = 'word '.repeat(1000);
    const hash = hashDocument(longContent);
    expect(hash).toHaveLength(64);
  });
});
