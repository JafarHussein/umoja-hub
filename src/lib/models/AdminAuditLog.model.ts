import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// AdminAuditLog — append-only record of all admin actions.
// Never delete or update rows; add new entries only.
// ---------------------------------------------------------------------------

export interface IAdminAuditLogDocument extends Document {
  adminId: mongoose.Types.ObjectId;
  action: string;
  targetId: mongoose.Types.ObjectId;
  targetType: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

const adminAuditLogSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    action: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    targetType: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

adminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetId: 1 });

const AdminAuditLog: Model<IAdminAuditLogDocument> =
  (mongoose.models['AdminAuditLog'] as Model<IAdminAuditLogDocument>) ??
  mongoose.model<IAdminAuditLogDocument>('AdminAuditLog', adminAuditLogSchema);

export default AdminAuditLog;
