'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, KnowledgeCategory } from '@/types';

interface IArticle {
  _id: string;
  slug: string;
  title: string;
  category: KnowledgeCategory;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

interface IArticlesResponse {
  articles: IArticle[];
}

interface ICreateForm {
  title: string;
  category: KnowledgeCategory;
  sourceInstitution: string;
  summary: string;
  content: string;
  cropTagsInput: string;
  isPublished: boolean;
}

type PageState = 'loading' | 'ready' | 'error';
type SubmitState = 'idle' | 'submitting' | 'error';

const CATEGORY_OPTIONS = Object.values(KnowledgeCategory);

function toSlugPreview(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EMPTY_FORM: ICreateForm = {
  title: '',
  category: KnowledgeCategory.FERTILIZER_VERIFICATION,
  sourceInstitution: '',
  summary: '',
  content: '',
  cropTagsInput: '',
  isPublished: false,
};

export default function AdminKnowledgePage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [form, setForm] = useState<ICreateForm>(EMPTY_FORM);
  const [createState, setCreateState] = useState<SubmitState>('idle');
  const [createError, setCreateError] = useState<string | null>(null);
  const [toggleState, setToggleState] = useState<Record<string, SubmitState>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchArticles = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch('/api/admin/knowledge/articles');
      if (!res.ok) throw new Error('Request failed');
      const data = (await res.json()) as IArticlesResponse;
      setArticles(data.articles);
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

  async function handleTogglePublish(article: IArticle): Promise<void> {
    setToggleState((prev) => ({ ...prev, [article.slug]: 'submitting' }));
    try {
      const res = await fetch(`/api/knowledge/articles/${article.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !article.isPublished }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Update failed.');
      }
      setArticles((prev) =>
        prev.map((a) =>
          a.slug === article.slug ? { ...a, isPublished: !article.isPublished } : a
        )
      );
      setToggleState((prev) => ({ ...prev, [article.slug]: 'idle' }));
    } catch {
      setToggleState((prev) => ({ ...prev, [article.slug]: 'error' }));
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setCreateError(null);
    setCreateState('submitting');

    const cropTags = form.cropTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const res = await fetch('/api/knowledge/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          sourceInstitution: form.sourceInstitution,
          summary: form.summary,
          content: form.content,
          isPublished: form.isPublished,
          ...(cropTags.length > 0 && { cropTags }),
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Creation failed.');
      }
      setCreateState('idle');
      setForm(EMPTY_FORM);
      setShowCreateForm(false);
      void fetchArticles();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'An error occurred.');
      setCreateState('error');
    }
  }

  if (status === 'loading' || pageState === 'loading') {
    return <p className="p-4">Loading...</p>;
  }

  if (pageState === 'error') {
    return (
      <div className="p-4 flex flex-col gap-2">
        <p>Failed to load articles.</p>
        <button type="button" onClick={() => void fetchArticles()}>
          Retry
        </button>
      </div>
    );
  }

  const slugPreview = toSlugPreview(form.title);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Knowledge Hub CMS</h1>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="border border-gray-400 px-3 py-1 text-sm"
        >
          {showCreateForm ? 'Cancel' : 'New article'}
        </button>
      </div>

      {/* ── Create article form ─────────────────────────────────────────── */}
      {showCreateForm && (
        <form
          className="flex flex-col gap-3 border border-gray-300 p-4"
          onSubmit={(e) => void handleCreate(e)}
        >
          <h2 className="text-sm font-semibold">Create article</h2>

          <div className="flex flex-col gap-1">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              type="text"
              className="border border-gray-300 px-2 py-1 text-sm"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            {slugPreview && (
              <p className="text-xs text-gray-500 font-mono">Slug: {slugPreview}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <select
              id="category"
              className="border border-gray-300 px-2 py-1 text-sm"
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, category: e.target.value as KnowledgeCategory }))
              }
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="sourceInstitution" className="text-sm font-medium">
              Source institution
            </label>
            <input
              id="sourceInstitution"
              type="text"
              className="border border-gray-300 px-2 py-1 text-sm"
              value={form.sourceInstitution}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, sourceInstitution: e.target.value }))
              }
              placeholder="e.g. KALRO, FAO, KEBS"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="summary" className="text-sm font-medium">
              Summary{' '}
              <span className="text-gray-500 font-normal">(20–500 chars)</span>
            </label>
            <textarea
              id="summary"
              rows={2}
              className="border border-gray-300 px-2 py-1 text-sm resize-none"
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="content" className="text-sm font-medium">
              Content{' '}
              <span className="text-gray-500 font-normal">(min 100 chars)</span>
            </label>
            <textarea
              id="content"
              rows={8}
              className="border border-gray-300 px-2 py-1 text-sm resize-y"
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="cropTags" className="text-sm font-medium">
              Crop tags{' '}
              <span className="text-gray-500 font-normal">(comma-separated, optional)</span>
            </label>
            <input
              id="cropTags"
              type="text"
              className="border border-gray-300 px-2 py-1 text-sm"
              value={form.cropTagsInput}
              onChange={(e) => setForm((prev) => ({ ...prev, cropTagsInput: e.target.value }))}
              placeholder="Maize, Beans, Tomatoes"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isPublished: e.target.checked }))
              }
            />
            Publish immediately
          </label>

          {createError !== null && (
            <p role="alert" className="text-sm text-red-600">
              {createError}
            </p>
          )}

          <button
            type="submit"
            disabled={createState === 'submitting'}
            className="self-start border border-gray-400 px-3 py-1 text-sm disabled:opacity-50"
          >
            {createState === 'submitting' ? 'Creating...' : 'Create article'}
          </button>
        </form>
      )}

      {/* ── Article list ────────────────────────────────────────────────── */}
      {articles.length === 0 && (
        <p className="text-sm text-gray-500">No articles yet.</p>
      )}

      {articles.length > 0 && (
        <table className="border-collapse text-sm w-full">
          <thead>
            <tr className="border border-gray-300 bg-gray-50">
              <th className="px-3 py-2 text-left border border-gray-300">Title</th>
              <th className="px-3 py-2 text-left border border-gray-300 w-44">Category</th>
              <th className="px-3 py-2 text-left border border-gray-300 w-24">Status</th>
              <th className="px-3 py-2 text-left border border-gray-300 w-32">Action</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => {
              const toggling = toggleState[article.slug] === 'submitting';
              const toggleError = toggleState[article.slug] === 'error';
              return (
                <tr key={article.slug} className="border border-gray-300">
                  <td className="px-3 py-2 border border-gray-300">
                    <div>{article.title}</div>
                    <div className="text-xs text-gray-500 font-mono">{article.slug}</div>
                  </td>
                  <td className="px-3 py-2 border border-gray-300 text-xs">
                    {article.category.replace(/_/g, ' ')}
                  </td>
                  <td className="px-3 py-2 border border-gray-300">
                    <span
                      className={[
                        'text-xs font-medium',
                        article.isPublished ? 'text-green-700' : 'text-gray-500',
                      ].join(' ')}
                    >
                      {article.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-3 py-2 border border-gray-300">
                    <button
                      type="button"
                      disabled={toggling}
                      onClick={() => void handleTogglePublish(article)}
                      className="border border-gray-400 px-2 py-0.5 text-xs disabled:opacity-50"
                    >
                      {toggling
                        ? '...'
                        : article.isPublished
                          ? 'Unpublish'
                          : 'Publish'}
                    </button>
                    {toggleError && (
                      <span className="text-xs text-red-600 ml-2">Failed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
