import mongoose, { Schema } from 'mongoose';

// Atomic sequence counter — used for generating unique order reference IDs.
// Each document represents one named counter (e.g. 'order_ref_id').
// Use findOneAndUpdate($inc) to atomically read-and-increment.

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

type CounterDoc = mongoose.InferSchemaType<typeof counterSchema>;
const Counter: mongoose.Model<CounterDoc> =
  (mongoose.models['Counter'] as mongoose.Model<CounterDoc>) ??
  mongoose.model('Counter', counterSchema);

export default Counter;
