import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import PriceIntelligenceDashboard from '@/components/foodhub/PriceIntelligenceDashboard';
import { Role } from '@/types';

export default async function FarmerPricesPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== Role.FARMER) {
    redirect('/auth/unauthorized');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="app-h1 text-app-ink">Market Prices</h1>
        <p className="app-meta mt-0.5 max-w-prose text-app-muted">
          Track produce price trends in your county and get notified when prices reach your target.
        </p>
      </div>

      {/* Dashboard — client component */}
      <PriceIntelligenceDashboard />
    </div>
  );
}
