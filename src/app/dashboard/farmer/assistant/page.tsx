import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import FarmAssistantChat from '@/components/foodhub/FarmAssistantChat';
import { Page, PageHeader } from '@/components/app';
import { Role } from '@/types';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User.model';

export default async function FarmAssistantPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== Role.FARMER) {
    redirect('/auth/unauthorized');
  }

  await connectDB();
  const farmer = await User.findById(session.user.id)
    .select('firstName lastName county')
    .lean();

  if (!farmer) {
    redirect('/auth/login');
  }

  return (
    <Page width="focus">
      <PageHeader
        title="Farm Assistant"
        description="Ask about planting, pests, inputs or timing and get an answer grounded in KEBS, PCPB and KEPHIS standards, with the weather where you farm taken into account."
        meta={
          <span className="inline-flex items-center gap-2 rounded-app-pill border border-app-hairline bg-app-sunken px-3 py-1">
            <span className="app-label text-app-muted">AI</span>
            <span className="app-meta text-app-muted">
              Groq Llama 3 · weather from OpenWeatherMap
            </span>
          </span>
        }
      />

      {/* Chat interface */}
      <div className="overflow-hidden rounded-app-card border border-app-hairline">
        <FarmAssistantChat
          farmerName={farmer.firstName ?? ''}
          farmerCounty={farmer.county ?? 'Kenya'}
        />
      </div>

      {/* Disclaimer */}
      <p className="app-meta max-w-app-prose text-app-faint">
        This assistant provides general agricultural guidance. For animal health issues, always
        consult a Kenya Veterinary Board-registered veterinarian. For input verification, refer to
        KEBS, PCPB, or KEPHIS directly.
      </p>
    </Page>
  );
}
