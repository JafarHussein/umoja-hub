'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import { Role, KnowledgeCategory } from '@/types';

interface IArticle {
  _id: string;
  slug: string;
  title: string;
  category: KnowledgeCategory;
  sourceInstitution: string;
  summary: string;
  cropTags: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

interface IArticlesResponse {
  data: IArticle[];
  nextCursor: string | null;
  hasMore: boolean;
}

type PageState = 'loading' | 'ready' | 'error';
type ModalState = 'create' | 'edit' | null;

const CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  [KnowledgeCategory.FERTILIZER_VERIFICATION]: 'Fertilizer Verification',
  [KnowledgeCategory.SEED_VERIFICATION]: 'Seed Verification',
  [KnowledgeCategory.ANIMAL_HEALTH]: 'Animal Health',
  [KnowledgeCategory.PEST_DISEASE]: 'Pest & Disease',
  [KnowledgeCategory.SEASONAL_CALENDAR]: 'Seasonal Calendar',
  [KnowledgeCategory.POST_HARVEST]: 'Post-Harvest',
  [KnowledgeCategory.MARKET_DYNAMICS]: 'Market Dynamics',
  [KnowledgeCategory.NEW_METHODS]: 'New Methods',
};

interface IArticleForm {
  title: string;
  category: KnowledgeCategory;
  sourceInstitution: string;
  sourceUrl: string;
  author: string;
  cropTags: string;
  summary: string;
  content: string;
}

const EMPTY_FORM: IArticleForm = {
  title: '',
  category: KnowledgeCategory.FERTILIZER_VERIFICATION,
  sourceInstitution: '',
  sourceUrl: '',
  author: '',
  cropTags: '',
  summary: '',
  content: '',
};

export default function AdminKnowledgePage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [modalState, setModalState] = useState<ModalState>(null);
  const [selectedArticle, setSelectedArticle] = useState<IArticle | null>(null);
  const [form, setForm] = useState<IArticleForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');

  const fetchArticles = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      // Admin fetches all articles (including drafts) — use a high limit
      const res = await fetch('/api/knowledge/articles?limit=50');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = (await res.json()) as IArticlesResponse;
      // Also fetch drafts (isPublished: false) — need a separate call since public route only returns published
      // For now we show published ones and note that drafts require a dedicated admin GET
      setArticles(json.data ?? []);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      if (session.user.role !== Role.ADMIN) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchArticles();
    }
  }, [status, session, router, fetchArticles]);

  function openCreate(): void {
    setForm(EMPTY_FORM);
    setFormError(null);
    setSelectedArticle(null);
    setModalState('create');
  }

  function openEdit(article: IArticle): void {
    setSelectedArticle(article);
    setForm({
      title: article.title,
      category: article.category,
      sourceInstitution: article.sourceInstitution,
      sourceUrl: '',
      author: '',
      cropTags: article.cropTags.join(', '),
      summary: article.summary,
      content: '',
    });
    setFormError(null);
    setModalState('edit');
  }

  async function handleCreate(): Promise<void> {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const cropTags = form.cropTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/knowledge/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          sourceInstitution: form.sourceInstitution,
          sourceUrl: form.sourceUrl || undefined,
          author: form.author || undefined,
          cropTags,
          summary: form.summary,
          content: form.content,
        }),
      });

      const data = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        setFormError(
          typeof data['error'] === 'string' ? data['error'] : 'Could not create article.',
        );
        return;
      }

      setModalState(null);
      void fetchArticles();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTogglePublish(article: IArticle): Promise<void> {
    setTogglingId(article._id);
    try {
      const res = await fetch(`/api/admin/knowledge/${article._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: article.isPublished ? 'unpublish' : 'publish' }),
      });

      if (res.ok) {
        setArticles((prev) =>
          prev.map((a) =>
            a._id === article._id ? { ...a, isPublished: !a.isPublished } : a,
          ),
        );
      }
    } finally {
      setTogglingId(null);
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const filtered = articles.filter((a) => {
    if (filterPublished === 'published') return a.isPublished;
    if (filterPublished === 'draft') return !a.isPublished;
    return true;
  });

  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-48 rounded" />
        <ListSkeleton rows={6} />
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-t4 font-body font-medium text-text-primary mb-2">
          Could not load articles
        </p>
        <Button variant="secondary" onClick={() => void fetchArticles()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-t2 font-heading font-semibold text-text-primary">Knowledge Hub CMS</h1>
          <p className="text-t5 font-body text-text-secondary mt-0.5">
            {articles.length} article{articles.length !== 1 ? 's' : ''} total ·{' '}
            {articles.filter((a) => a.isPublished).length} published
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          New article
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-white/5">
        {(['all', 'published', 'draft'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterPublished(f)}
            className={`px-4 py-2 text-t5 font-body capitalize transition-all duration-150 border-b-2 ${
              filterPublished === f
                ? 'border-accent-green text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 rounded bg-surface-elevated">
          <p className="text-t4 font-body font-medium text-text-primary mb-1">No articles yet</p>
          <p className="text-t5 font-body text-text-secondary mb-4">
            Create your first knowledge article to get started.
          </p>
          <Button variant="primary" onClick={openCreate}>
            Create article
          </Button>
        </div>
      ) : (
        <div className="bg-surface-elevated border border-white/5 rounded overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-white/5">
            {['Title', 'Category', 'Institution', 'Date', 'Status'].map((h) => (
              <span key={h} className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                {h}
              </span>
            ))}
          </div>

          {filtered.map((article) => (
            <div
              key={article._id}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-4 border-b border-white/5 last:border-0 items-center"
            >
              <div className="min-w-0">
                <p className="text-t5 font-body font-medium text-text-primary truncate">
                  {article.title}
                </p>
                <p className="text-t6 font-body text-text-disabled truncate">
                  {article.cropTags.slice(0, 3).join(' · ')}
                </p>
              </div>

              <span className="text-t6 font-mono text-text-secondary whitespace-nowrap">
                {CATEGORY_LABELS[article.category]}
              </span>

              <span className="text-t5 font-body text-text-secondary whitespace-nowrap">
                {article.sourceInstitution}
              </span>

              <span className="text-t6 font-body text-text-disabled">
                {formatDate(article.publishedAt ?? article.createdAt)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => void handleTogglePublish(article)}
                  disabled={togglingId === article._id}
                  className={`min-w-[80px] text-t6 font-mono rounded-[2px] px-2 py-1 border transition-all duration-150 disabled:opacity-50 ${
                    article.isPublished
                      ? 'border-accent-green/30 text-accent-green hover:bg-accent-green/10'
                      : 'border-white/10 text-text-disabled hover:border-white/20 hover:text-text-secondary'
                  }`}
                  aria-label={article.isPublished ? 'Unpublish article' : 'Publish article'}
                >
                  {togglingId === article._id
                    ? '...'
                    : article.isPublished
                    ? 'Published'
                    : 'Draft'}
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(article)}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={modalState !== null}
        onClose={() => setModalState(null)}
        title={modalState === 'create' ? 'New article' : `Edit: ${selectedArticle?.title ?? ''}`}
        size="lg"
      >
        <div className="space-y-4">
          {formError && (
            <p className="text-t5 font-body text-red-400 bg-red-400/10 border border-red-400/20 rounded p-3">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Title"
                placeholder="Identifying Counterfeit Fertilizers in Nakuru County"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-t5 font-body text-text-secondary">Category</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value as KnowledgeCategory }))
                }
                className="w-full min-h-[44px] px-3 rounded-sm bg-surface-secondary border border-white/10 text-t5 font-body text-text-primary focus:outline-none focus:border-accent-green/50 transition-all duration-150"
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Source institution"
              placeholder="KEBS, KALRO, KEPHIS, PCPB, FAO Kenya"
              value={form.sourceInstitution}
              onChange={(e) => setForm((f) => ({ ...f, sourceInstitution: e.target.value }))}
            />

            <Input
              label="Source URL (optional)"
              placeholder="https://www.kebs.org/..."
              value={form.sourceUrl}
              onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
            />

            <Input
              label="Author (optional)"
              placeholder="Dr. Kamau Njoroge"
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            />

            <div className="col-span-2">
              <Input
                label="Crop tags (comma-separated)"
                placeholder="maize, beans, potatoes"
                value={form.cropTags}
                onChange={(e) => setForm((f) => ({ ...f, cropTags: e.target.value }))}
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-t5 font-body text-text-secondary">Summary</label>
              <textarea
                rows={2}
                placeholder="Brief description visible on article cards"
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                className="w-full px-3 py-2 rounded-sm bg-surface-secondary border border-white/10 text-t5 font-body text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent-green/50 transition-all duration-150 resize-none"
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-t5 font-body text-text-secondary">
                Content{' '}
                <span className="text-t6 font-mono text-text-disabled">(Markdown supported)</span>
              </label>
              <textarea
                rows={10}
                placeholder="## Introduction&#10;&#10;Full article content in Markdown..."
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                className="w-full px-3 py-2 rounded-sm bg-surface-secondary border border-white/10 text-t5 font-mono text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent-green/50 transition-all duration-150 resize-y"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
            <Button variant="ghost" onClick={() => setModalState(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={isSubmitting}
              disabled={
                !form.title.trim() ||
                !form.sourceInstitution.trim() ||
                !form.summary.trim() ||
                (modalState === 'create' && !form.content.trim())
              }
              onClick={() => void handleCreate()}
            >
              {modalState === 'create' ? 'Create article' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
