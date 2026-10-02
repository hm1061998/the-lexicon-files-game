import { useEffect, useState } from 'react';
import { KeyHintLine, type KeyHintItem } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import { useGameStore } from '../state/GameStoreContext';

/** Below this the line shows keys only; labels move into `aria-label` (spec D-1). */
const COMPACT_WIDTH = 960;
const COMPACT_HEIGHT = 640;

function useCompact(): boolean {
  const read = (): boolean =>
    typeof window !== 'undefined' &&
    (window.innerWidth < COMPACT_WIDTH || window.innerHeight < COMPACT_HEIGHT);
  const [compact, setCompact] = useState(read);
  useEffect(() => {
    const onResize = (): void => setCompact(read());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return compact;
}

export function KeyHints({ strings }: { strings: UiStrings }): JSX.Element {
  const toggleNotebook = useGameStore((state) => state.toggleNotebook);
  const toggleDeduction = useGameStore((state) => state.toggleDeduction);
  const toggleMap = useGameStore((state) => state.toggleMinimap);
  const togglePause = useGameStore((state) => state.togglePause);
  const locked = useGameStore((state) => state.inputLocked);
  const hasTarget = useGameStore((state) => state.nearby !== null);
  const compact = useCompact();
  // E has no click action: interacting stays on the prompt next to the target.
  const items: KeyHintItem[] = [
    { key: 'E', label: strings.interact, dimmed: !hasTarget },
    { key: 'J', label: strings.openNotebook, onActivate: toggleNotebook, disabled: locked },
    { key: 'B', label: strings.openDeductionBoard, onActivate: toggleDeduction, disabled: locked },
    { key: 'M', label: strings.toggleMap, onActivate: toggleMap, disabled: locked },
    { key: 'Esc', label: strings.pause, onActivate: togglePause, disabled: locked },
  ];
  return <KeyHintLine className="hud-key-hints" compact={compact} items={items} />;
}
