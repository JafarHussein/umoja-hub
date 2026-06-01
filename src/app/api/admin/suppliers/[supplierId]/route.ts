import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError, requireRole } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// GET /api/admin/suppliers/[supplierId] — Fetch single supplier for admin review
// Auth: ADMIN
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const { supplierId } = await params;

    await connectDB();

    const { default: VerifiedSupplier } = await import('@/lib/models/VerifiedSupplier.model');

    const supplier = await VerifiedSupplier.findById(supplierId).lean();

    if (!supplier) {
      throw new AppError('Supplier not found.', 404, 'DB_NOT_FOUND');
    }

    return NextResponse.json({ data: supplier });
  } catch (error) {
    return handleApiError(error);
  }
}
