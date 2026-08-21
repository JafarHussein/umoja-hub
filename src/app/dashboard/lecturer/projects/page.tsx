'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  Card,
  ChipGroup,
  EmptyState,
  Form,
  FormActions,
  FormSection,
  Input,
  Page,
  PageHeader,
  Select,
  Textarea,
} from '@/components/app';
import {
  AssignmentAudience,
  AssignmentStatus,
  KnowledgeArea,
  MAX_PROGRAMME_YEARS,
  Role,
} from '@/types';
import { ALL_KNOWLEDGE_AREAS, KNOWLEDGE_AREAS } from '@/lib/education/knowledgeAreas';
import { loginUrlWithIntent } from '@/lib/auth/intent';

// ---------------------------------------------------------------------------
// Projects a lecturer sets themselves.
//
// The Hub could always generate a brief and never accept one. That told
// academics their judgement was unwelcome on a platform built around their
// mentorship — and it is their cohort, whom they teach and we do not.
//
// The form is deliberately short. A lecturer with sixty students and four
// hours a week will not fill in a long one, and a form they abandon is a
// feature that does not exist.
// ---------------------------------------------------------------------------

interface IAssignment {
  _id: string;
  title: string;
  problemStatement: string;
  knowledgeAreas: KnowledgeArea[];
  targetYear: number;
  targetSemester: number;
  audience: AssignmentAudience;
  status: AssignmentStatus;
  capacity?: number;
  takenBy: number;
}

type PageState = 'loading' | 'ready' | 'unverified' | 'unaffiliated' | 'error';

const AREA_OPTIONS = ALL_KNOWLEDGE_AREAS.map((a) => ({
  value: a,
  label: KNOWLEDGE_AREAS[a].label,
}));

const STATUS_LABEL: Record<AssignmentStatus, string> = {
  [AssignmentStatus.DRAFT]: 'Draft — only you can see it',
  [AssignmentStatus.OPEN]: 'Open — your students can take it up',
  [AssignmentStatus.CLOSED]: 'Closed — nobody new can take it up',
};

/** A textarea where each non-empty line is one item. */
function LineList({
  label,
  hint,
  value,
  onChange,
  optional,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (next: string) => void;
  optional?: boolean;
}): React.ReactElement {
  return (
    <Textarea
      label={label}
      hint={hint}
      optional={optional ?? false}
      rows={4}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function lines(value: string): string[] {
  return value
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export default function LecturerProjectsPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [composing, setComposing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'danger' | 'success'; text: string } | null>(null);

  const [title, setTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [requirements, setRequirements] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [constraints, setConstraints] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [targetYear, setTargetYear] = useState(2);
  const [targetSemester, setTargetSemester] = useState(1);
  const [capacity, setCapacity] = useState('');

  const load = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/lecturer/projects');
      if (res.status === 403) {
        setPageState('unverified');
        return;
      }
      if (res.status === 409) {
        setPageState('unaffiliated');
        return;
      }
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: IAssignment[] };
      setAssignments(body.data);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(loginUrlWithIntent());
      return;
    }
    if (status === 'authenticated') {
      if (session.user.role !== Role.LECTURER) {
        router.push('/auth/unauthorized');
        return;
      }
      void load();
    }
  }, [status, session, router, load]);

  function resetForm(): void {
    setTitle('');
    setProblemStatement('');
    setRequirements('');
    setDeliverables('');
    setConstraints('');
    setAreas([]);
    setCapacity('');
  }

  const canSubmit =
    title.trim().length >= 5 &&
    problemStatement.trim().length >= 40 &&
    lines(requirements).length > 0 &&
    areas.length > 0;

  async function handleCreate(
    e: React.FormEvent<HTMLFormElement>,
    publish: boolean
  ): Promise<void> {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/lecturer/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          problemStatement: problemStatement.trim(),
          coreRequirements: lines(requirements),
          deliverables: lines(deliverables),
          technicalConstraints: lines(constraints),
          knowledgeAreas: areas,
          targetYear,
          targetSemester,
          audience: AssignmentAudience.COHORT,
          assignedStudentIds: [],
          ...(capacity.trim() && { capacity: Number(capacity) }),
          status: publish ? AssignmentStatus.OPEN : AssignmentStatus.DRAFT,
        }),
      });

      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage({ tone: 'danger', text: body.error ?? 'Could not save the project.' });
        return;
      }

      resetForm();
      setComposing(false);
      setMessage({
        tone: 'success',
        text: publish
          ? 'Set. Your students in that semester will see it when they start a project.'
          : 'Saved as a draft. Nobody else can see it yet.',
      });
      await load();
    } catch {
      setMessage({ tone: 'danger', text: 'Network error. Check your connection and try again.' });
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, next: AssignmentStatus): Promise<void> {
    setMessage(null);
    try {
      const res = await fetch(`/api/lecturer/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage({ tone: 'danger', text: body.error ?? 'Could not change the project.' });
        return;
      }
      await load();
    } catch {
      setMessage({ tone: 'danger', text: 'Network error. Check your connection and try again.' });
    }
  }

  if (status === 'loading' || pageState === 'loading') {
    return (
      <Page width="focus">
        <div className="skeleton h-8 w-56 rounded" />
        <div className="skeleton h-64 rounded-app-card" />
      </Page>
    );
  }

  if (pageState === 'unverified') {
    return (
      <Page width="focus">
        <Alert tone="warning">
          <span className="app-body-strong">Account not yet verified.</span> An administrator must
          verify your credentials before you can set work. Setting a project a student will spend a
          semester on is held to the same bar as marking one.
        </Alert>
      </Page>
    );
  }

  if (pageState === 'unaffiliated') {
    return (
      <Page width="focus">
        <Alert tone="warning">
          Your account has no institution on record, so there is no cohort to set work for. An
          administrator can attach you to your university.
        </Alert>
      </Page>
    );
  }

  if (pageState === 'error') {
    return (
      <Page width="focus">
        <Alert tone="danger">Could not load your projects. Try again in a moment.</Alert>
      </Page>
    );
  }

  return (
    <Page width="focus">
      <PageHeader
        title="Projects you set"
        description="A brief you write yourself, offered to your own students. You know your cohort and the platform does not — a generated brief is the fallback, not the standard."
      />

      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      {!composing && (
        <div>
          <Button onClick={() => setComposing(true)}>Set a new project</Button>
        </div>
      )}

      {composing && (
        <Card pad="generous">
          <Form onSubmit={(e) => void handleCreate(e, true)} noValidate>
            <FormSection
              title="The project"
              description="What the student is being asked to build, and why it matters. Write it as you would brief a junior engineer."
              divided={false}
            >
              <Input
                label="Title"
                placeholder="Offline-first attendance register for a rural TVET"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                label="The problem"
                rows={5}
                placeholder="Who has this problem, what happens today, and what makes it hard."
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                hint="A couple of sentences is enough."
              />
              <LineList
                label="What has to be built"
                hint="One requirement per line."
                value={requirements}
                onChange={setRequirements}
              />
              <LineList
                label="Deliverables"
                hint="One per line. Optional."
                value={deliverables}
                onChange={setDeliverables}
                optional
              />
              <LineList
                label="Technical constraints"
                hint="One per line. Optional."
                value={constraints}
                onChange={setConstraints}
                optional
              />
            </FormSection>

            <FormSection
              title="Who it is for, and what it exercises"
              description="The subjects decide which students are offered it; the year and semester decide when."
            >
              <ChipGroup
                label="Subjects this project exercises"
                hint="Choose up to six. Students studying these units will be offered it."
                options={AREA_OPTIONS}
                selected={areas}
                onToggle={(v) =>
                  setAreas((prev) =>
                    prev.includes(v)
                      ? prev.filter((a) => a !== v)
                      : prev.length >= 6
                        ? prev
                        : [...prev, v]
                  )
                }
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Select
                  label="Year"
                  value={String(targetYear)}
                  onChange={(e) => setTargetYear(Number(e.target.value))}
                >
                  {Array.from({ length: MAX_PROGRAMME_YEARS }, (_, i) => i + 1).map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Semester"
                  value={String(targetSemester)}
                  onChange={(e) => setTargetSemester(Number(e.target.value))}
                >
                  <option value={1}>Semester 1</option>
                  <option value={2}>Semester 2</option>
                </Select>
                <Input
                  label="Limit"
                  optional
                  type="number"
                  min={1}
                  placeholder="No limit"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  hint="How many students may take it."
                />
              </div>
            </FormSection>

            <FormActions note="A draft is yours alone. Setting it open makes it available to your students in that year and semester.">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  resetForm();
                  setComposing(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!canSubmit || saving}
                onClick={(e) =>
                  void handleCreate(
                    e as unknown as React.FormEvent<HTMLFormElement>,
                    false
                  )
                }
              >
                Save as draft
              </Button>
              <Button type="submit" disabled={!canSubmit || saving}>
                {saving ? 'Saving…' : 'Set this project'}
              </Button>
            </FormActions>
          </Form>
        </Card>
      )}

      {assignments.length === 0 && !composing ? (
        <EmptyState
          title="You have not set any projects yet"
          description="Write one and it goes to your own students in the year and semester you aim it at. Students who are not offered one still get a generated brief against the same units."
        />
      ) : (
        assignments.map((a) => (
          <Card key={a._id}>
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 space-y-1">
                <p className="app-body-strong text-app-ink">{a.title}</p>
                <p className="app-meta text-app-muted">
                  Year {a.targetYear}, semester {a.targetSemester} ·{' '}
                  {a.knowledgeAreas.map((k) => KNOWLEDGE_AREAS[k]?.label ?? k).join(', ')}
                </p>
                <p className="app-meta text-app-muted">
                  {STATUS_LABEL[a.status]} · taken by {a.takenBy}
                  {a.capacity ? ` of ${a.capacity}` : ''}
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                {a.status !== AssignmentStatus.OPEN && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void setStatus(a._id, AssignmentStatus.OPEN)}
                  >
                    Open it
                  </Button>
                )}
                {a.status === AssignmentStatus.OPEN && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void setStatus(a._id, AssignmentStatus.CLOSED)}
                  >
                    Close it
                  </Button>
                )}
              </div>
            </div>
            {a.takenBy > 0 && (
              <p className="app-meta mt-3 text-app-faint">
                Students have started this, so its brief can no longer change — they began work
                against what it said. Closing it stops anybody new taking it up and leaves their
                work alone.
              </p>
            )}
          </Card>
        ))
      )}
    </Page>
  );
}
