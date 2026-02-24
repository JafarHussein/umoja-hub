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
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-5xl mx-auto px-4 py-8 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-t1 text-text-primary mb-2">Price Intelligence</h1>
          <p className="font-body text-t4 text-text-secondary">
            Track crop price trends in your county and get notified when prices reach your target.
          </p>
        </div>

        {/* Dashboard — client component */}
        <PriceIntelligenceDashboard />
      </div>
    </div>
  );
}
