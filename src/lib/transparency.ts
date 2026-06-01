import { connectDB } from '@/lib/db';
import { ProjectStatus } from '@/types';

export interface TransparencyData {
  verifiedFarmers: number;
  counties: number;
  completedOrders: number;
  verifiedProjects: number;
  articles: number;
  lastUpdated: string;
}

export async function getTransparencyData(): Promise<TransparencyData> {
  await connectDB();

  const [
    { default: PlatformImpactSummary },
    { default: ProjectEngagement },
    { default: KnowledgeArticle },
  ] = await Promise.all([
    import('@/lib/models/PlatformImpactSummary.model'),
    import('@/lib/models/ProjectEngagement.model'),
    import('@/lib/models/KnowledgeArticle.model'),
  ]);

  const [snapshot, verifiedProjects, articles] = await Promise.all([
    PlatformImpactSummary.findOne().lean(),
    ProjectEngagement.countDocuments({ status: ProjectStatus.VERIFIED }),
    KnowledgeArticle.countDocuments({ isPublished: true }),
  ]);

  const snap = snapshot as {
    food?: {
      verifiedFarmerCount?: number;
      countiesRepresented?: number;
      completedOrderCount?: number;
    };
    computedAt?: Date;
  } | null;

  return {
    verifiedFarmers: snap?.food?.verifiedFarmerCount ?? 0,
    counties: snap?.food?.countiesRepresented ?? 0,
    completedOrders: snap?.food?.completedOrderCount ?? 0,
    verifiedProjects,
    articles,
    lastUpdated: snap?.computedAt?.toISOString() ?? new Date().toISOString(),
  };
}
