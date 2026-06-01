import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { briefContextLibraryUpdateSchema } from '@/lib/validation/educationSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/admin/brief-contexts  — return the latest BriefContextLibrary version
// PUT /api/admin/brief-contexts  — publish a new versioned library update
// Auth: ADMIN
// The library is versioned (append-only). GET returns the highest version number.
// PUT creates a new document with version = current_latest + 1.
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    await connectDB();

    const { default: BriefContextLibrary } = await import('@/lib/models/BriefContextLibrary.model');

    const library = await BriefContextLibrary.findOne({} as object).sort({ version: -1 }).lean();

    if (!library) {
      throw new AppError('No brief context library found.', 404, 'DB_NOT_FOUND');
    }

    const version = (library as { version?: number }).version;
    logger.info('admin/brief-contexts', 'Library fetched', { requestId, version });

    return NextResponse.json({ data: library });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const body: unknown = await req.json();
    const parsed = briefContextLibraryUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'The submitted data is invalid.',
          code: 'VALIDATION_FAILED',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    await connectDB();

    const adminId = session!.user.id;
    const { default: BriefContextLibrary } = await import('@/lib/models/BriefContextLibrary.model');

    const latest = (await BriefContextLibrary.findOne({})
      .sort({ version: -1 })
      .lean()) as { version?: number } | null;

    const newVersion = (latest?.version ?? 0) + 1;

    const doc = await BriefContextLibrary.create({
      version: newVersion,
      updatedBy: adminId,
      contexts: parsed.data.contexts,
    });

    logger.info('admin/brief-contexts', 'Library updated', {
      requestId,
      adminId,
      version: newVersion,
      contextCount: parsed.data.contexts.length,
    });

    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
