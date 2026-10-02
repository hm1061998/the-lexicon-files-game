import { useEffect, useRef, useState } from 'react';
import { IndexTab } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import { useGameStore } from '../state/GameStoreContext';

export function CaseProgress({ strings }: { strings: UiStrings }): JSX.Element {
  const evidenceCollected = useGameStore((state) => state.caseState.evidenceIds.length);
  const evidenceTotal = useGameStore((state) => state.caseState.evidenceTotal);
  const previous = useRef(evidenceCollected);
  // Remounting the count (new key) replays its 180ms bounce once per new evidence.
  const [bump, setBump] = useState(0);

  useEffect(() => {
    if (evidenceCollected > previous.current) setBump((value) => value + 1);
    previous.current = evidenceCollected;
  }, [evidenceCollected]);

  return (
    <div className="hud-case-progress hud-case-badge">
      <IndexTab>
        <span className="hud-case-progress-label">{strings.caseFile}</span>
        <span
          key={bump}
          className={`hud-case-progress-count${bump > 0 ? ' hud-case-progress-count--bump' : ''}`}
        >{`${evidenceCollected}/${evidenceTotal}`}</span>
      </IndexTab>
    </div>
  );
}
