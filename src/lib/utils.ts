import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

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
  logger.error('API', 'Unhandled error in API route', { error });

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return NextResponse.json(
      { error: 'Database validation error', code: 'DB_VALIDATION_ERROR', details: error.message },
      { status: 422 }
    );
  }

  if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
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
  session: { user: { role?: string } } | null,
  ...roles: string[]
): void {
  if (!session) {
    throw new AppError('Unauthorized', 401, 'AUTH_UNAUTHORIZED');
  }
  if (!session.user.role || !roles.includes(session.user.role)) {
    throw new AppError('Forbidden', 403, 'AUTH_FORBIDDEN');
  }
}

// ---------------------------------------------------------------------------
// logger — structured JSON logging for Vercel log capture
// ---------------------------------------------------------------------------

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

function log(level: LogLevel, service: string, message: string, meta?: object): void {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    ...(meta ?? {}),
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

import { createHash } from 'crypto';

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
