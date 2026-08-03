import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import PriceIntelligenceDashboard from '@/components/foodhub/PriceIntelligenceDashboard';
import { Page, PageHeader } from '@/components/app';
import { Role } from '@/types';

export default async function FarmerPricesPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== Role.FARMER) {
    redirect('/auth/unauthorized');
  }

  return (
    <Page>
      <PageHeader
        title="Market Prices"
        description="What your crops are fetching in your county and the ones next to it, drawn from what buyers have actually paid on UmojaHub. Set a target and we will tell you when the market reaches it."
      />

      {/* Dashboard — client component */}
      <PriceIntelligenceDashboard />
    </Page>
  );
}
