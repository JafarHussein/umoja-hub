import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import FarmAssistantChat from '@/components/foodhub/FarmAssistantChat';
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
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-3xl mx-auto px-4 py-8 md:px-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-heading text-t1 text-text-primary mb-2">Farm Assistant</h1>
          <p className="font-body text-t4 text-text-secondary">
            Get expert agricultural guidance grounded in KEBS, PCPB, and KEPHIS standards.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-surface-secondary border border-white/5 rounded-sm">
            <span className="font-mono text-t6 text-text-disabled">AI</span>
            <span className="font-body text-t6 text-text-disabled">
              UmojaHub AI uses Groq Llama 3 · Weather data from OpenWeatherMap
            </span>
          </div>
        </div>

        {/* Chat interface */}
        <div className="bg-surface-elevated border border-white/5 rounded overflow-hidden">
          <FarmAssistantChat
            farmerName={farmer.firstName ?? ''}
            farmerCounty={farmer.county ?? 'Kenya'}
          />
        </div>

        {/* Disclaimer */}
        <p className="font-body text-t6 text-text-disabled mt-4">
          This assistant provides general agricultural guidance. For animal health issues, always consult a Kenya Veterinary Board-registered veterinarian. For input verification, refer to KEBS, PCPB, or KEPHIS directly.
        </p>
      </div>
    </div>
  );
}
