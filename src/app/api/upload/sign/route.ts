import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { env } from '@/lib/env';
import { Role } from '@/types';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// POST /api/upload/sign — Generate signed Cloudinary upload parameters
// Auth: FARMER | STUDENT | LECTURER
// Body: { folder: string }
// Returns: { apiKey, cloudName, timestamp, folder, signature }
// Client uploads the file directly to Cloudinary using these params, then
// sends the resulting secure_url + public_id to the resource API route.
// ---------------------------------------------------------------------------

const ALLOWED_FOLDERS = ['umojahub/listings', 'umojahub/verification', 'umojahub/profiles'] as const;

const signRequestSchema = z.object({
  folder: z.enum(ALLOWED_FOLDERS),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER, Role.STUDENT, Role.LECTURER, Role.ADMIN);

    const body: unknown = await req.json();
    const parsed = signRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(
        `folder must be one of: ${ALLOWED_FOLDERS.join(', ')}`,
        400,
        'VALIDATION_FAILED'
      );
    }

    const { folder } = parsed.data;
    const timestamp = Math.floor(Date.now() / 1000);
    const apiKey = env('CLOUDINARY_API_KEY');
    const apiSecret = env('CLOUDINARY_API_SECRET');
    const cloudName = env('CLOUDINARY_CLOUD_NAME');

    // Cloudinary signature: SHA-1 of sorted params string + api_secret
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = createHash('sha1')
      .update(`${paramsToSign}${apiSecret}`)
      .digest('hex');

    return NextResponse.json({
      data: {
        apiKey,
        cloudName,
        timestamp,
        folder,
        signature,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
