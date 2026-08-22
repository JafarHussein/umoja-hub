// ---------------------------------------------------------------------------
// Upload constraints — the one definition, imported by both sides.
//
// `cloudinaryService` enforces these on the server and is authoritative. This
// module exists so the browser can enforce the *same* numbers before spending
// the user's bandwidth: the file input's `accept` attribute is a picker hint,
// not a check, so an oversized photo used to upload in full and only then come
// back rejected — the slowest possible way to say "too big" on a Kenyan mobile
// connection. No env access here, so it is safe in a client component.
// ---------------------------------------------------------------------------

/**
 * 4MB, for photographs.
 *
 * The number is about the person uploading, not the platform: a farmer
 * photographing a delivery on a Kenyan mobile connection should be stopped
 * before spending four minutes of data on a 9MB image, not after.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * 25MB, for a project report.
 *
 * A forty-page academic report carrying an architecture diagram, a schema
 * diagram and a dozen screenshots does not fit in 4MB, and telling a student to
 * degrade their evidence to make the upload fit would be the platform damaging
 * the thing it exists to collect. The photo limit stays where it is because it
 * answers a different question.
 *
 * The old ceiling this was sized against — a 4.5MB request body — no longer
 * applies; the platform accepts far larger bodies now, and 25MB is set by what
 * a report plausibly needs rather than by what the transport allows.
 */
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

/**
 * Project documentation is PDF only.
 *
 * Not a restriction for its own sake: the lecturer reads this inside UmojaHub,
 * and PDF is the one format that renders the same for them as it did for the
 * student. A .docx would render differently, or not at all, and the layout a
 * student spent time on is part of what is being assessed.
 */
export const DOCUMENT_MIME_TYPE = 'application/pdf';

/** Ready for a file input's `accept` attribute. */
export const UPLOAD_ACCEPT_ATTRIBUTE = ALLOWED_UPLOAD_MIME_TYPES.join(',');

/** A human-readable byte count: 4194304 → "4MB", 1258291 → "1.2MB". */
export function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${Number.isInteger(mb) ? mb : mb.toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

/**
 * Why this file cannot be uploaded, or null if it can. The message names the
 * limit and the accepted formats, because "invalid file" tells someone holding
 * a 9MB photo nothing about what to do next.
 */
export function describeUploadProblem(file: File): string | null {
  if (!(ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(file.type)) {
    return 'That file type is not supported. Upload a JPG, PNG, WebP or PDF.';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(
      MAX_UPLOAD_BYTES
    )} — try a smaller photo, or a clearer one taken at a lower resolution.`;
  }
  return null;
}

/**
 * Why this project report cannot be uploaded, or null if it can.
 *
 * Separate from `describeUploadProblem` because the answer is different: a
 * report is PDF only, and its size limit is much larger.
 */
export function describeDocumentProblem(file: File): string | null {
  if (file.type !== DOCUMENT_MIME_TYPE) {
    return 'Project documentation must be a PDF. Export your report to PDF and upload that — it is the one format your lecturer will see exactly as you wrote it.';
  }
  if (file.size === 0) {
    return 'That file is empty.';
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(
      MAX_DOCUMENT_BYTES
    )} — try exporting at a lower image quality rather than removing figures.`;
  }
  return null;
}

/** Cloudinary folders the upload endpoint accepts. */
export type UploadFolder =
  | 'umojahub/listings'
  | 'umojahub/verification'
  | 'umojahub/profiles'
  | 'umojahub/disputes';

/**
 * Checks the file locally, then uploads via `/api/upload` (which holds the
 * Cloudinary credentials). Throws with a message fit to show the user.
 */
export async function uploadFile(file: File, folder: UploadFolder): Promise<string> {
  const problem = describeUploadProblem(file);
  if (problem) throw new Error(problem);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = (await res.json()) as { data?: { url?: string }; error?: string };
  if (!res.ok || !data.data?.url) {
    throw new Error(data.error ?? 'The upload did not complete. Please try again.');
  }
  return data.data.url;
}
