'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  Card,
  ChipGroup,
  DataItem,
  DataList,
  Form,
  FormActions,
  FormSection,
  Input,
  Page,
  PageHeader,
  Select,
  TokenSelect,
} from '@/components/app';
import {
  AcademicDiscipline,
  KnowledgeArea,
  MAX_CURRENT_UNITS,
  MAX_PROGRAMME_YEARS,
  Role,
} from '@/types';
import { ALL_KNOWLEDGE_AREAS, KNOWLEDGE_AREAS } from '@/lib/education/knowledgeAreas';
import { loginUrlWithIntent } from '@/lib/auth/intent';

// ---------------------------------------------------------------------------
// What you are studying.
//
// The project a student is given is written from this page, so this page has to
// be honest about two things: which of these facts came from their institution
// and which they typed themselves, and that typing them yourself is a perfectly
// ordinary thing to do. Most Kenyan universities have published nothing here,
// and a student at one of them must not feel they are using a degraded product.
// ---------------------------------------------------------------------------

interface IPublishedUnit {
  _id: string;
  code: string;
  title: string;
  year: number;
  semester: number;
  knowledgeAreas: KnowledgeArea[];
}

interface IProgramme {
  _id: string;
  name: string;
  discipline: AcademicDiscipline;
  durationYears: number;
  semestersPerYear: number;
  units: IPublishedUnit[];
}

interface IContextUnit {
  code?: string;
  title: string;
  areaLabels: string[];
}

interface IAcademicContext {
  programmeName: string;
  discipline: AcademicDiscipline;
  currentYear: number;
  currentSemester: number;
  currentUnits: IContextUnit[];
  provenanceLabel: string;
}

interface IDeclaredUnit {
  key: string;
  code: string;
  title: string;
  areas: string[];
}

const TYPE_IT_OUT = 'SELF';

const AREA_LABELS = ALL_KNOWLEDGE_AREAS.map((a) => KNOWLEDGE_AREAS[a].label);
const AREA_BY_LABEL = new Map(ALL_KNOWLEDGE_AREAS.map((a) => [KNOWLEDGE_AREAS[a].label, a]));

function blankUnit(): IDeclaredUnit {
  return { key: crypto.randomUUID(), code: '', title: '', areas: [] };
}

export default function AcademicContextPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'danger' | 'success'; text: string } | null>(null);

  const [programmes, setProgrammes] = useState<IProgramme[]>([]);
  const [context, setContext] = useState<IAcademicContext | null>(null);

  const [programmeId, setProgrammeId] = useState<string>(TYPE_IT_OUT);
  const [programmeName, setProgrammeName] = useState('');
  const [discipline, setDiscipline] = useState<AcademicDiscipline>(AcademicDiscipline.CS);
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [pickedUnitIds, setPickedUnitIds] = useState<string[]>([]);
  const [declaredUnits, setDeclaredUnits] = useState<IDeclaredUnit[]>([blankUnit()]);

  const load = useCallback(async (): Promise<void> => {
    try {
      const [programmesRes, enrolmentRes] = await Promise.all([
        fetch('/api/education/programmes'),
        fetch('/api/education/enrolment'),
      ]);

      if (programmesRes.ok) {
        const body = (await programmesRes.json()) as { data: IProgramme[] };
        setProgrammes(body.data);
      }

      if (enrolmentRes.ok) {
        const body = (await enrolmentRes.json()) as {
          data: { programmeId: string | null; context: IAcademicContext | null } | null;
        };
        if (body.data?.context) {
          setContext(body.data.context);
          setYear(body.data.context.currentYear);
          setSemester(body.data.context.currentSemester);
          setDiscipline(body.data.context.discipline);
          if (body.data.programmeId) setProgrammeId(body.data.programmeId);
          else setProgrammeName(body.data.context.programmeName);
        }
      }
    } catch {
      setMessage({ tone: 'danger', text: 'Could not load your record. Check your connection.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(loginUrlWithIntent());
      return;
    }
    if (status === 'authenticated') {
      if (session.user.role !== Role.STUDENT) {
        router.push('/auth/unauthorized');
        return;
      }
      void load();
    }
  }, [status, session, router, load]);

  const programme = programmes.find((p) => p._id === programmeId);
  const usingCurriculum = programme !== undefined;

  const semesterUnits = useMemo(
    () => (programme ? programme.units.filter((u) => u.year === year && u.semester === semester) : []),
    [programme, year, semester]
  );

  // Moving to another year or semester invalidates the previous selection —
  // silently carrying it over would attach last semester's units to this one.
  useEffect(() => {
    setPickedUnitIds([]);
  }, [programmeId, year, semester]);

  const maxYear = programme?.durationYears ?? MAX_PROGRAMME_YEARS;
  const maxSemester = programme?.semestersPerYear ?? 2;

  function toggleUnit(id: string): void {
    setPickedUnitIds((prev) =>
      prev.includes(id)
        ? prev.filter((u) => u !== id)
        : prev.length >= MAX_CURRENT_UNITS
          ? prev
          : [...prev, id]
    );
  }

  function updateDeclared(key: string, patch: Partial<IDeclaredUnit>): void {
    setDeclaredUnits((prev) => prev.map((u) => (u.key === key ? { ...u, ...patch } : u)));
  }

  const declaredComplete = declaredUnits.filter(
    (u) => u.title.trim().length >= 3 && u.areas.length > 0
  );

  const canSubmit = usingCurriculum ? pickedUnitIds.length > 0 : declaredComplete.length > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setMessage(null);

    const currentUnits = usingCurriculum
      ? semesterUnits
          .filter((u) => pickedUnitIds.includes(u._id))
          .map((u) => ({
            unitId: u._id,
            code: u.code,
            title: u.title,
            knowledgeAreas: u.knowledgeAreas,
          }))
      : declaredComplete.map((u) => ({
          ...(u.code.trim() ? { code: u.code.trim() } : {}),
          title: u.title.trim(),
          knowledgeAreas: u.areas
            .map((label) => AREA_BY_LABEL.get(label))
            .filter((a): a is KnowledgeArea => a !== undefined),
        }));

    try {
      const res = await fetch('/api/education/enrolment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(usingCurriculum ? { programmeId } : { programmeName: programmeName.trim() }),
          discipline: programme?.discipline ?? discipline,
          currentYear: year,
          currentSemester: semester,
          currentUnits,
          completedUnits: [],
        }),
      });

      const body = (await res.json()) as {
        data?: { context: IAcademicContext | null };
        error?: string;
      };

      if (!res.ok) {
        setMessage({ tone: 'danger', text: body.error ?? 'Could not save your record.' });
        return;
      }

      if (body.data?.context) setContext(body.data.context);
      setMessage({ tone: 'success', text: 'Saved. Your next project will be written from this.' });
    } catch {
      setMessage({ tone: 'danger', text: 'Network error. Check your connection and try again.' });
    } finally {
      setSaving(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Page width="focus">
        <div className="skeleton h-8 w-56 rounded" />
        <div className="skeleton h-64 rounded-app-card" />
      </Page>
    );
  }

  return (
    <Page width="focus">
      <PageHeader
        title="What you are studying"
        description="Your project is written from your coursework — the units you are taking this semester decide what the work has to make you practise. Keep this current and the work stays connected to the theory."
      />

      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      {context && (
        <Card>
          <DataList>
            <DataItem label="Programme">
              {context.programmeName} · year {context.currentYear}, semester {context.currentSemester}
            </DataItem>
            <DataItem label="Units this semester">
              <ul className="space-y-1">
                {context.currentUnits.map((unit) => (
                  <li key={`${unit.code ?? ''}${unit.title}`}>
                    <span className="text-app-ink">
                      {unit.code ? `${unit.code} · ` : ''}
                      {unit.title}
                    </span>
                    <span className="app-meta text-app-muted"> — {unit.areaLabels.join(', ')}</span>
                  </li>
                ))}
              </ul>
            </DataItem>
            <DataItem label="Where this came from">{context.provenanceLabel}</DataItem>
          </DataList>
        </Card>
      )}

      <Card pad="generous">
        <Form onSubmit={handleSubmit} noValidate>
          <FormSection
            title="Your programme"
            description={
              programmes.length > 0
                ? 'Your institution has published its curriculum, so you can pick the units instead of typing them.'
                : 'Your institution has not published its curriculum here yet, so tell us yourself. Nothing about the Hub works differently either way.'
            }
            divided={false}
          >
            {programmes.length > 0 && (
              <Select
                label="Programme"
                value={programmeId}
                onChange={(e) => setProgrammeId(e.target.value)}
              >
                {programmes.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
                <option value={TYPE_IT_OUT}>Not listed — I’ll type it out</option>
              </Select>
            )}

            {!usingCurriculum && (
              <>
                <Input
                  label="Programme name"
                  placeholder="BSc Computer Science"
                  value={programmeName}
                  onChange={(e) => setProgrammeName(e.target.value)}
                  hint="As your university writes it on your registration."
                />
                <Select
                  label="Discipline"
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value as AcademicDiscipline)}
                  hint="The Hub covers Computer Science and Information Technology only."
                >
                  <option value={AcademicDiscipline.CS}>Computer Science</option>
                  <option value={AcademicDiscipline.IT}>Information Technology</option>
                </Select>
              </>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Year of study"
                value={String(year)}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {Array.from({ length: maxYear }, (_, i) => i + 1).map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </Select>
              <Select
                label="Current semester"
                value={String(semester)}
                onChange={(e) => setSemester(Number(e.target.value))}
              >
                {Array.from({ length: maxSemester }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </Select>
            </div>
          </FormSection>

          <FormSection
            title="Units you are taking now"
            description="Not everything you have ever studied — what is in front of you this semester. That is what the project has to exercise."
          >
            {usingCurriculum ? (
              semesterUnits.length > 0 ? (
                <ChipGroup
                  label={`Year ${year}, semester ${semester}`}
                  hint={`Pick the ones you are actually registered for — at most ${MAX_CURRENT_UNITS}.`}
                  options={semesterUnits.map((u) => ({
                    value: u._id,
                    label: `${u.code} · ${u.title}`,
                  }))}
                  selected={pickedUnitIds}
                  onToggle={toggleUnit}
                />
              ) : (
                <Alert tone="info">
                  Your institution has published no units for year {year}, semester {semester}.
                  Choose another semester, or pick “Not listed” above and type them out.
                </Alert>
              )
            ) : (
              <div className="space-y-6">
                {declaredUnits.map((unit, index) => (
                  <div key={unit.key} className="space-y-4 border-t border-app-hairline pt-5 first:border-0 first:pt-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="app-label text-app-body">Unit {index + 1}</p>
                      {declaredUnits.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeclaredUnits((prev) => prev.filter((u) => u.key !== unit.key))
                          }
                          className="app-meta text-app-muted underline underline-offset-2 hover:text-app-ink"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
                      <Input
                        label="Code"
                        placeholder="ICS 2304"
                        optional
                        value={unit.code}
                        onChange={(e) => updateDeclared(unit.key, { code: e.target.value })}
                      />
                      <Input
                        label="Unit name"
                        placeholder="Database Systems II"
                        value={unit.title}
                        onChange={(e) => updateDeclared(unit.key, { title: e.target.value })}
                      />
                    </div>
                    <TokenSelect
                      id={`areas-${unit.key}`}
                      label="What this unit is about"
                      hint="Choose up to four. This is how we know what the project must make you practise."
                      placeholder="Add a subject"
                      options={AREA_LABELS}
                      selected={unit.areas}
                      onChange={(next) => updateDeclared(unit.key, { areas: next.slice(0, 4) })}
                    />
                  </div>
                ))}

                {declaredUnits.length < MAX_CURRENT_UNITS && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setDeclaredUnits((prev) => [...prev, blankUnit()])}
                  >
                    Add another unit
                  </Button>
                )}
              </div>
            )}
          </FormSection>

          <FormActions note="You can change this whenever your semester does. It affects the projects you are given next, not the one you are working on now.">
            <Button type="submit" disabled={!canSubmit || saving}>
              {saving ? 'Saving…' : 'Save what I am studying'}
            </Button>
          </FormActions>
        </Form>
      </Card>
    </Page>
  );
}
