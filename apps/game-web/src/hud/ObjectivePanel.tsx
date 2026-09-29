import { PaperPanel } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import { useGameStore } from '../state/GameStoreContext';

/** Inline paperclip drawn in ink, pinned over the panel's top-left corner. */
function PaperClip(): JSX.Element {
  return (
    <svg
      className="hud-objective-clip"
      viewBox="0 0 24 56"
      width="24"
      height="56"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 40V13a5 5 0 0 1 10 0v34a8 8 0 0 1-16 0V16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
      <PaperClip />
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
