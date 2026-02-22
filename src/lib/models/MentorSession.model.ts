import mongoose, { Schema } from 'mongoose';

const mentorMessageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    autoLogged: { type: Boolean, default: true },
  },
  { _id: false }
);

const mentorSessionSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    engagementId: { type: Schema.Types.ObjectId, ref: 'ProjectEngagement', required: true },
    messages: [mentorMessageSchema],
    lastActivityAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

mentorSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
mentorSessionSchema.index({ studentId: 1, engagementId: 1 });

mentorSessionSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

const MentorSession =
  mongoose.models.MentorSession ?? mongoose.model('MentorSession', mentorSessionSchema);

export default MentorSession;
