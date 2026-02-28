import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import BriefContextLibrary from '@/lib/models/BriefContextLibrary.model';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role } from '@/types';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// GET /api/admin/brief-context — Read current BriefContextLibrary
// Auth: ADMIN
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    await connectDB();

    const library = await BriefContextLibrary.findOne({}).sort({ updatedAt: -1 }).lean();

    if (!library) {
      return NextResponse.json(
        { error: 'BriefContextLibrary has not been seeded yet.', code: 'DB_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: library });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/brief-context — Admin updates BriefContextLibrary
// Auth: ADMIN
// Increments version on every save.
// ---------------------------------------------------------------------------

const contextItemSchema = z.object({
  id: z.string().min(1),
  industryName: z.string().min(1),
  description: z.string().min(10),
  clientPersonaTemplate: z
    .object({
      businessTypes: z.array(z.string()),
      counties: z.array(z.string()),
      contexts: z.array(z.string()),
    })
    .optional(),
  problemDomains: z.array(z.string()),
  kenyanConstraints: z.array(z.string()),
  exampleProjects: z.array(z.string()),
  targetTiers: z.array(z.string()),
});

const patchBriefContextSchema = z.object({
  contexts: z.array(contextItemSchema).min(1),
});

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const body: unknown = await req.json();
    const parsed = patchBriefContextSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const current = await BriefContextLibrary.findOne({}).sort({ updatedAt: -1 });
    const newVersion = current ? (current.version as number) + 1 : 1;

    const updated = await BriefContextLibrary.findOneAndUpdate(
      {},
      {
        $set: {
          contexts: parsed.data.contexts,
          version: newVersion,
          updatedBy: session!.user.id,
        },
      },
      { upsert: true, new: true }
    );

    if (!updated) {
      throw new AppError('Failed to update BriefContextLibrary.', 500, 'SERVER_INTERNAL');
    }

    logger.info('admin/brief-context', 'BriefContextLibrary updated', {
      adminId: session!.user.id,
      version: newVersion,
      contextCount: parsed.data.contexts.length,
    });

    return NextResponse.json({
      data: {
        version: newVersion,
        contextCount: parsed.data.contexts.length,
        updatedAt: (updated.updatedAt as Date).toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
