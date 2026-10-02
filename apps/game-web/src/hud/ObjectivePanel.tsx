import { useEffect, useState } from 'react';
import { PaperSheet } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import { useGameStore } from '../state/GameStoreContext';
import { clearLeaving, nextObjectiveDisplay, type ObjectiveDisplay } from './objectiveTransition';

/** How long the old objective stays on the paper, struck through, before it is removed. */
const STRIKE_MS = 300;

export function ObjectivePanel({ strings }: { strings: UiStrings }): JSX.Element {
  const visible = useGameStore((state) => state.objectiveVisible);
  const toggle = useGameStore((state) => state.toggleObjective);
  // Select primitives: a fresh object per call would make the store snapshot unstable.
  const activeId = useGameStore(
    (state) =>
      state.caseDefinition.objectives.find(
        (item) => state.caseState.objectiveStatuses[item.id] === 'active',
      )?.id ?? null,
  );
  const activeText = useGameStore(
    (state) =>
      state.caseDefinition.objectives.find(
        (item) => state.caseState.objectiveStatuses[item.id] === 'active',
      )?.text ?? null,
  );
  const active = activeId === null ? null : { id: activeId, text: activeText ?? '' };
  const [display, setDisplay] = useState<ObjectiveDisplay>({ current: active, leaving: null });

  useEffect(() => {
    setDisplay((prev) =>
      nextObjectiveDisplay(
        prev,
        activeId === null ? null : { id: activeId, text: activeText ?? '' },
      ),
    );
  }, [activeId, activeText]);

  const leavingId = display.leaving?.id ?? null;
  useEffect(() => {
    if (leavingId === null) return;
    const timer = setTimeout(() => setDisplay(clearLeaving), STRIKE_MS);
    return () => clearTimeout(timer);
  }, [leavingId]);

  if (!visible) {
    return (
      <button
        className="hud-panel-launcher hud-objective-launcher"
        type="button"
        aria-expanded={false}
        aria-label={strings.expandObjective}
        onClick={toggle}
      >
        <span aria-hidden="true">◎</span>
        <span className="hud-panel-launcher-text">{strings.objectiveHeading}</span>
      </button>
    );
  }

  return (
    <PaperSheet edge="torn" clip tilt={-1} className="hud-objective-panel">
      <button
        className="hud-panel-collapse"
        type="button"
        aria-expanded={true}
        aria-label={strings.collapseObjective}
        onClick={toggle}
      />
      <h2 className="hud-objective-heading">{strings.objectiveHeading}</h2>
      {display.leaving ? (
        <p
          key={`leaving-${display.leaving.id}`}
          className="hud-objective-text hud-objective--leaving"
        >
          <span className="hud-objective-marker" aria-hidden="true" />
          {display.leaving.text}
        </p>
      ) : null}
      {display.current ? (
        <p key={display.current.id} className="hud-objective-text">
          <span className="hud-objective-marker" aria-hidden="true" />
          {display.current.text}
        </p>
      ) : null}
    </PaperSheet>
  );
}
