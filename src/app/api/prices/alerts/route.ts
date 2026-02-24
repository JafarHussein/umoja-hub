import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import PriceAlert from '@/lib/models/PriceAlert.model';
import { priceAlertSchema } from '@/lib/validation/priceSchema';
import { handleApiError, requireRole, logger } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/prices/alerts — Create price alert
// Auth: FARMER
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    const body: unknown = await req.json();
    const parsed = priceAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const alert = await PriceAlert.create({
      farmerId: session!.user.id,
      ...parsed.data,
      isActive: true,
    });

    logger.info('prices/alerts', 'Price alert created', {
      alertId: alert._id,
      farmerId: session!.user.id,
      cropName: parsed.data.cropName,
      county: parsed.data.county,
    });

    return NextResponse.json({ data: alert }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/prices/alerts — List farmer's active alerts
// Auth: FARMER
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    await connectDB();

    const alerts = await PriceAlert.find({
      farmerId: session!.user.id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: alerts });
  } catch (error) {
    return handleApiError(error);
  }
}
