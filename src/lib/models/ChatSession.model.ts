import mongoose, { Schema } from 'mongoose';

const chatMessageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSessionSchema = new Schema(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [chatMessageSchema],
    weatherContextUsed: { type: Boolean, default: false },
    lastActivityAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

chatSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
chatSessionSchema.index({ farmerId: 1, lastActivityAt: -1 });

chatSessionSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type ChatSessionDoc = mongoose.InferSchemaType<typeof chatSessionSchema>;
const ChatSession: mongoose.Model<ChatSessionDoc> =
  (mongoose.models['ChatSession'] as mongoose.Model<ChatSessionDoc>) ??
  mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;
