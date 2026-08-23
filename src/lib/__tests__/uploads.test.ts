/**
 * @jest-environment node
 */
import {
  ALLOWED_PHOTO_MIME_TYPES,
  describePhotoProblem,
  describeUploadProblem,
  formatBytes,
  MAX_UPLOAD_BYTES,
  PHOTO_ACCEPT_ATTRIBUTE,
} from '../uploads';

/** A File of a given type and size, without allocating the bytes. */
function fileOf(type: string, size: number, name = 'photo'): File {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

// ---------------------------------------------------------------------------
// describePhotoProblem
//
// A verification document may legitimately be a scanned PDF. A photograph of
// produce may not: the marketplace renders it as an image, so a PDF would
// upload successfully and then render as nothing on the card a buyer decides
// from. This is the only rule that differs from the shared one.
// ---------------------------------------------------------------------------

describe('describePhotoProblem', () => {
  it('accepts the photograph formats', () => {
    for (const type of ALLOWED_PHOTO_MIME_TYPES) {
      expect(describePhotoProblem(fileOf(type, 1024))).toBeNull();
    }
  });

  it('refuses a PDF, which the shared document rule allows', () => {
    const pdf = fileOf('application/pdf', 1024, 'report.pdf');

    expect(describeUploadProblem(pdf)).toBeNull();
    expect(describePhotoProblem(pdf)).toContain('not a photograph');
  });

  it('refuses a file that is not an image at all', () => {
    expect(describePhotoProblem(fileOf('text/plain', 10))).toContain('not a photograph');
  });

  it('defers to the shared size limit, and names the actual size', () => {
    const tooBig = fileOf('image/jpeg', MAX_UPLOAD_BYTES + 1);
    const problem = describePhotoProblem(tooBig);

    expect(problem).not.toBeNull();
    expect(problem).toContain(formatBytes(MAX_UPLOAD_BYTES));
  });

  it('accepts a file exactly on the limit', () => {
    expect(describePhotoProblem(fileOf('image/webp', MAX_UPLOAD_BYTES))).toBeNull();
  });
});

describe('PHOTO_ACCEPT_ATTRIBUTE', () => {
  it('offers the image formats and not PDF', () => {
    expect(PHOTO_ACCEPT_ATTRIBUTE).toContain('image/jpeg');
    expect(PHOTO_ACCEPT_ATTRIBUTE).toContain('image/png');
    expect(PHOTO_ACCEPT_ATTRIBUTE).toContain('image/webp');
    expect(PHOTO_ACCEPT_ATTRIBUTE).not.toContain('application/pdf');
  });
});
