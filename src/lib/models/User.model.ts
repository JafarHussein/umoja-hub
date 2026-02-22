/**
 * User.model.ts — stub for Phase 0 completion.
 *
 * The full schema with all 22 fields (farmerData, studentData,
 * lecturerData, buyerData, etc.) is implemented in Phase 1.
 *
 * This stub is sufficient for:
 *   - auth/options.ts dynamic import to resolve
 *   - TypeScript compilation to pass
 *   - Build to succeed
 *
 * DO NOT add business logic here — implement the full schema in Phase 1
 * following SCHEMA_REFERENCE.md exactly.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { Role } from '@/types';

export interface IUserDocument extends Document {
  email: string;
  hashedPassword: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    hashedPassword: {
      type: String,
      required: true,
      select: false, // Never returned in queries by default
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret['__v'];
        delete ret['hashedPassword']; // Safety net — never serialise password
        return ret;
      },
    },
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// Hot-reload safe model registration
const User: Model<IUserDocument> =
  mongoose.models['User'] ?? mongoose.model<IUserDocument>('User', UserSchema);

export default User;
