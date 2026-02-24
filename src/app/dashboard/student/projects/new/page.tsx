import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import { Role } from '@/types';
import NewProjectClient from './NewProjectClient';

export const metadata = {
  title: 'Start a New Project — UmojaHub Education',
};

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.STUDENT) {
    redirect('/auth/login');
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="font-heading text-t1 text-text-primary">Start a New Project</h1>
        <p className="font-body text-t4 text-text-secondary mt-2">
          Choose your project track to begin building verifiable experience.
        </p>
      </div>
      <NewProjectClient />
    </div>
  );
}
