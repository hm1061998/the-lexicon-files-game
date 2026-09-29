import { PaperPanel } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import { useGameStore } from '../state/GameStoreContext';

function FolderIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 28 22" width="28" height="22" aria-hidden="true" focusable="false">
      <path
        d="M2 4.5A1.5 1.5 0 0 1 3.5 3H10l2.5 3H24.5A1.5 1.5 0 0 1 26 7.5v11a1.5 1.5 0 0 1-1.5 1.5h-21A1.5 1.5 0 0 1 2 18.5z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CaseProgress({ strings }: { strings: UiStrings }): JSX.Element {
  const evidenceCollected = useGameStore((state) => state.caseState.evidenceIds.length);
  const evidenceTotal = useGameStore((state) => state.caseState.evidenceTotal);

  return (
    <PaperPanel className="hud-case-progress hud-case-badge">
      <FolderIcon />
      <span className="hud-case-progress-label">{strings.caseFile}</span>
      <span className="hud-case-progress-count">{`${evidenceCollected}/${evidenceTotal}`}</span>
    </PaperPanel>
  );
}
