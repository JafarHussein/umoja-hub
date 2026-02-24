/**
 * Order utility functions for the Food Hub.
 * Order reference ID generation per BUSINESS_LOGIC.md §6.
 */

import Order from '@/lib/models/Order.model';
import { generateOrderReferenceId as formatId } from '@/lib/utils';

/**
 * Generates a unique order reference ID in the format UMJ-YYYY-XXXXXX.
 * Uses the current order count to produce a sequential, zero-padded ID.
 * Example: UMJ-2025-000042
 */
export async function generateOrderReferenceId(): Promise<string> {
  const count = await Order.countDocuments();
  return formatId(count + 1);
}
