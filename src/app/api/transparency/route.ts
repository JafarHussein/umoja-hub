import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/utils';
import { ProjectStatus } from '@/types';

export const revalidate = 300;

export async function GET(): Promise<NextResponse> {
  try {
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

    return NextResponse.json({
      verifiedFarmers: (snapshot as { food?: { verifiedFarmerCount?: number } } | null)?.food?.verifiedFarmerCount ?? 0,
      counties: (snapshot as { food?: { countiesRepresented?: number } } | null)?.food?.countiesRepresented ?? 0,
      completedOrders: (snapshot as { food?: { completedOrderCount?: number } } | null)?.food?.completedOrderCount ?? 0,
      verifiedProjects,
      articles,
      lastUpdated: (snapshot as { computedAt?: Date } | null)?.computedAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
