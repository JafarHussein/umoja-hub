type Track = 'gold' | 'blue' | 'both' | 'verified' | 'terminated';

interface TrackLabelProps {
  readonly track: Track;
  readonly className?: string;
}

const TRACK_STYLES: Record<Track, string> = {
  gold:       'text-track-gold',
  blue:       'text-track-blue',
  both:       'text-text-disabled',
  verified:   'text-state-verified',
  terminated: 'text-state-terminated',
};

const TRACK_LABELS: Record<Track, string> = {
  gold:       'AGRICULTURAL',
  blue:       'ACADEMIC',
  both:       'BOTH TRACKS',
  verified:   'VERIFIED',
  terminated: 'TERMINATED',
};

export function TrackLabel({ track, className = '' }: TrackLabelProps) {
  return (
    <span
      className={[
        'eyebrow',
        TRACK_STYLES[track],
        className,
      ].join(' ')}
    >
      {TRACK_LABELS[track]}
    </span>
  );
}
