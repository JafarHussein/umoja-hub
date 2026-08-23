import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { BCRYPT_SALT_ROUNDS } from '@/types';

// ---------------------------------------------------------------------------
// cn — re-exported from the canonical definition in src/lib/cn.ts so there is
// a single implementation. Existing `@/lib/utils` imports keep working.
// ---------------------------------------------------------------------------

export { cn } from './cn';

// ---------------------------------------------------------------------------
// AppError — structured application error with HTTP status and error code
// ---------------------------------------------------------------------------

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string | undefined;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// handleApiError — converts any thrown value into a NextResponse
// ---------------------------------------------------------------------------

export function handleApiError(error: unknown): NextResponse {
  // ---------------------------------------------------------------------
  // An expected refusal is not an error.
  //
  // Every `AppError` used to be logged at ERROR with a full stack trace,
  // including the ones the application *decided* to return: a signed-out
  // visitor (401), a farmer who is not yet verified (403), an order that does
  // not exist for this buyer (404), a receipt asked for before payment (409).
  // Driving the app for an hour produced dozens of them, all describing correct
  // behaviour, each with a ten-frame stack. A log in which routine refusals are
  // indistinguishable from failures is a log nobody can find a failure in.
  //
  // A 4xx `AppError` is therefore recorded at `warn`, by code, without a stack —
  // enough to spot a spike in refusals, not enough to drown the thing that
  // actually broke. Anything 5xx, and anything that is not an `AppError` at
  // all, keeps ERROR and its stack: those are the ones nobody chose.
  // ---------------------------------------------------------------------
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error('API', 'Unhandled error in API route', { error });
    } else {
      logger.warn('API', 'Request refused', {
        status: error.statusCode,
        code: error.code,
        message: error.message,
      });
    }
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  logger.error('API', 'Unhandled error in API route', { error });

  if (error instanceof mongoose.Error.ValidationError) {
    return NextResponse.json(
      { error: 'Database validation error', code: 'DB_VALIDATION_ERROR', details: error.message },
      { status: 422 }
    );
  }

  // Mongoose duplicate key — check code directly so it works with both real
  // MongoServerError instances and the plain Error objects used in unit tests.
  const mongoCode = (error as { code?: number }).code;
  if (mongoCode === 11000) {
    return NextResponse.json(
      { error: 'Duplicate entry', code: 'DB_DUPLICATE' },
      { status: 409 }
    );
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

// ---------------------------------------------------------------------------
// requireRole — throws AppError if session is missing or role does not match
// ---------------------------------------------------------------------------

export function requireRole(
  session: { user: { role?: string | null } } | null,
  ...roles: string[]
): void {
  if (!session) {
    throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
  }
  if (!session.user.role || !roles.includes(session.user.role)) {
    throw new AppError('Forbidden', 403, 'AUTH_FORBIDDEN');
  }
}

// ---------------------------------------------------------------------------
// hashSecret / verifySecret — bcrypt wrappers for short-lived secrets
// (e.g. the student institutional-email pin). No passwords exist post-AUTH-07.
// ---------------------------------------------------------------------------

export async function hashSecret(secret: string): Promise<string> {
  return bcrypt.hash(secret, BCRYPT_SALT_ROUNDS);
}

export async function verifySecret(secret: string, hash: string): Promise<boolean> {
  return bcrypt.compare(secret, hash);
}

// ---------------------------------------------------------------------------
// logger — structured JSON logging for Vercel log capture
// ---------------------------------------------------------------------------

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

/**
 * `JSON.stringify(new Error('boom'))` is `{}` — name, message and stack are all
 * non-enumerable. Every log line carrying a caught error therefore recorded
 * nothing at all, and `handleApiError` logs exactly that on every unexpected
 * 500. Production had an error channel that reported only that *an* error had
 * happened, which is the one fact you already know from the status code.
 */
function serialiseErrors(meta: object): object {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    out[key] =
      value instanceof Error
        ? {
            name: value.name,
            message: value.message,
            ...(value.stack ? { stack: value.stack } : {}),
            // AppError and Mongo errors carry a code worth keeping.
            ...('code' in value ? { code: (value as { code?: unknown }).code } : {}),
            ...(value.cause !== undefined ? { cause: String(value.cause) } : {}),
          }
        : value;
  }
  return out;
}

function log(level: LogLevel, service: string, message: string, meta?: object): void {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    ...(meta ? serialiseErrors(meta) : {}),
  });

  if (level === 'ERROR') {
    console.error(entry); // eslint-disable-line no-console
  } else if (level === 'WARN') {
    console.warn(entry); // eslint-disable-line no-console
  } else {
    console.log(entry); // eslint-disable-line no-console
  }
}

export const logger = {
  error: (service: string, message: string, meta?: object) =>
    log('ERROR', service, message, meta),
  warn: (service: string, message: string, meta?: object) =>
    log('WARN', service, message, meta),
  info: (service: string, message: string, meta?: object) =>
    log('INFO', service, message, meta),
  debug: (service: string, message: string, meta?: object) => {
    if (process.env.NODE_ENV === 'development') {
      log('DEBUG', service, message, meta);
    }
  },
};

// ---------------------------------------------------------------------------
// hashContent — SHA-256 hex hash of a string (used for document integrity)
// ---------------------------------------------------------------------------

export function hashContent(content: string): string {
  return createHash('sha256').update(content.trim()).digest('hex');
}

// ---------------------------------------------------------------------------
// generateOrderReferenceId — UMJ-YYYY-XXXXXX format
// ---------------------------------------------------------------------------

export function generateOrderReferenceId(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequenceNumber).padStart(6, '0');
  return `UMJ-${year}-${padded}`;
}

// ---------------------------------------------------------------------------
// slugify — convert a string to a URL-safe slug
// ---------------------------------------------------------------------------

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// countWords — used for 50-word minimum comment validation
// ---------------------------------------------------------------------------

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
