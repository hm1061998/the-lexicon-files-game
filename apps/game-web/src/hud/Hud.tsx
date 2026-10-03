import { useRef } from 'react';
import { useGameStore } from '../state/GameStoreContext';
import type { EventBus, GameEventMap, UiStrings } from '@lexicon/shared-types';
import { ObjectivePanel } from './ObjectivePanel';
import { CaseProgress } from './CaseProgress';
import { Minimap } from './Minimap';
import { InteractionPrompt } from './InteractionPrompt';
import { KeyHints } from './KeyHints';
import { useHudInsets } from './useHudInsets';
import './hud.css';

export function Hud({
  strings,
  bus,
}: {
  strings: UiStrings;
  bus?: EventBus<GameEventMap>;
}): JSX.Element {
  const hudRef = useRef<HTMLDivElement>(null);
  useHudInsets(hudRef);
  // The conversation band takes over the screen: the HUD keeps its layout but is not shown.
  const inDialogue = useGameStore((s) => s.dialogueSession !== null);
  return (
    <div className={inDialogue ? 'hud hud--quiet' : 'hud'} ref={hudRef}>
      <ObjectivePanel strings={strings} />
      <CaseProgress strings={strings} />
      <Minimap strings={strings} />
      <InteractionPrompt strings={strings} bus={bus} />
      <KeyHints strings={strings} />
    </div>
  );
}
