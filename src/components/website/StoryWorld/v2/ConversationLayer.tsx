'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { ADMIN_EMISSIVE, EPISODE_ROLES, ROLES, STAGING } from '@/lib/storyworld/v2/config';
import { BRANCHES, EPISODES_V2, FINALE_DIALOGUE } from '@/lib/storyworld/v2/data';
import { useStoryworldV2 } from '@/lib/storyworld/v2/store';
import type { DialogueLineV2, RoleId } from '@/lib/storyworld/v2/types';

// Conversation architecture (§6): comic panels anchored to living speakers.
// The spine is scroll-cued; branches play in a wall-clock pocket (§9.4).
// Every Administrator answer fires its consequence on the same beat (§6.6).

const FINALE_ADMIN_POS: [number, number, number] = [1.0, 0, 1.8];
const BRANCH_LINE_HOLD_MS = 4200;

function speakerAnchor(speaker: RoleId, chapter: number): [number, number, number] {
  if (speaker === 'admin') {
    const role = chapter >= 1 && chapter <= 7 ? EPISODE_ROLES[chapter - 1] : undefined;
    if (role) {
      const p = STAGING[role].convoAdmin;
      return [p[0], p[1] + 2.1, p[2]];
    }
    return [FINALE_ADMIN_POS[0], 2.1, FINALE_ADMIN_POS[2]];
  }
  const staging = STAGING[speaker as Exclude<RoleId, 'admin'>];
  const p = chapter === 8 ? staging.home : staging.convoChar;
  return [p[0], p[1] + 2.1, p[2]];
}

interface PanelProps {
  speaker: RoleId;
  text: string;
  chipLabel?: string;
  onChip?: () => void;
}

function Panel({ speaker, text, chipLabel, onChip }: PanelProps) {
  const isAdmin = speaker === 'admin';
  const color = isAdmin ? ADMIN_EMISSIVE : ROLES[speaker].color;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      style={{
        opacity: open ? 1 : 0,
        transform: open ? 'scaleY(1) translateY(0)' : 'scaleY(0.6) translateY(8px)',
        transformOrigin: 'bottom center',
        transition:
          'opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)',
        width: '270px',
        backgroundColor: 'rgba(13,16,20,0.94)',
        border: `1px solid ${isAdmin ? '#2a4a48' : '#2e363f'}`,
        borderRadius: '4px',
        padding: '14px 16px',
        fontFamily: 'var(--font-ibm-plex-mono), monospace',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          color,
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}
      >
        {ROLES[speaker].label}
      </div>
      <p style={{ color: '#c8c2ba', fontSize: '11px', lineHeight: 1.65, margin: 0 }}>{text}</p>
      {chipLabel && onChip && (
        <button
          type="button"
          onClick={onChip}
          style={{
            display: 'block',
            marginTop: '10px',
            padding: '6px 10px',
            background: 'transparent',
            border: '1px solid #2e363f',
            borderLeft: `2px solid ${color}`,
            borderRadius: '3px',
            color: '#a9a29a',
            fontFamily: 'var(--font-ibm-plex-mono), monospace',
            fontSize: '10px',
            letterSpacing: '0.03em',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {chipLabel} →
        </button>
      )}
      {/* Tail — ties the panel to its speaker */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '-14px',
          width: '1px',
          height: '14px',
          background: isAdmin ? '#2a4a48' : '#2e363f',
        }}
      />
    </div>
  );
}

export function ConversationLayer() {
  const [activeLine, setActiveLine] = useState<DialogueLineV2 | null>(null);
  const [branchLine, setBranchLine] = useState<{ speaker: RoleId; text: string } | null>(null);
  const branchTimers = useRef<number[]>([]);
  const branchesPlayed = useRef<Set<string>>(new Set());
  const activeLineId = useRef<string | null>(null);
  const branchActive = useStoryworldV2(s => s.branchActive);
  const resetEpoch = useStoryworldV2(s => s.resetEpoch);
  const chapterForAnchor = useRef(0);

  // A world reset replays the story — chips become available again.
  useEffect(() => {
    branchesPlayed.current.clear();
    activeLineId.current = null;
    setActiveLine(null);
    setBranchLine(null);
  }, [resetEpoch]);

  // Spine cueing — scroll proposes the line; consequences fire on first show.
  useFrame(() => {
    const store = useStoryworldV2.getState();
    const { chapter, chapterProgress } = store;
    chapterForAnchor.current = chapter;
    if (store.branchActive) return; // the spine yields to the pocket

    let lines: DialogueLineV2[] | null = null;
    let cutoff = 0.74;
    if (chapter >= 1 && chapter <= 7) {
      lines = EPISODES_V2[chapter - 1]?.dialogue ?? null;
    } else if (chapter === 8) {
      lines = FINALE_DIALOGUE;
      cutoff = 0.92;
    }

    let next: DialogueLineV2 | null = null;
    if (lines && chapterProgress < cutoff) {
      for (const line of lines) {
        if (chapterProgress >= line.triggerAt) next = line;
      }
    }

    if ((next?.id ?? null) !== activeLineId.current) {
      activeLineId.current = next?.id ?? null;
      setActiveLine(next);
      if (next?.consequence) {
        store.fireConsequence(next.consequence, next.speaker);
      }
    }
  });

  // Branch pocket lifecycle — sequence lines on the wall clock, then release.
  useEffect(() => {
    if (!branchActive) {
      branchTimers.current.forEach(t => window.clearTimeout(t));
      branchTimers.current = [];
      setBranchLine(null);
      return;
    }
    const branch = BRANCHES.find(b => b.id === branchActive);
    if (!branch) return;
    setBranchLine(branch.lines[0] ?? null);
    branch.lines.slice(1).forEach((line, i) => {
      branchTimers.current.push(
        window.setTimeout(() => setBranchLine(line), (i + 1) * BRANCH_LINE_HOLD_MS)
      );
    });
    branchTimers.current.push(
      window.setTimeout(
        () => useStoryworldV2.getState().endBranch(),
        branch.lines.length * BRANCH_LINE_HOLD_MS
      )
    );
    return () => {
      branchTimers.current.forEach(t => window.clearTimeout(t));
      branchTimers.current = [];
    };
  }, [branchActive]);

  function handleChip(branchId: string) {
    if (branchesPlayed.current.has(branchId)) return;
    branchesPlayed.current.add(branchId);
    const store = useStoryworldV2.getState();
    store.firstInteraction('ask');
    store.startBranch(branchId);
  }

  const shown = branchLine ?? activeLine;
  if (!shown) return null;

  const chip =
    !branchLine && activeLine?.branchId && !branchesPlayed.current.has(activeLine.branchId)
      ? BRANCHES.find(b => b.id === activeLine.branchId)
      : undefined;

  return (
    <Html
      position={speakerAnchor(shown.speaker, chapterForAnchor.current)}
      center
      distanceFactor={6.5}
      style={{ pointerEvents: chip ? 'auto' : 'none' }}
      zIndexRange={[20, 10]}
    >
      <Panel
        key={branchLine ? branchLine.text : activeLine?.id}
        speaker={shown.speaker}
        text={shown.text}
        {...(chip ? { chipLabel: chip.chipLabel, onChip: () => handleChip(chip.id) } : {})}
      />
    </Html>
  );
}
