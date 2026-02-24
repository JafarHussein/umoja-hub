import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import VerifiedSupplier from '@/lib/models/VerifiedSupplier.model';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role, SupplierVerificationStatus } from '@/types';
import { z } from 'zod';

const verifySupplierSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  decision: z.enum(['VERIFIED', 'SUSPENDED']),
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/verify-supplier — Admin approves or suspends a supplier
// Auth: ADMIN
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const body: unknown = await req.json();
    const parsed = verifySupplierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { supplierId, decision } = parsed.data;

    await connectDB();

    const supplier = await VerifiedSupplier.findById(supplierId);
    if (!supplier) {
      throw new AppError('Supplier not found.', 404, 'DB_NOT_FOUND');
    }

    const newStatus =
      decision === 'VERIFIED'
        ? SupplierVerificationStatus.VERIFIED
        : SupplierVerificationStatus.SUSPENDED;

    await VerifiedSupplier.findByIdAndUpdate(supplierId, {
      verificationStatus: newStatus,
      verifiedBy: decision === 'VERIFIED' ? session!.user.id : undefined,
      verifiedAt: decision === 'VERIFIED' ? new Date() : undefined,
    });

    logger.info('admin/verify-supplier', `Supplier ${decision.toLowerCase()}`, {
      supplierId,
      adminId: session!.user.id,
    });

    return NextResponse.json({
      data: { supplierId, verificationStatus: newStatus },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
