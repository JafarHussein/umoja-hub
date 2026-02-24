import mongoose, { Schema } from 'mongoose';
import { StudentTier, PortfolioStrength } from '@/types';

const verifiedProjectSchema = new Schema(
  {
    engagementId: { type: Schema.Types.ObjectId },
    title: { type: String },
    tier: { type: String, enum: Object.values(StudentTier) },
    techStack: [{ type: String }],
    verifiedAt: { type: Date },
    averageScore: { type: Number },
    lecturerInstitution: { type: String },
  },
  { _id: false }
);

const verifiedSkillSchema = new Schema(
  {
    skillName: { type: String },
    category: { type: String },
    tierDemonstrated: { type: String, enum: Object.values(StudentTier) },
    firstVerifiedAt: { type: Date },
    projectTitle: { type: String },
    engagementId: { type: Schema.Types.ObjectId },
  },
  { _id: false }
);

const tierProgressionSchema = new Schema(
  {
    tier: { type: String, enum: Object.values(StudentTier) },
    unlockedAt: { type: Date },
  },
  { _id: false }
);

const studentPortfolioStatusSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currentTier: {
      type: String,
      enum: Object.values(StudentTier),
      default: StudentTier.BEGINNER,
    },
    portfolioStrength: {
      type: String,
      enum: Object.values(PortfolioStrength),
      default: PortfolioStrength.BUILDING,
    },
    verifiedProjects: [verifiedProjectSchema],
    verifiedSkills: [verifiedSkillSchema],
    tierProgressionTimeline: [tierProgressionSchema],
    stats: {
      verifiedProjectCount: { type: Number, default: 0 },
      totalProjectCount: { type: Number, default: 0 },
      techStacksUsed: [{ type: String }],
      reviewerInstitutions: [{ type: String }],
    },
    lastRecalculatedAt: { type: Date },
  },
  { timestamps: true }
);

studentPortfolioStatusSchema.index({ studentId: 1 }, { unique: true });
studentPortfolioStatusSchema.index({ currentTier: 1, 'stats.verifiedProjectCount': -1 });

studentPortfolioStatusSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

type StudentPortfolioStatusDoc = mongoose.InferSchemaType<typeof studentPortfolioStatusSchema>;
const StudentPortfolioStatus: mongoose.Model<StudentPortfolioStatusDoc> =
  (mongoose.models['StudentPortfolioStatus'] as mongoose.Model<StudentPortfolioStatusDoc>) ??
  mongoose.model('StudentPortfolioStatus', studentPortfolioStatusSchema);

export default StudentPortfolioStatus;
