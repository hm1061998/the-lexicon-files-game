import { PaperPanel } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import { useGameStore } from '../state/GameStoreContext';

export function ObjectivePanel({ strings }: { strings: UiStrings }): JSX.Element {
  const objective = useGameStore((state) => {
    return (
      state.caseDefinition.objectives.find(
        (item) => state.caseState.objectiveStatuses[item.id] === 'active',
      ) ?? null
    );
  });

  return (
    <PaperPanel className="hud-objective-panel">
      <h2 className="hud-objective-heading">{strings.objectiveHeading}</h2>
      {objective ? (
        <p className="hud-objective-text">
          <span className="hud-objective-marker" aria-hidden="true" />
          {objective.text}
        </p>
      ) : null}
    </PaperPanel>
  );
}
