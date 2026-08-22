import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/education/engagements/[id] — one of the student's own projects.
//
// Separate from `/engagements/me`, which answers a different question: *which
// project am I working on now*, and therefore returns nothing once a project is
// finished. Every student screen resolved a project through that route, so a
// student whose project was approved could no longer open it — their completed
// work disappeared from the workspace at the moment it was signed off, and the
// outcome they had waited for was the one thing they could not read.
//
// A project is addressed by its id here, and ownership is in the query rather
// than in a check afterwards: an engagement that is not this student's is
// indistinguishable from one that does not exist.
//
// Auth: STUDENT, owner of the engagement.
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Project not found.', 404, 'NOT_FOUND');
    }

    await connectDB();

    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');
    const engagement = await ProjectEngagement.findOne({
      _id: id,
      studentId: session!.user.id,
    } as object).lean();

    if (!engagement) throw new AppError('Project not found.', 404, 'NOT_FOUND');

    return NextResponse.json({ data: engagement });
  } catch (error) {
    return handleApiError(error);
  }
}
