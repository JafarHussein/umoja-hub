import { selectPeerReviewer } from '../peerReviewer';

// A fixed "random" so the tie-break is examinable rather than flaky.
const firstOfTies = (): number => 0;
const lastOfTies = (): number => 0.999;

describe('selectPeerReviewer', () => {
  it('gives the work to whoever is carrying the least of it', () => {
    const chosen = selectPeerReviewer({
      candidates: [
        { id: 'busy', openAssignments: 4 },
        { id: 'free', openAssignments: 0 },
        { id: 'middling', openAssignments: 2 },
      ],
    });

    expect(chosen?.id).toBe('free');
  });

  it('spreads ties rather than always returning the first document', () => {
    const candidates = [
      { id: 'a', openAssignments: 1 },
      { id: 'b', openAssignments: 1 },
      { id: 'c', openAssignments: 1 },
    ];

    expect(selectPeerReviewer({ candidates, random: firstOfTies })?.id).toBe('a');
    expect(selectPeerReviewer({ candidates, random: lastOfTies })?.id).toBe('c');
  });

  it('prefers a reader who has not already judged this project', () => {
    const chosen = selectPeerReviewer({
      candidates: [
        { id: 'first-pass', openAssignments: 0 },
        { id: 'fresh', openAssignments: 3 },
      ],
      excludeIds: ['first-pass'],
    });

    expect(chosen?.id).toBe('fresh');
  });

  // On a small cohort the only reader available may be the one who read the
  // previous revision. That is a worse review, but it is not a reason to stop
  // a student submitting their work.
  it('falls back to a previous reader rather than refusing the submission', () => {
    const chosen = selectPeerReviewer({
      candidates: [{ id: 'only-peer', openAssignments: 2 }],
      excludeIds: ['only-peer'],
    });

    expect(chosen?.id).toBe('only-peer');
  });

  it('returns null when there is genuinely nobody to ask', () => {
    expect(selectPeerReviewer({ candidates: [] })).toBeNull();
  });
});
