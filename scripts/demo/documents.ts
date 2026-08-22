// The demo world's stored report files.
//
// Seeded reports are real PDFs in the same storage the application uploads to,
// because the application reads them back through its own authorised route and
// a version pointing at nothing would fail the moment a presenter clicked it.
//
// They live in their own folder so that a reset can remove exactly what the
// demo put there and nothing else. Deleting stored documents is not something
// the platform does — a submitted report is academic record and `src/` has no
// path that removes one — so the delete lives here, in the seeder, where its
// only subject is the seeder's own files.

import { log } from './db';

const DEMO_REPORT_FOLDER = 'umojahub/demo-project-reports';

function credentials(): { cloudName: string; auth: string } {
  const cloudName = process.env['CLOUDINARY_CLOUD_NAME'] ?? '';
  const key = process.env['CLOUDINARY_API_KEY'] ?? '';
  const secret = process.env['CLOUDINARY_API_SECRET'] ?? '';

  if (!cloudName || !key || !secret) {
    throw new Error(
      'Seeding project reports needs CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local.'
    );
  }

  return { cloudName, auth: Buffer.from(`${key}:${secret}`).toString('base64') };
}

export interface UploadedReport {
  publicId: string;
  bytes: number;
  /**
   * Read out of the PDF by the application's own page counter, not asserted
   * here. The number a lecturer sees is then the document's claim about itself,
   * exactly as it would be for a report a student uploaded.
   */
  pageCount: number | undefined;
}

/**
 * Store one seeded report.
 *
 * Goes through the application's own upload path rather than a second one, so
 * that whatever the platform enforces about a submitted report — it is a PDF,
 * it is within the size limit, its bytes begin with `%PDF-` — is enforced about
 * the seeded ones too. A demo world the application would have refused is a
 * demo world that proves nothing.
 */
export async function uploadDemoReport(pdf: Buffer, fileName: string): Promise<UploadedReport> {
  const { storeDocument, readPageCount } = await import(
    '../../src/lib/integrations/documentStorage'
  );

  const file = new File([new Uint8Array(pdf)], fileName, { type: 'application/pdf' });
  const stored = await storeDocument(file, DEMO_REPORT_FOLDER);

  return { publicId: stored.publicId, bytes: stored.bytes, pageCount: readPageCount(pdf) };
}

/**
 * Remove every report this seeder has ever stored.
 *
 * Called by the reset, which otherwise leaves the demo's files behind on every
 * run — the storage equivalent of the orphaned records the reset already
 * clears. Failure is logged and swallowed: an unreachable storage account must
 * not stop a database reset, and the worst case is files nobody references.
 */
export async function purgeDemoReports(): Promise<number> {
  let cloudName: string;
  let auth: string;
  try {
    ({ cloudName, auth } = credentials());
  } catch {
    return 0;
  }

  let removed = 0;

  try {
    // The API deletes at most 100 at a time and reports what it took, so the
    // loop ends when a call takes nothing rather than after a fixed number.
    for (let round = 0; round < 20; round += 1) {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/raw/private?prefix=${encodeURIComponent(DEMO_REPORT_FOLDER)}`,
        { method: 'DELETE', headers: { Authorization: `Basic ${auth}` } }
      );
      if (!res.ok) break;

      const body = (await res.json()) as { deleted?: Record<string, string> };
      const count = Object.keys(body.deleted ?? {}).length;
      removed += count;
      if (count === 0) break;
    }
  } catch (error) {
    log(`could not clear stored demo reports: ${String(error)}`);
  }

  return removed;
}
