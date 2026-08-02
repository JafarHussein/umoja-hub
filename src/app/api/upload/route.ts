import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { uploadImage } from '@/lib/integrations/cloudinaryService';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/upload — Server-side file upload to Cloudinary.
// Auth: FARMER | BUYER | STUDENT | LECTURER | ADMIN.
// Body: multipart/form-data { file: File, folder: string }
// Returns: { data: { url, publicId } }
//
// The client posts the raw file here and the server uploads it using the
// env.ts-validated CLOUDINARY_* credentials. This deliberately replaces the
// previous client-only unsigned-preset path (process.env.NEXT_PUBLIC_*), which
// silently failed whenever those public vars were absent from the running build
// or a deployment — leaving verification uploads dead. MIME and size are
// validated inside cloudinaryService.uploadImage.
// ---------------------------------------------------------------------------

const ALLOWED_FOLDERS = [
  'umojahub/listings',
  'umojahub/verification',
  'umojahub/profiles',
  // Photographic evidence attached to a mediation case by either party.
  'umojahub/disputes',
];

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER, Role.BUYER, Role.STUDENT, Role.LECTURER, Role.ADMIN);

    const form = await req.formData();
    const file = form.get('file');
    const folder = form.get('folder');

    if (!(file instanceof File)) {
      throw new AppError('No file was provided.', 400, 'VALIDATION_FAILED');
    }
    if (typeof folder !== 'string' || !ALLOWED_FOLDERS.includes(folder)) {
      throw new AppError(
        `folder must be one of: ${ALLOWED_FOLDERS.join(', ')}`,
        400,
        'VALIDATION_FAILED'
      );
    }

    const result = await uploadImage(file, folder);

    logger.info('upload', 'File uploaded', {
      userId: session!.user.id,
      folder,
      publicId: result.publicId,
    });

    return NextResponse.json({ data: { url: result.url, publicId: result.publicId } });
  } catch (error) {
    return handleApiError(error);
  }
}
