'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Page,
  PageHeader,
  Select,
  Textarea,
  Alert,
  Table,
  THead,
  TH,
  TR,
  TD,
} from '@/components/app';
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
        prev.map((a) => (a.slug === article.slug ? { ...a, isPublished: !article.isPublished } : a))
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
    return (
      <div className="space-y-6">
        <div className="skeleton h-7 w-52 rounded" />
        <div className="skeleton h-64 rounded-app-card" />
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="app-title mb-2 text-app-ink">Could not load articles</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => void fetchArticles()}>
          Retry
        </Button>
      </div>
    );
  }

  const slugPreview = toSlugPreview(form.title);

  return (
    <Page>
      <PageHeader
        title="Knowledge Hub CMS"
        description="Articles farmers read for growing guidance and standards. Everything published here is attributed to a source, so a farmer can always see where the advice came from."
        actions={
          <Button
            variant={showCreateForm ? 'secondary' : 'primary'}
            onClick={() => setShowCreateForm((v) => !v)}
          >
            {showCreateForm ? 'Cancel' : 'New article'}
          </Button>
        }
      />

      {/* ── Create article form ─────────────────────────────────────────── */}
      {showCreateForm && (
        <form
          className="space-y-4 rounded-app-card border border-app-hairline bg-app-card p-6"
          onSubmit={(e) => void handleCreate(e)}
        >
          <h2 className="app-h2 text-app-ink">Create article</h2>

          <div>
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            {slugPreview && <p className="app-meta mt-1 font-app-mono text-app-faint">Slug: {slugPreview}</p>}
          </div>

          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as KnowledgeCategory }))}
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </Select>

          <Input
            label="Source institution"
            value={form.sourceInstitution}
            onChange={(e) => setForm((prev) => ({ ...prev, sourceInstitution: e.target.value }))}
            placeholder="e.g. KALRO, FAO, KEBS"
            required
          />

          <Textarea
            label="Summary"
            hint="20 to 500 characters."
            rows={2}
            value={form.summary}
            onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
            required
          />

          <Textarea
            label="Content"
            hint="Minimum 100 characters."
            rows={8}
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            required
          />

          <Input
            label="Crop tags"
            hint="Comma-separated, optional."
            value={form.cropTagsInput}
            onChange={(e) => setForm((prev) => ({ ...prev, cropTagsInput: e.target.value }))}
            placeholder="Maize, Beans, Tomatoes"
          />

          <label className="app-body flex items-center gap-2 text-app-ink">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
              className="size-4 accent-app-brand"
            />
            Publish immediately
          </label>

          {createError !== null && <Alert tone="danger">{createError}</Alert>}

          <Button type="submit" variant="primary" isLoading={createState === 'submitting'}>
            Create article
          </Button>
        </form>
      )}

      {/* ── Article list ────────────────────────────────────────────────── */}
      {articles.length === 0 ? (
        <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
          <p className="app-body text-app-muted">No articles yet.</p>
        </div>
      ) : (
        <Table>
          <THead>
            <TH>Title</TH>
            <TH className="w-44">Category</TH>
            <TH className="w-24">Status</TH>
            <TH className="w-32 text-right">Action</TH>
          </THead>
          <tbody>
            {articles.map((article) => {
              const toggling = toggleState[article.slug] === 'submitting';
              const toggleError = toggleState[article.slug] === 'error';
              return (
                <TR key={article.slug}>
                  <TD>
                    <p className="app-body-strong text-app-ink">{article.title}</p>
                    <p className="app-meta font-app-mono text-app-faint">{article.slug}</p>
                  </TD>
                  <TD className="capitalize text-app-muted">
                    {article.category.replace(/_/g, ' ').toLowerCase()}
                  </TD>
                  <TD>
                    <span
                      className={
                        article.isPublished
                          ? 'app-label inline-flex items-center rounded-app-pill bg-app-brand-surface px-2 py-0.5 text-app-brand'
                          : 'app-label inline-flex items-center rounded-app-pill bg-app-sunken px-2 py-0.5 text-app-muted'
                      }
                    >
                      {article.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </TD>
                  <TD>
                    <div className="flex items-center justify-end gap-2">
                      {toggleError && <span className="app-meta text-app-danger">Failed</span>}
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={toggling}
                        onClick={() => void handleTogglePublish(article)}
                      >
                        {article.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      )}
    </Page>
  );
}
