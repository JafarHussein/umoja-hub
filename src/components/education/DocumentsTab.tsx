'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Textarea } from '@/components/app';

export type DocumentType = 'problemBreakdown' | 'approachPlan' | 'finalReflection';

export interface IProcessDocument {
  content: string;
  hash: string;
  submittedAt: string;
}

interface IDocuments {
  problemBreakdown?: IProcessDocument;
  approachPlan?: IProcessDocument;
  finalReflection?: IProcessDocument;
}

export interface IDocumentsTabProps {
  engagementId: string;
  documents: IDocuments;
  onDocumentSaved: (type: DocumentType, saved: IProcessDocument) => void;
}

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface IEditorState {
  content: string;
  saveState: SaveState;
  errorMsg: string | null;
  savedAt: string | null;
  hash: string | null;
}

interface IDocEditors {
  problemBreakdown: IEditorState;
  approachPlan: IEditorState;
  finalReflection: IEditorState;
}

const MIN_CONTENT = 50;
const AUTOSAVE_DELAY_MS = 1_500;

const DOC_CONFIG: { type: DocumentType; label: string; hint: string }[] = [
  {
    type: 'problemBreakdown',
    label: 'Problem Breakdown',
    hint: 'Describe the client problem in your own words. Min 50 characters.',
  },
  {
    type: 'approachPlan',
    label: 'Approach Plan',
    hint: 'Outline your technical solution and steps. Min 50 characters.',
  },
  {
    type: 'finalReflection',
    label: 'Final Reflection',
    hint: 'Reflect on what you built, learned, and would do differently. Min 50 characters.',
  },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function makeEditorState(doc: IProcessDocument | undefined): IEditorState {
  return {
    content: doc?.content ?? '',
    saveState: 'idle',
    errorMsg: null,
    savedAt: doc?.submittedAt ?? null,
    hash: doc?.hash ?? null,
  };
}

export function DocumentsTab({
  engagementId,
  documents,
  onDocumentSaved,
}: IDocumentsTabProps): React.ReactElement {
  const [editors, setEditors] = useState<IDocEditors>({
    problemBreakdown: makeEditorState(documents.problemBreakdown),
    approachPlan: makeEditorState(documents.approachPlan),
    finalReflection: makeEditorState(documents.finalReflection),
  });

  // Per-document auto-save debounce timers.
  const timers = useRef<Record<DocumentType, ReturnType<typeof setTimeout> | null>>({
    problemBreakdown: null,
    approachPlan: null,
    finalReflection: null,
  });

  useEffect(() => {
    const pending = timers.current;
    return () => {
      (Object.values(pending) as (ReturnType<typeof setTimeout> | null)[]).forEach((t) => {
        if (t) clearTimeout(t);
      });
    };
  }, []);

  function updateEditor(type: DocumentType, patch: Partial<IEditorState>): void {
    setEditors((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));
  }

  const save = useCallback(
    async (docType: DocumentType, content: string): Promise<void> => {
      if (content.length < MIN_CONTENT) return;
      updateEditor(docType, { saveState: 'saving', errorMsg: null });

      try {
        const res = await fetch(`/api/education/engagements/${engagementId}/documents`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentType: docType, content }),
        });

        const body = (await res.json()) as {
          data?: { documentType: string; hash: string; submittedAt: string };
          error?: string;
        };

        if (!res.ok || !body.data) {
          updateEditor(docType, {
            saveState: 'error',
            errorMsg: body.error ?? 'Failed to save. Try again.',
          });
          return;
        }

        updateEditor(docType, {
          saveState: 'saved',
          savedAt: body.data.submittedAt,
          hash: body.data.hash,
          errorMsg: null,
        });
        onDocumentSaved(docType, {
          content,
          hash: body.data.hash,
          submittedAt: body.data.submittedAt,
        });
      } catch {
        updateEditor(docType, { saveState: 'error', errorMsg: 'Network error. Try again.' });
      }
    },
    [engagementId, onDocumentSaved]
  );

  function handleChange(docType: DocumentType, content: string): void {
    updateEditor(docType, { content, errorMsg: null, saveState: 'dirty' });

    // Debounced auto-save: drafts save themselves once they pass the minimum.
    const existing = timers.current[docType];
    if (existing) clearTimeout(existing);
    if (content.length < MIN_CONTENT) return;
    timers.current[docType] = setTimeout(() => {
      void save(docType, content);
    }, AUTOSAVE_DELAY_MS);
  }

  function statusLabel(editor: IEditorState): string {
    switch (editor.saveState) {
      case 'saving':
        return 'Saving…';
      case 'dirty':
        return editor.content.length < MIN_CONTENT ? 'Not yet saved' : 'Unsaved changes';
      case 'saved':
      case 'idle':
      default:
        return editor.savedAt ? `Saved · ${formatDate(editor.savedAt)}` : 'Not yet saved';
    }
  }

  return (
    <div className="p-4 space-y-0">
      {DOC_CONFIG.map((cfg, idx) => {
        const editor = editors[cfg.type];
        const isSaving = editor.saveState === 'saving';
        const saveDisabled = editor.content.length < MIN_CONTENT || isSaving;
        const isSaved = editor.savedAt !== null && editor.saveState !== 'saving';

        return (
          <div key={cfg.type}>
            {idx > 0 && <div className="my-5 border-t border-app-hairline" />}

            <div className="space-y-2">
              <p className="app-label text-app-muted">{cfg.label}</p>

              <Textarea
                rows={8}
                value={editor.content}
                onChange={(e) => handleChange(cfg.type, e.target.value)}
                {...(editor.content.length < MIN_CONTENT ? { hint: cfg.hint } : {})}
                aria-label={cfg.label}
              />

              <div className="flex items-center justify-between">
                <div>
                  <p className={['app-meta font-app-mono', isSaved ? 'text-app-brand' : 'text-app-faint'].join(' ')}>
                    {statusLabel(editor)}
                  </p>
                  {editor.saveState === 'error' && editor.errorMsg && (
                    <p className="app-meta mt-0.5 text-app-danger">{editor.errorMsg}</p>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saveDisabled}
                  isLoading={isSaving}
                  onClick={() => void save(cfg.type, editor.content)}
                >
                  Save
                </Button>
              </div>

              {/* Per-document hash string (corrected VIEW-DET-01) */}
              {editor.hash && (
                <p className="app-meta break-all font-app-mono text-app-faint">
                  <span className="app-label text-app-muted">SHA-256</span> {editor.hash}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
