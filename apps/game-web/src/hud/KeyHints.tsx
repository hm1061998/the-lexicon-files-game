import { Keycap, PaperPanel } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';

export function KeyHints({ strings }: { strings: UiStrings }): JSX.Element {
  return (
    <PaperPanel className="hud-key-hints">
      <span className="hud-key-hint">
        <Keycap>E</Keycap> — {strings.interact}
      </span>
      <span className="hud-key-hint">
        <Keycap>Esc</Keycap> — {strings.pause}
      </span>
    </PaperPanel>
  );
}
