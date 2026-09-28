import { useEffect, useId, useState } from 'react';
import { PaperPanel } from '@lexicon/ui';
import type {
  CaseDefinition,
  GameState,
  LanguageProfile,
  TranslationMode,
  UiStrings,
} from '@lexicon/shared-types';
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
  profile,
  translationMode = 'Learning',
  onRevealTranslation = () => undefined,
}: {
  caseDefinition: CaseDefinition;
  caseState: GameState;
  activeTab: NotebookTab;
  strings: UiStrings;
  onSelectTab(tab: NotebookTab): void;
  onClose(): void;
  profile?: LanguageProfile;
  translationMode?: TranslationMode;
  onRevealTranslation?(vocabularyId: string, contextId: string): void;
}): JSX.Element {
  const headingId = useId();
  const [revealedVocabularyId, setRevealedVocabularyId] = useState<string | null>(null);
  useEffect(() => setRevealedVocabularyId(null), [translationMode]);
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
            {activeTab === 'vocabulary' &&
              (Object.keys(profile?.vocabulary ?? {}).length ? (
                <ul>
                  {caseDefinition.vocabulary
                    .filter((entry) => profile?.vocabulary[entry.id])
                    .map((entry) => (
                      <li key={entry.id}>
                        <h3>
                          {entry.lemma} <small>{strings.vocabularyStageSeen}</small>
                        </h3>
                        <p>{entry.definitionEn}</p>
                        {translationMode === 'Beginner' ? (
                          <p>{entry.translationVi}</p>
                        ) : translationMode === 'Learning' && revealedVocabularyId === entry.id ? (
                          <p>{entry.translationVi}</p>
                        ) : translationMode === 'Learning' ? (
                          <button
                            type="button"
                            onClick={() => {
                              const contextId = profile?.vocabulary[entry.id]?.contextsSeen[0];
                              if (contextId) onRevealTranslation(entry.id, contextId);
                              setRevealedVocabularyId(entry.id);
                            }}
                          >
                            {strings.revealTranslation}
                          </button>
                        ) : null}
                      </li>
                    ))}
                </ul>
              ) : (
                <p>{strings.notebookEmptyVocabulary}</p>
              ))}
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
