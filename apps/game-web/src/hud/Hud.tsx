import type { EventBus, GameEventMap, UiStrings } from '@lexicon/shared-types';
import { ObjectivePanel } from './ObjectivePanel';
import { CaseProgress } from './CaseProgress';
import { Minimap } from './Minimap';
import { InteractionPrompt } from './InteractionPrompt';
import { KeyHints } from './KeyHints';
import './hud.css';

export function Hud({
  strings,
  bus,
}: {
  strings: UiStrings;
  bus?: EventBus<GameEventMap>;
}): JSX.Element {
  return (
    <div className="hud">
      <ObjectivePanel strings={strings} />
      <CaseProgress strings={strings} />
      <Minimap strings={strings} />
      <InteractionPrompt strings={strings} bus={bus} />
      <KeyHints strings={strings} />
    </div>
  );
}
