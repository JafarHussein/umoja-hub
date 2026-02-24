import mongoose, { Schema } from 'mongoose';
import { GroupOrderStatus } from '@/types';

const participatingMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
    mpesaTransactionId: { type: String },
    paidAt: { type: Date },
  },
  { _id: false }
);

const groupOrderSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'FarmerGroup', required: true },
    proposedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'VerifiedSupplier', required: true },
    inputType: { type: String, required: true },
    quantityPerMember: { type: Number, required: true },
    pricePerMember: { type: Number, required: true },
    joiningDeadline: { type: Date, required: true },
    minimumMembers: { type: Number, default: 5 },
    status: {
      type: String,
      enum: Object.values(GroupOrderStatus),
      default: GroupOrderStatus.OPEN,
    },
    participatingMembers: [participatingMemberSchema],
  },
  { timestamps: true }
);

groupOrderSchema.index({ groupId: 1, status: 1 });
groupOrderSchema.index({ joiningDeadline: 1, status: 1 });

groupOrderSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type GroupOrderDoc = mongoose.InferSchemaType<typeof groupOrderSchema>;
const GroupOrder: mongoose.Model<GroupOrderDoc> =
  (mongoose.models['GroupOrder'] as mongoose.Model<GroupOrderDoc>) ??
  mongoose.model('GroupOrder', groupOrderSchema);

export default GroupOrder;
