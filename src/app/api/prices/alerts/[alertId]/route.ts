import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import PriceAlert from '@/lib/models/PriceAlert.model';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role } from '@/types';

type Params = { params: Promise<{ alertId: string }> };

// ---------------------------------------------------------------------------
// DELETE /api/prices/alerts/[alertId] — Delete a price alert
// Auth: FARMER (own alerts only)
// ---------------------------------------------------------------------------

export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const { alertId } = await params;
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    if (!mongoose.isValidObjectId(alertId)) {
      throw new AppError('Invalid alert ID.', 400, 'VALIDATION_FAILED');
    }

    await connectDB();

    const alert = await PriceAlert.findOneAndDelete({
      _id: alertId,
      farmerId: session!.user.id,
    });

    if (!alert) {
      throw new AppError('Alert not found.', 404, 'DB_NOT_FOUND');
    }

    logger.info('prices/alerts', 'Price alert deleted', {
      alertId,
      farmerId: session!.user.id,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
