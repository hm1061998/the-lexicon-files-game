import { useId } from 'react';
import { PaperPanel } from '@lexicon/ui';
import type { CaseDefinition, GameState, UiStrings } from '@lexicon/shared-types';
import type { NotebookTab } from '../state/gameStore';
import './notebook.css';

const TABS: readonly {
  id: NotebookTab;
  label: keyof Pick<UiStrings, 'people' | 'evidence' | 'vocabulary'>;
}[] = [
  { id: 'people', label: 'people' },
  { id: 'evidence', label: 'evidence' },
  { id: 'vocabulary', label: 'vocabulary' },
];

export function NotebookPanel({
  caseDefinition,
  caseState,
  activeTab,
  strings,
  onSelectTab,
  onClose,
}: {
  caseDefinition: CaseDefinition;
  caseState: GameState;
  activeTab: NotebookTab;
  strings: UiStrings;
  onSelectTab(tab: NotebookTab): void;
  onClose(): void;
}): JSX.Element {
  const headingId = useId();
  const discovered = caseDefinition.evidences.filter(({ id }) =>
    caseState.evidenceIds.includes(id),
  );

  return (
    <div className="notebook-overlay">
      <PaperPanel as="div" className="notebook-panel">
        <section aria-labelledby={headingId}>
          <header className="notebook-header">
            <h2 id={headingId}>{strings.notebook}</h2>
            <button type="button" onClick={onClose} aria-label={strings.close}>
              {strings.close}
            </button>
          </header>
          <nav className="notebook-tabs" aria-label={strings.notebook}>
            {TABS.map(({ id, label }) => (
              <button
                type="button"
                key={id}
                aria-current={activeTab === id ? 'page' : undefined}
                onClick={() => onSelectTab(id)}
              >
                {strings[label]}
              </button>
            ))}
          </nav>
          <div className="notebook-content">
            {activeTab === 'people' && <p>{strings.notebookEmptyPeople}</p>}
            {activeTab === 'vocabulary' && <p>{strings.notebookEmptyVocabulary}</p>}
            {activeTab === 'evidence' &&
              (discovered.length > 0 ? (
                <ul>
                  {discovered.map((item) => (
                    <li key={item.id}>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{strings.evidenceEmpty}</p>
              ))}
          </div>
        </section>
      </PaperPanel>
    </div>
  );
}
