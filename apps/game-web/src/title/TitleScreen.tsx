import { PaperPanel } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import type { TitleActions } from './titleModel';
import './title.css';

export function TitleScreen({
  strings,
  actions,
  onContinue,
  onNewCase,
  onHowTo,
  onSettings,
  onChangeCase,
}: {
  strings: UiStrings;
  actions: TitleActions;
  onContinue: () => void;
  onNewCase: () => void;
  onHowTo: () => void;
  onSettings: () => void;
  onChangeCase?: () => void;
}): JSX.Element {
  return (
    <main className="title-screen">
      <PaperPanel as="section" className="title-card">
        <h1>{strings.titleGame}</h1>
        <p className="title-tagline">{strings.titleTagline}</p>
        <nav className="title-actions" aria-label={strings.titleGame}>
          {actions.continue ? (
            <button
              type="button"
              className={actions.primary === 'continue' ? 'title-primary' : undefined}
              autoFocus={actions.primary === 'continue'}
              onClick={onContinue}
            >
              {strings.titleContinue}
            </button>
          ) : null}
          <button
            type="button"
            className={actions.primary === 'newCase' ? 'title-primary' : undefined}
            autoFocus={actions.primary === 'newCase'}
            onClick={onNewCase}
          >
            {strings.titleNewCase}
          </button>
          <button type="button" onClick={onHowTo}>
            {strings.titleHowTo}
          </button>
          <button type="button" onClick={onSettings}>
            {strings.titleSettings}
          </button>
          {onChangeCase ? (
            <button type="button" onClick={onChangeCase}>
              {strings.titleChangeCase}
            </button>
          ) : null}
        </nav>
      </PaperPanel>
    </main>
  );
}
