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

/** 4MB — Vercel's request payload ceiling is 4.5MB. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

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
