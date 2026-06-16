import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Doorway } from '@/components/website/Doorway';
import { doorways, doorway } from '@/components/website/doorways';

/** Pre-render the five known doorways; anything else 404s. */
export function generateStaticParams() {
  return doorways.map((d) => ({ audience: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ audience: string }>;
}): Promise<Metadata> {
  const { audience } = await params;
  const d = doorway(audience);
  if (!d) return { title: 'Not found' };
  return {
    title: `${d.title} — UmojaHub`,
    description: d.lead,
  };
}

export default async function DoorwayPage({
  params,
}: {
  params: Promise<{ audience: string }>;
}) {
  const { audience } = await params;
  const d = doorway(audience);
  if (!d) notFound();
  return <Doorway data={d} />;
}
