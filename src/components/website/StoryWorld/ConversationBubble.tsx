'use client';

import { Html } from '@react-three/drei';
import { CHARACTERS, CHARACTER_CONVO_POS, GUIDE_POS } from '@/lib/storyworld/config';
import type { DialogueLine, Speaker } from '@/lib/storyworld/types';
import type { CharacterId } from '@/lib/storyworld/types';

interface BubbleProps {
  line: DialogueLine;
  characterId: CharacterId;
  visible: boolean;
}

export function ConversationBubble({ line, characterId, visible }: BubbleProps) {
  const isGuide = line.speaker === 'guide';
  const charDef = CHARACTERS[characterId];

  // Position: above speaker
  const speakerPos = isGuide
    ? [GUIDE_POS[0], GUIDE_POS[1] + 2.6, GUIDE_POS[2]] as [number, number, number]
    : [
        CHARACTER_CONVO_POS[characterId][0],
        CHARACTER_CONVO_POS[characterId][1] + 2.6,
        CHARACTER_CONVO_POS[characterId][2],
      ] as [number, number, number];

  const speakerColor = isGuide ? '#56a8a2' : charDef.color;
  const speakerLabel = isGuide ? 'THE GUIDE' : charDef.label;
  const borderColor = isGuide ? '#2a4a48' : '#2e363f';

  return (
    <Html
      position={speakerPos}
      center
      distanceFactor={9}
      occlude={false}
      style={{ pointerEvents: 'none' }}
    >
      <BubbleCard
        visible={visible}
        speaker={line.speaker}
        speakerLabel={speakerLabel}
        speakerColor={speakerColor}
        text={line.text}
        borderColor={borderColor}
      />
    </Html>
  );
}

interface CardProps {
  visible: boolean;
  speaker: Speaker;
  speakerLabel: string;
  speakerColor: string;
  text: string;
  borderColor: string;
}

function BubbleCard({ visible, speakerLabel, speakerColor, text, borderColor }: CardProps) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px)' : 'translateY(10px)',
        transition: 'opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1)',
        width: '270px',
        backgroundColor: 'rgba(13,16,20,0.94)',
        border: `1px solid ${borderColor}`,
        borderRadius: '4px',
        padding: '14px 16px',
        fontFamily: 'var(--font-ibm-plex-mono), monospace',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          color: speakerColor,
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}
      >
        {speakerLabel}
      </div>
      <p
        style={{
          color: '#c8c2ba',
          fontSize: '11px',
          lineHeight: '1.65',
          margin: 0,
        }}
      >
        {text}
      </p>
    </div>
  );
}
