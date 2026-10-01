import { useGameStore } from '../state/GameStoreContext';
import { Keycap, PaperPanel } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';

export function KeyHints({ strings }: { strings: UiStrings }): JSX.Element {
  const toggleNotebook = useGameStore(state => state.toggleNotebook);
  const toggleMap = useGameStore(state => state.toggleMinimap);
  const togglePause = useGameStore(state => state.togglePause);
  const locked = useGameStore(state => state.inputLocked);
  return (
    <PaperPanel className="hud-key-hints">
      <span className="hud-key-hint hud-movement-hint">
        <Keycap>WASD / ↑↓←→</Keycap> {strings.move}
      </span>
      <span className="hud-key-hint hud-movement-hint"><Keycap>E</Keycap> {strings.interact}</span>
      
      <button type="button" className="hud-key-hint" disabled={locked} onClick={toggleNotebook}>
        <Keycap>J</Keycap> {strings.openNotebook}
      </button>
      <button type="button" className="hud-key-hint" disabled={locked} onClick={toggleMap}>
        <Keycap>M</Keycap> {strings.toggleMap}
      </button>
      <button type="button" className="hud-key-hint" disabled={locked} onClick={togglePause}>
        <Keycap>Esc</Keycap> {strings.pause}
      </button>
    </PaperPanel>
  );
}

