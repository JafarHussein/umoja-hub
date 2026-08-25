import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import PriceAlert from '@/lib/models/PriceAlert.model';
import PriceHistory from '@/lib/models/PriceHistory.model';
import User from '@/lib/models/User.model';
import { sendSMS } from '@/lib/integrations/smsService';
import { logger } from '@/lib/utils';
import { isSimulationActive } from '@/lib/payments';
import { dispatchDuePayments } from '@/lib/payments/dispatcher';
import { reconcileStuckPayments } from '@/lib/payments/reconcile';
import { cropNamePattern, matchesCrop, resolveCrop } from '@/lib/taxonomy/crops';
import { PRICE_ALERT_COOLDOWN_HOURS } from '@/types';

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// POST /api/cron/price-alert-check — the daily scheduled job.
// Auth: Bearer CRON_SECRET. Batch size: 50 alerts per run.
//
// Runs three jobs: price-alert checks, the simulated
// callback delivery sweep, and stuck-payment reconciliation. They share one
// route because Vercel Hobby allows only two cron jobs per project; the two
// payment jobs are backstops whose timely triggers live on the request path
// (see dispatcher.ts and reconcile.ts).
//
// Cadence is DAILY (`0 0 * * *` in vercel.json) — Hobby does not permit
// sub-daily cron invocations. Nothing here may assume a tighter interval.
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

  const requestId = crypto.randomUUID();
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

    // `unit` is required by the PriceAlert schema, so an alert without one is
    // malformed. Skip it rather than averaging across units — and skip rather
    // than throw, so one bad row cannot kill the rest of the batch.
    if (!alert.unit) {
      logger.warn('cron/price-alert-check', 'Alert has no unit; skipping', {
        alertId: String(alert._id),
        cropName: alert.cropName,
      });
      continue;
    }

    // Average UmojaHub price over the last 7 days for the alert's own crop AND
    // unit. Both matter: the crop name previously had to match exactly (so an
    // alert on "Milk" saw none of the engine's "dairy" data), and with no unit
    // filter a KES 3,600/BAG maize row was averaged against KES 40/KG rows
    // before being compared to a target quoted in one of them.
    const alertCropId = resolveCrop(alert.cropName);
    const rows = (
      await PriceHistory.find({
        cropName: alertCropId ? cropNamePattern(alertCropId) : alert.cropName,
        county: alert.county,
        unit: new RegExp('^' + escapeRegex(alert.unit.trim()) + '$', 'i'),
        recordedAt: { $gte: sevenDaysAgo },
      })
        .select('cropName pricePerUnit')
        .lean()
    ).filter((p) => (alertCropId ? matchesCrop(p.cropName, alertCropId) : true));

    const currentAvg =
      rows.length > 0 ? rows.reduce((sum, p) => sum + p.pricePerUnit, 0) / rows.length : null;

    if (currentAvg !== null && currentAvg >= alert.targetPricePerUnit) {
      // Trigger: send notification
      const farmer = await User.findById(alert.farmerId).select('firstName phoneNumber email').lean();

      if (farmer) {
        const message = `UmojaHub Alert: ${alert.cropName} in ${alert.county} has reached KSh ${Math.round(currentAvg)}/unit, above your target of KSh ${alert.targetPricePerUnit}. Visit the marketplace now.`;

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
          requestId,
          alertId: alert._id,
          farmerId: alert.farmerId,
          cropName: alert.cropName,
          currentAvg,
          targetPrice: alert.targetPricePerUnit,
        });
      }
    }
  }

  logger.info('cron/price-alert-check', 'Price alert check complete', { requestId, checked, triggered });

  // ---------------------------------------------------------------------------
  // Simulated-callback delivery sweep (simulation mode only).
  // The reliability trigger for delayed/late callbacks when the buyer is no
  // longer polling. Delivers due simulated payments through the shared
  // processor; LOST ones fall through to the reconciliation pass below.
  // ---------------------------------------------------------------------------
  let simDelivered = 0;
  if (isSimulationActive()) {
    try {
      simDelivered = await dispatchDuePayments({ limit: 50 });
    } catch (err) {
      logger.error('cron/price-alert-check', 'Simulated callback sweep failed', { requestId, err });
    }
  }

  // ---------------------------------------------------------------------------
  // Stuck payment reconciliation — the unscoped backstop sweep.
  //
  // The timely path is the buyer's payment-status poll, which reconciles their
  // own order the moment it times out. This sweep exists for orders nobody is
  // watching. It cannot be the primary trigger: Vercel Hobby permits only daily
  // cron invocations (and only two crons per project), so this runs once a day.
  // See src/lib/payments/reconcile.ts.
  // ---------------------------------------------------------------------------
  let reconciled = 0;
  try {
    reconciled = await reconcileStuckPayments({ limit: 20 });
  } catch (err) {
    logger.error('cron/price-alert-check', 'Stuck payment reconciliation failed', { requestId, err });
  }

  if (reconciled > 0) {
    logger.info('cron/price-alert-check', 'Stuck payment reconciliation complete', { requestId, reconciled });
  }

  return NextResponse.json({ data: { checked, triggered, simDelivered, reconciled } });
}

// ---------------------------------------------------------------------------
// Vercel Cron invokes scheduled paths with GET. Only POST was exported, so the
// entries in vercel.json silently never ran. Both verbs execute the same job
// behind the same Bearer CRON_SECRET check.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  return POST(req);
}
