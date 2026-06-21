import mongoose, { Schema } from 'mongoose';
import { SimulationRunStatus } from '@/types';

// ---------------------------------------------------------------------------
// SimulationRun — the side-ledger for the ecosystem simulation engine. It is the
// ONLY tracking mechanism: every document the simulator creates is recorded here
// as a { collection, id } pair under a runId. seed:reset / seed:rebuild delete
// exactly those documents and nothing else, so genuine user data (which is never
// recorded in any run) can never be touched. The engine never drops collections
// or runs unscoped deletes.
// ---------------------------------------------------------------------------

const trackedEntitySchema = new Schema(
  {
    collection: { type: String, required: true },
    id: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);

const simulationRunSchema = new Schema(
  {
    runId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: Object.values(SimulationRunStatus),
      default: SimulationRunStatus.BUILDING,
    },
    // Reproducibility: the numeric seed the deterministic RNG was initialised
    // with for this run.
    seed: { type: Number, required: true },
    // Per-collection counts, for a human-readable summary.
    counts: { type: Schema.Types.Mixed, default: {} },
    // The full manifest of created documents — the delete target for a reset.
    entities: { type: [trackedEntitySchema], default: [] },
    notes: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

simulationRunSchema.index({ runId: 1 }, { unique: true });
simulationRunSchema.index({ createdAt: -1 });

simulationRunSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type SimulationRunDoc = mongoose.InferSchemaType<typeof simulationRunSchema>;
const SimulationRun: mongoose.Model<SimulationRunDoc> =
  (mongoose.models['SimulationRun'] as mongoose.Model<SimulationRunDoc>) ??
  mongoose.model('SimulationRun', simulationRunSchema);

export default SimulationRun;
