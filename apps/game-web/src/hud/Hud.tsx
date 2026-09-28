import type { UiStrings } from '@lexicon/shared-types';
import { ObjectivePanel } from './ObjectivePanel';
import { CaseProgress } from './CaseProgress';
import { InteractionPrompt } from './InteractionPrompt';
import { KeyHints } from './KeyHints';
import './hud.css';

export function Hud({ strings }: { strings: UiStrings }): JSX.Element {
  return (
    <div className="hud">
      <ObjectivePanel strings={strings} />
      <CaseProgress strings={strings} />
      <InteractionPrompt strings={strings} />
      <KeyHints strings={strings} />
    </div>
  );
}
