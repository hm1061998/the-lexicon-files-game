import { useRef } from 'react';
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
  return (
    <div className="hud" ref={hudRef}>
      <ObjectivePanel strings={strings} />
      <CaseProgress strings={strings} />
      <Minimap strings={strings} />
      <InteractionPrompt strings={strings} bus={bus} />
      <KeyHints strings={strings} />
    </div>
  );
}
