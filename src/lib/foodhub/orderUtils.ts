import { generateOrderReferenceId as formatId } from '@/lib/utils';

// Generates a unique order reference ID in the format UMJ-YYYY-XXXXXX.
// Uses an atomic MongoDB $inc counter to prevent race-condition duplicates
// that would arise from the previous countDocuments()-based approach.
export async function generateOrderReferenceId(): Promise<string> {
  const { default: Counter } = await import('@/lib/models/Counter.model');
  const counter = await Counter.findOneAndUpdate(
    { _id: 'order_ref_id' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return formatId(counter!.seq);
}
