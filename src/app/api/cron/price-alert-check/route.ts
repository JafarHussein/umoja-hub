import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import PriceAlert from '@/lib/models/PriceAlert.model';
import PriceHistory from '@/lib/models/PriceHistory.model';
import User from '@/lib/models/User.model';
import { sendSMS } from '@/lib/integrations/smsService';
import { logger } from '@/lib/utils';
import { PRICE_ALERT_COOLDOWN_HOURS } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/cron/price-alert-check — Check active price alerts (every 15 min)
// Auth: Bearer CRON_SECRET
// Per BUSINESS_LOGIC.md §10.1
// Batch size: 50 alerts per run
// ---------------------------------------------------------------------------

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '').trim();
  return token === process.env['CRON_SECRET'];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_UNAUTHORIZED' }, { status: 401 });
  }

  await connectDB();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const cooldownCutoff = new Date(
    Date.now() - PRICE_ALERT_COOLDOWN_HOURS * 60 * 60 * 1000
  );

  // Process in batches of 50
  const alerts = await PriceAlert.find({ isActive: true })
    .limit(50)
    .lean();

  let checked = 0;
  let triggered = 0;

  for (const alert of alerts) {
    checked++;

    // Skip if triggered within the cooldown window
    if (alert.lastTriggeredAt && alert.lastTriggeredAt > cooldownCutoff) {
      continue;
    }

    // Compute average UmojaHub price from last 7 days
    const [agg] = await PriceHistory.aggregate([
      {
        $match: {
          cropName: alert.cropName,
          county: alert.county,
          recordedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$pricePerUnit' },
        },
      },
    ]);

    const currentAvg = agg?.avgPrice ?? null;

    if (currentAvg !== null && currentAvg >= alert.targetPricePerUnit) {
      // Trigger: send notification
      const farmer = await User.findById(alert.farmerId).select('firstName phoneNumber email').lean();

      if (farmer) {
        const message = `UmojaHub Alert: ${alert.cropName} in ${alert.county} has reached KES ${Math.round(currentAvg)}/unit, above your target of KES ${alert.targetPricePerUnit}. Visit the marketplace now.`;

        if (
          alert.notificationMethod === 'SMS' ||
          alert.notificationMethod === 'BOTH'
        ) {
          sendSMS(farmer.phoneNumber, message).catch(() => {
            // logged inside sendSMS
          });
        }

        // Mark as triggered
        await PriceAlert.findByIdAndUpdate(alert._id, {
          lastTriggeredAt: new Date(),
        });

        triggered++;
        logger.info('cron/price-alert-check', 'Price alert triggered', {
          alertId: alert._id,
          farmerId: alert.farmerId,
          cropName: alert.cropName,
          currentAvg,
          targetPrice: alert.targetPricePerUnit,
        });
      }
    }
  }

  logger.info('cron/price-alert-check', 'Price alert check complete', { checked, triggered });

  return NextResponse.json({ data: { checked, triggered } });
}
