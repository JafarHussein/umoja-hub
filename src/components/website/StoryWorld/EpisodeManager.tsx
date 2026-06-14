'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CharacterBase } from './CharacterBase';
import { CharacterProp } from './CharacterProp';
import { ConversationBubble } from './ConversationBubble';
import { DemoParticles } from './DemoParticles';
import {
  CHARACTERS,
  CHARACTER_ARRIVAL,
  CHARACTER_CONVO_POS,
  COUNCIL_RING_POS,
  EPISODES,
  GUIDE_POS,
} from '@/lib/storyworld/config';
import { useStoryworldStore } from '@/lib/storyworld/store';
import type { DialogueLine } from '@/lib/storyworld/types';

// World-space position of the Guide — characters face toward this during conversation
const GUIDE_WORLD = new THREE.Vector3(...GUIDE_POS);

const LERP = 0.05;
const LINE_HOLD_BASE = 3.5;     // seconds
const LINE_HOLD_PER_WORD = 0.22; // seconds per word

function wordCount(text: string) {
  return text.trim().split(/\s+/).length;
}

// ── Single Episode Instance ──────────────────────────────────────────────────

interface EpisodeInstanceProps {
  episodeIndex: number;
  isActive: boolean;
}

export function EpisodeInstance({ episodeIndex, isActive }: EpisodeInstanceProps) {
  // EPISODES is a static 6-element array; episodeIndex is always 0-5
  const ep = EPISODES[episodeIndex] as NonNullable<typeof EPISODES[number]>;
  const charId = ep.characterId;
  const charDef = CHARACTERS[charId];

  // Position + orientation tracking
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(...CHARACTER_ARRIVAL[charId]));
  const targetPos = useRef(new THREE.Vector3(...CHARACTER_ARRIVAL[charId]));
  const faceDir = useRef(new THREE.Vector3()); // scratch vector for facing calculation
  const councilPos = useRef(new THREE.Vector3(...COUNCIL_RING_POS[charId])); // stable ref

  // Conversation state
  const [activeLine, setActiveLine] = useState<DialogueLine | null>(null);
  const [lineVisible, setLineVisible] = useState(false);
  const [demoActive, setDemoActive] = useState(false);

  const firedLines = useRef<Set<string>>(new Set());
  const firedDemo = useRef(false);
  const lineHoldTimer = useRef<number | null>(null);
  const wallTimeRef = useRef(0);
  const crossingFired = useRef(false);

  const { markEpisodeComplete } = useStoryworldStore();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    wallTimeRef.current = clock.getElapsedTime();

    const { episodeIndex: activeEpisodeIdx, episodeProgress, reducedMotion } =
      useStoryworldStore.getState();

    const myProgress = activeEpisodeIdx === episodeIndex ? episodeProgress : -1;

    // Determine target position
    if (myProgress < 0) {
      // Not active — stay at arrival or council ring (if completed)
      const { completedEpisodes } = useStoryworldStore.getState();
      if (completedEpisodes.includes(episodeIndex)) {
        targetPos.current.set(...COUNCIL_RING_POS[charId]);
      } else {
        targetPos.current.set(...CHARACTER_ARRIVAL[charId]);
      }
    } else if (myProgress < ep.arrivalAt + 0.15) {
      // Approaching — lerp from arrival to convo pos
      const t = myProgress / (ep.arrivalAt + 0.15);
      targetPos.current.lerpVectors(
        new THREE.Vector3(...CHARACTER_ARRIVAL[charId]),
        new THREE.Vector3(...CHARACTER_CONVO_POS[charId]),
        Math.min(1, t)
      );
    } else if (myProgress >= ep.crossingAt) {
      // Crossing — lerp to council ring
      const t = (myProgress - ep.crossingAt) / (1 - ep.crossingAt);
      targetPos.current.lerpVectors(
        new THREE.Vector3(...CHARACTER_CONVO_POS[charId]),
        new THREE.Vector3(...COUNCIL_RING_POS[charId]),
        Math.min(1, t)
      );
      if (!crossingFired.current && myProgress > ep.crossingAt + 0.1) {
        crossingFired.current = true;
        markEpisodeComplete(episodeIndex);
      }
    } else {
      targetPos.current.set(...CHARACTER_CONVO_POS[charId]);
    }

    // Lerp to target
    if (reducedMotion) {
      currentPos.current.copy(targetPos.current);
    } else {
      currentPos.current.lerp(targetPos.current, LERP);
    }
    groupRef.current.position.copy(currentPos.current);

    // Face: during approach/crossing face the walk destination; during conversation face the Guide
    const faceTarget =
      myProgress >= 0 && myProgress < ep.crossingAt
        ? GUIDE_WORLD
        : councilPos.current;
    faceDir.current.copy(faceTarget).sub(groupRef.current.position).setY(0);
    if (faceDir.current.lengthSq() > 0.001) {
      groupRef.current.rotation.y = Math.atan2(faceDir.current.x, faceDir.current.z);
    }

    // Dialogue triggers
    if (myProgress >= 0 && isActive) {
      for (const line of ep.dialogue) {
        if (myProgress >= line.triggerAt && !firedLines.current.has(line.id)) {
          firedLines.current.add(line.id);
          showLine(line, clock.getElapsedTime());
          break;
        }
      }

      // Demo trigger
      if (myProgress >= ep.demoAt && !firedDemo.current) {
        firedDemo.current = true;
        setDemoActive(true);
        setTimeout(() => setDemoActive(false), 4000);
      }
    }
  });

  function showLine(line: DialogueLine, now: number) {
    // Dismiss previous
    setLineVisible(false);
    if (lineHoldTimer.current !== null) {
      clearTimeout(lineHoldTimer.current);
    }
    // Show after dismiss animation
    setTimeout(() => {
      setActiveLine(line);
      setLineVisible(true);
      const hold = LINE_HOLD_BASE + wordCount(line.text) * LINE_HOLD_PER_WORD;
      lineHoldTimer.current = window.setTimeout(() => {
        setLineVisible(false);
      }, hold * 1000);
    }, activeLine ? 300 : 0);
    void now; // suppress unused warning
  }

  useEffect(() => {
    // Reset on episode change (e.g. scroll backward)
    firedLines.current = new Set();
    firedDemo.current = false;
    crossingFired.current = false;
    setActiveLine(null);
    setLineVisible(false);
    setDemoActive(false);
  }, [episodeIndex]); // intentionally not listing setters — they are stable refs

  const isInConversation = lineVisible && activeLine?.speaker === 'participant';

  return (
    <>
      <group ref={groupRef} position={CHARACTER_ARRIVAL[charId]}>
        <CharacterBase color={charDef.color} isActive={isInConversation} />
        <CharacterProp characterId={charId} color={charDef.color} />
      </group>

      {activeLine && (
        <ConversationBubble
          line={activeLine}
          characterId={charId}
          visible={lineVisible}
        />
      )}

      <DemoParticles
        type={ep.demoType}
        characterId={charId}
        active={demoActive}
      />
    </>
  );
}

// ── Episode Manager — renders the right episode instances ────────────────────

export function EpisodeManager() {
  const [rendered, setRendered] = useState<number[]>([]);

  useFrame(() => {
    const { episodeIndex, completedEpisodes } = useStoryworldStore.getState();
    const needed = new Set([...completedEpisodes]);
    if (episodeIndex >= 0) needed.add(episodeIndex);
    const arr = Array.from(needed);
    if (arr.length !== rendered.length || arr.some(i => !rendered.includes(i))) {
      setRendered(arr);
    }
  });

  const activeEpisodeIndex = useStoryworldStore(s => s.episodeIndex);

  return (
    <>
      {rendered.map(idx => (
        <EpisodeInstance
          key={idx}
          episodeIndex={idx}
          isActive={idx === activeEpisodeIndex}
        />
      ))}
    </>
  );
}
