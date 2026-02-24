import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order.model';
import MarketplaceListing from '@/lib/models/MarketplaceListing.model';
import PriceHistory from '@/lib/models/PriceHistory.model';
import PriceAlert from '@/lib/models/PriceAlert.model';
import { updateOrderStatusSchema } from '@/lib/validation/orderSchema';
import { recalculate } from '@/lib/trust/farmerTrustCalculator';
import { sendSMS } from '@/lib/integrations/smsService';
import { AppError, handleApiError, logger } from '@/lib/utils';
import { Role, OrderPaymentStatus, OrderFulfillmentStatus, PriceHistorySource } from '@/types';
import User from '@/lib/models/User.model';

// ---------------------------------------------------------------------------
// PATCH /api/orders/[orderId]/status — Update fulfillment status
// Auth: FARMER (→ IN_FULFILLMENT) | BUYER (→ RECEIVED)
// Side effects on RECEIVED: trigger chain per BUSINESS_LOGIC.md §10
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Authentication required. Please sign in.', 401, 'AUTH_REQUIRED');
    }

    const { orderId } = await params;
    const body: unknown = await req.json();
    const parsed = updateOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'The submitted data is invalid. Check the details and try again.',
          code: 'VALIDATION_FAILED',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { fulfillmentStatus: newStatus } = parsed.data;

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('This order does not exist.', 404, 'ORDER_NOT_FOUND');
    }

    // Role-based transition rules:
    // FARMER: AWAITING_PAYMENT/PAID → IN_FULFILLMENT
    // BUYER: IN_FULFILLMENT → RECEIVED
    const userRole = session.user.role;
    const farmerId = String(order.farmerId);
    const buyerId = String(order.buyerId);

    if (newStatus === OrderFulfillmentStatus.IN_FULFILLMENT) {
      if (userRole !== Role.FARMER || farmerId !== session.user.id) {
        throw new AppError(
          'You do not have permission to perform this action.',
          403,
          'AUTH_FORBIDDEN'
        );
      }
      if (order.paymentStatus !== OrderPaymentStatus.PAID) {
        throw new AppError(
          'This order cannot be updated to the requested status at this stage.',
          409,
          'ORDER_INVALID_STATUS_TRANSITION'
        );
      }
    } else if (newStatus === OrderFulfillmentStatus.RECEIVED) {
      if (userRole !== Role.BUYER || buyerId !== session.user.id) {
        throw new AppError(
          'You do not have permission to perform this action.',
          403,
          'AUTH_FORBIDDEN'
        );
      }
      if (order.fulfillmentStatus !== OrderFulfillmentStatus.IN_FULFILLMENT) {
        throw new AppError(
          'This order cannot be updated to the requested status at this stage.',
          409,
          'ORDER_INVALID_STATUS_TRANSITION'
        );
      }
    } else {
      throw new AppError(
        'This order cannot be updated to the requested status at this stage.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    const now = new Date();

    if (newStatus === OrderFulfillmentStatus.IN_FULFILLMENT) {
      await Order.findByIdAndUpdate(orderId, {
        fulfillmentStatus: OrderFulfillmentStatus.IN_FULFILLMENT,
        confirmedByFarmerAt: now,
      });

      logger.info('orders', 'Order confirmed by farmer', { orderId, farmerId });
    } else if (newStatus === OrderFulfillmentStatus.RECEIVED) {
      // Step 1: Update Order → COMPLETED
      await Order.findByIdAndUpdate(orderId, {
        fulfillmentStatus: OrderFulfillmentStatus.COMPLETED,
        receivedByBuyerAt: now,
      });

      logger.info('orders', 'Order marked RECEIVED, trigger chain initiated', {
        orderId,
        farmerId,
        buyerId,
      });

      // Step 2: Insert PriceHistory record (ORDER_COMPLETED) — non-blocking
      (async () => {
        try {
          const listing = await MarketplaceListing.findById(order.listingId).lean();
          if (listing) {
            await PriceHistory.create({
              cropName: order.cropName,
              county: listing.pickupCounty,
              pricePerUnit: order.pricePerUnit,
              unit: order.unit,
              source: PriceHistorySource.ORDER_COMPLETED,
              farmerId: order.farmerId,
              orderId: order._id,
              recordedAt: now,
            });
          }
        } catch (err) {
          logger.error('orders', 'Failed to insert PriceHistory on completion', { orderId, err });
        }

        // Step 3: Recalculate farmer trust score
        try {
          await recalculate(farmerId);
        } catch (err) {
          logger.error('orders', 'Failed to recalculate trust score', { farmerId, err });
        }

        // Step 4: Check PriceAlert collection for matching crop/county alerts
        try {
          const listing = await MarketplaceListing.findById(order.listingId).lean();
          if (listing) {
            const cooldownCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const activeAlerts = await PriceAlert.find({
              cropName: order.cropName,
              county: listing.pickupCounty,
              isActive: true,
              targetPricePerUnit: { $lte: order.pricePerUnit },
              $or: [
                { lastTriggeredAt: { $lt: cooldownCutoff } },
                { lastTriggeredAt: { $exists: false } },
              ],
            });

            // Step 5: Send notifications for triggered alerts
            for (const alert of activeAlerts) {
              try {
                const alertFarmer = await User.findById(alert.farmerId).lean();
                if (alertFarmer) {
                  const msg = `UmojaHub Alert: ${alert.cropName} in ${alert.county} has reached your target price of KES ${alert.targetPricePerUnit}/unit.`;
                  await sendSMS(alertFarmer.phoneNumber, msg);
                }
                await PriceAlert.findByIdAndUpdate(alert._id, { lastTriggeredAt: now });
              } catch (alertErr) {
                logger.error('orders', 'Failed to process price alert', { alertId: String(alert._id), alertErr });
              }
            }
          }
        } catch (err) {
          logger.error('orders', 'Failed to check price alerts', { orderId, err });
        }
      })().catch((err) => {
        logger.error('orders', 'Trigger chain failed', { orderId, err });
      });
    }

    return NextResponse.json(
      {
        data: {
          orderId,
          newStatus:
            newStatus === OrderFulfillmentStatus.RECEIVED
              ? OrderFulfillmentStatus.COMPLETED
              : newStatus,
          updatedAt: now.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

