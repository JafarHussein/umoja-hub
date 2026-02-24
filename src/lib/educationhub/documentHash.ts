/**
 * Document hashing — tamper-evident SHA-256 hash for process documents.
 * File: src/lib/educationhub/documentHash.ts
 * Spec: BUSINESS_LOGIC.md §7
 */

import { createHash } from 'crypto';

/**
 * Hash document content using SHA-256.
 * Trims whitespace before hashing so trailing spaces don't affect the hash.
 */
export function hashDocument(content: string): string {
  return createHash('sha256').update(content.trim()).digest('hex');
}
