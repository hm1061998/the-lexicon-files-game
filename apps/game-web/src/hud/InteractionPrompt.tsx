import { Keycap, PaperPanel } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import { useGameStore } from '../state/GameStoreContext';

export function InteractionPrompt({ strings }: { strings: UiStrings }): JSX.Element | null {
  const nearby = useGameStore((state) => state.nearby);

  if (!nearby) {
    return null;
  }

  return (
    <PaperPanel as="div" className="hud-interaction-prompt">
      <div role="status" aria-live="polite">
        <Keycap>E</Keycap>
        <span className="hud-interaction-prompt-text" aria-label={strings.interact}>
          {nearby.prompt}
        </span>
      </div>
    </PaperPanel>
  );
}
