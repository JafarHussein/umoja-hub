import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { loadVersionFileForReader } from '@/lib/education/reportAccess';
import { fetchDocument } from '@/lib/integrations/documentStorage';
import { AppError, handleApiError, logger } from '@/lib/utils';
import { DOCUMENT_MIME_TYPE } from '@/lib/uploads';

// ---------------------------------------------------------------------------
// GET /api/education/engagements/[id]/report/file/[versionId]
//
// The submitted PDF itself, streamed back to somebody entitled to read it.
//
// The bytes come through the application rather than from a storage URL. A
// storage URL is a permanent, unauthenticated way to read a student's academic
// work: anybody who is ever sent one keeps access for good, whatever the
// platform later decides about who may look. Reading through here means every
// read is a decision made now — which is what lets the same document be
// readable by a lecturer this week and by nobody next year.
//
// Auth: the student who wrote it, a verified lecturer at their institution, or
// the peer asked to read it. Everyone else is told it does not exist.
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AppError('Document not found.', 404, 'NOT_FOUND');
    }

    const { id, versionId } = await params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(versionId)) {
      throw new AppError('Document not found.', 404, 'NOT_FOUND');
    }

    await connectDB();

    const { publicId, fileName } = await loadVersionFileForReader({
      engagementId: id,
      versionId,
      userId: session.user.id,
      role: session.user.role ?? '',
    });

    const bytes = await fetchDocument(publicId);

    logger.info('education/report', 'Report version read', {
      engagementId: id,
      versionId,
      readerId: session.user.id,
      role: session.user.role,
    });

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': DOCUMENT_MIME_TYPE,
        // Inline, because the point is to read it in front of the checklist
        // rather than to collect a folder of downloads.
        'Content-Disposition': `inline; filename="${fileName.replace(/["\\]/g, '')}"`,
        'Content-Length': String(bytes.length),
        // Never a shared cache. This response is authorised for one reader.
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
