import { PaperPanel } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import { useGameStore } from '../state/GameStoreContext';

export function CaseProgress({ strings }: { strings: UiStrings }): JSX.Element {
  const evidenceCollected = useGameStore((state) => state.evidenceCollected);
  const evidenceTotal = useGameStore((state) => state.evidenceTotal);

  return (
    <PaperPanel className="hud-case-progress">
      <span className="hud-case-progress-label">{strings.caseFile}</span>
      <span className="hud-case-progress-count">{`${evidenceCollected}/${evidenceTotal}`}</span>
    </PaperPanel>
  );
}
