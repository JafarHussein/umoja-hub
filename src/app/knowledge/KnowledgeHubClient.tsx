'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ICategory {
  value: string;
  label: string;
}

interface IKnowledgeHubClientProps {
  categories: ICategory[];
  currentCategory: string;
}

export default function KnowledgeHubClient({ currentCategory }: IKnowledgeHubClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!search.trim()) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (currentCategory) params.set('category', currentCategory);
      if (search.trim()) params.set('search', search.trim());
      router.push(`/knowledge?${params.toString()}`);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, currentCategory, router]);

  return (
    <div className="mb-6">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search articles — fertilizer verification, pest control, market prices..."
        className="w-full bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled focus:outline-none focus:border-accent-green/50 transition-all duration-150 min-h-[44px]"
        aria-label="Search knowledge articles"
      />
    </div>
  );
}
