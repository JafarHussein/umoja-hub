import { createHash } from 'crypto';
import { env } from '@/lib/env';
import { AppError, logger } from '@/lib/utils';
import { DOCUMENT_MIME_TYPE, MAX_DOCUMENT_BYTES, formatBytes } from '@/lib/uploads';

// ---------------------------------------------------------------------------
// Storing a student's project report.
//
// Uses the Cloudinary account the platform already has rather than introducing
// a second storage provider — but not the existing `uploadImage` path, for two
// reasons that matter.
//
// The first is the resource type. A report is uploaded as `raw`, which stores
// the PDF byte for byte. The image endpoint treats a PDF as a renderable
// document and can transform it; a student's report must come back to their
// lecturer exactly as they submitted it, because the layout is part of what is
// being assessed.
//
// The second is delivery. Nothing here returns a URL to the browser. Reports
// are academic material, and a storage URL is a permanent, unauthenticated way
// to read one — anybody who ever sees it keeps access, whatever the platform
// later decides about who may look. Instead the public id is stored and the
// bytes are streamed back through an authorised route, so every read is a
// decision the application makes rather than one it made once at upload time.
// ---------------------------------------------------------------------------

export interface StoredDocument {
  /** Cloudinary's handle. Never sent to a browser. */
  publicId: string;
  bytes: number;
  /**
   * Pages, where the file said so. `undefined` means we could not tell, and
   * the interface says "unknown" rather than inventing a number.
   */
  pageCount?: number;
}

/**
 * How many pages this PDF has.
 *
 * Read from the file's own page-tree count rather than by parsing the document
 * properly. This is deliberately modest: it is right for the overwhelming
 * majority of PDFs and returns `undefined` rather than a wrong answer for the
 * rest — a linearised or incrementally-updated file can carry several `/Count`
 * entries, and a compressed cross-reference stream hides them entirely.
 *
 * The page count is a convenience on the lecturer's screen. It is never used to
 * accept or reject a submission, so being unable to determine it costs nothing,
 * and guessing would cost the platform's credibility the first time a lecturer
 * noticed the number was wrong.
 */
export function readPageCount(buffer: Buffer): number | undefined {
  const text = buffer.toString('latin1');

  // The page tree root carries the total. Take the largest, because a file with
  // incremental updates repeats the object and the last write wins.
  const counts = [...text.matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/g)].map((m) =>
    Number(m[1])
  );
  if (counts.length > 0) {
    const total = Math.max(...counts);
    if (Number.isFinite(total) && total > 0 && total < 10_000) return total;
  }

  // Failing that, count the page objects themselves. `/Type /Pages` is excluded
  // by the word boundary — without it every page tree node would be counted as
  // a page.
  const pages = [...text.matchAll(/\/Type\s*\/Page[^s]/g)].length;
  if (pages > 0 && pages < 10_000) return pages;

  return undefined;
}

/** Whether these bytes really are a PDF, whatever the upload claimed. */
export function looksLikePdf(buffer: Buffer): boolean {
  // A browser's reported MIME type is the file extension's opinion. The magic
  // number is the file's own.
  return buffer.subarray(0, 5).toString('latin1') === '%PDF-';
}

/**
 * Reports are stored as `private` assets. Cloudinary gives those no delivery
 * URL, so the only way to read one is a signature generated here.
 */
const PRIVATE_TYPE = 'private';

/** How long a generated download URL stays valid. Long enough for one read. */
const SIGNED_URL_TTL_SECONDS = 120;

function credentials(): {
  cloudName: string;
  auth: string;
  apiKey: string;
  apiSecret: string;
} {
  const cloudName = env('CLOUDINARY_CLOUD_NAME');
  const apiKey = env('CLOUDINARY_API_KEY');
  const apiSecret = env('CLOUDINARY_API_SECRET');
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  return { cloudName, auth, apiKey, apiSecret };
}

/** Store a submitted report. Validates the bytes before spending the upload. */
export async function storeDocument(file: File, folder: string): Promise<StoredDocument> {
  if (file.type !== DOCUMENT_MIME_TYPE) {
    throw new AppError(
      'Project documentation must be a PDF.',
      400,
      'EXT_CLOUDINARY_INVALID_TYPE'
    );
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new AppError(
      `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_DOCUMENT_BYTES)}.`,
      400,
      'EXT_CLOUDINARY_FILE_TOO_LARGE'
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.length === 0) {
    throw new AppError('That file is empty.', 400, 'VALIDATION_FAILED');
  }
  // A file named .pdf that is not a PDF would upload cleanly and then fail to
  // open in front of the lecturer. Better to refuse it here, where the student
  // can still do something about it.
  if (!looksLikePdf(buffer)) {
    throw new AppError(
      'That file is not a readable PDF. Export your report to PDF again and upload the new file.',
      400,
      'VALIDATION_FAILED'
    );
  }

  const { cloudName, auth } = credentials();
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(buffer)], { type: DOCUMENT_MIME_TYPE }), file.name);
  form.append('folder', folder);
  // Stored private, which means the asset has no delivery URL at all — not an
  // obscure one, none. It can only be read through a signature this server
  // generates, which is what makes "every read is a decision the application
  // makes" a property of the storage rather than a promise about our own code.
  form.append('type', PRIVATE_TYPE);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}` },
      body: form,
    });

    if (!res.ok) {
      const errorBody: unknown = await res.json().catch(() => null);
      logger.error('documentStorage', 'Upload failed', { status: res.status, error: errorBody });
      throw new AppError(
        'The upload did not complete. Please try again.',
        502,
        'EXT_CLOUDINARY_UPLOAD_FAILED'
      );
    }

    const data = (await res.json()) as { public_id: string; bytes: number };
    const pageCount = readPageCount(buffer);

    logger.info('documentStorage', 'Project documentation stored', {
      publicId: data.public_id,
      bytes: data.bytes,
      pageCount: pageCount ?? 'unknown',
    });

    return {
      publicId: data.public_id,
      bytes: data.bytes,
      ...(pageCount !== undefined ? { pageCount } : {}),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('documentStorage', 'Unexpected upload error', { error });
    throw new AppError(
      'The upload did not complete. Please try again.',
      502,
      'EXT_CLOUDINARY_UPLOAD_FAILED'
    );
  }
}

/**
 * Fetch a stored report's bytes, for streaming back through an authorised
 * route.
 *
 * The URL built here is signed, expires in two minutes, and never leaves the
 * server. It exists so Cloudinary will hand a private asset to us, not so
 * anybody else can reach one.
 *
 * This is the download API rather than the delivery host, and that is not a
 * detail. A private asset has no delivery URL, so `res.cloudinary.com` answers
 * `401 deny or ACL failure` for it however the request is authenticated —
 * which is what an earlier version of this function did, sending Basic
 * credentials to an endpoint that does not read them. Every submitted report
 * uploaded cleanly and then could not be opened by the lecturer it was
 * submitted to.
 */
export async function fetchDocument(publicId: string): Promise<Buffer> {
  const { cloudName, apiKey, apiSecret } = credentials();

  const timestamp = Math.floor(Date.now() / 1000);
  const expiresAt = timestamp + SIGNED_URL_TTL_SECONDS;

  // Cloudinary signs the parameters in alphabetical order, with the secret
  // appended and nothing between them.
  const signed = `attachment=false&expires_at=${expiresAt}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createHash('sha1').update(`${signed}${apiSecret}`).digest('hex');

  const url =
    `https://api.cloudinary.com/v1_1/${cloudName}/raw/download` +
    `?api_key=${apiKey}&attachment=false&expires_at=${expiresAt}` +
    `&public_id=${encodeURIComponent(publicId)}&timestamp=${timestamp}&signature=${signature}`;

  const res = await fetch(url);
  if (!res.ok) {
    logger.error('documentStorage', 'Could not read stored document', {
      publicId,
      status: res.status,
    });
    throw new AppError(
      'That document could not be read from storage.',
      502,
      'EXT_CLOUDINARY_UPLOAD_FAILED'
    );
  }

  return Buffer.from(await res.arrayBuffer());
}
