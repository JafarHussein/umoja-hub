'use client';

import React, { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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

interface IEditorState {
  content: string;
  saveState: 'idle' | 'saving' | 'error';
  errorMsg: string | null;
  savedAt: string | null;
}

interface IDocEditors {
  problemBreakdown: IEditorState;
  approachPlan: IEditorState;
  finalReflection: IEditorState;
}

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

  function updateEditor(type: DocumentType, patch: Partial<IEditorState>): void {
    setEditors((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...patch },
    }));
  }

  const handleSave = useCallback(
    async (docType: DocumentType): Promise<void> => {
      const currentContent = editors[docType].content;
      if (currentContent.length < 50) return;

      updateEditor(docType, { saveState: 'saving', errorMsg: null });

      try {
        const res = await fetch(`/api/education/engagements/${engagementId}/documents`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentType: docType, content: currentContent }),
        });

        const body = (await res.json()) as {
          data?: { documentType: string; hash: string; submittedAt: string };
          error?: string;
        };

        if (!res.ok) {
          updateEditor(docType, {
            saveState: 'error',
            errorMsg: body.error ?? 'Failed to save. Try again.',
          });
          return;
        }

        const submittedAt = body.data?.submittedAt ?? null;
        updateEditor(docType, { saveState: 'idle', savedAt: submittedAt, errorMsg: null });

        if (body.data) {
          onDocumentSaved(docType, {
            content: currentContent,
            hash: body.data.hash,
            submittedAt: body.data.submittedAt,
          });
        }
      } catch {
        updateEditor(docType, {
          saveState: 'error',
          errorMsg: 'Network error. Try again.',
        });
      }
    },
    [editors, engagementId, onDocumentSaved]
  );

  return (
    <div className="p-4 space-y-0">
      {DOC_CONFIG.map((cfg, idx) => {
        const editor = editors[cfg.type];
        const isSaving = editor.saveState === 'saving';
        const saveDisabled = editor.content.length < 50 || isSaving;

        return (
          <div key={cfg.type}>
            {idx > 0 && <div className="border-t border-zinc-800/50 my-5" />}

            <div className="space-y-2">
              <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                {cfg.label}
              </p>

              <Textarea
                rows={8}
                value={editor.content}
                onChange={(e) =>
                  updateEditor(cfg.type, { content: e.target.value, errorMsg: null })
                }
                hint={editor.content.length < 50 ? cfg.hint : undefined}
                aria-label={cfg.label}
              />

              <div className="flex items-center justify-between">
                <div>
                  {editor.savedAt ? (
                    <p className="text-t6 font-mono text-accent-green">
                      Saved · {formatDate(editor.savedAt)}
                    </p>
                  ) : (
                    <p className="text-t6 font-body text-text-disabled">Not yet saved</p>
                  )}
                  {editor.saveState === 'error' && editor.errorMsg && (
                    <p className="text-t6 font-body text-red-400 mt-0.5">{editor.errorMsg}</p>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saveDisabled}
                  onClick={() => void handleSave(cfg.type)}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
