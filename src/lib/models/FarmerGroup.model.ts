import mongoose, { Schema } from 'mongoose';
import { GroupStatus } from '@/types';

const farmerGroupSchema = new Schema(
  {
    groupName: { type: String, required: true, trim: true },
    county: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    memberCount: { type: Number, default: 1 },
    status: { type: String, enum: Object.values(GroupStatus), default: GroupStatus.ACTIVE },
  },
  { timestamps: true }
);

farmerGroupSchema.index({ county: 1, status: 1 });
farmerGroupSchema.index({ createdBy: 1 });

farmerGroupSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type FarmerGroupDoc = mongoose.InferSchemaType<typeof farmerGroupSchema>;
const FarmerGroup: mongoose.Model<FarmerGroupDoc> =
  (mongoose.models['FarmerGroup'] as mongoose.Model<FarmerGroupDoc>) ??
  mongoose.model('FarmerGroup', farmerGroupSchema);

export default FarmerGroup;
