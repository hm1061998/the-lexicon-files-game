import type { TranslationMode, UiStrings, VocabularyEntry } from '@lexicon/shared-types';
import type { NotebookPerson } from './selectNotebookPeople';
import { useId } from 'react';
import { VocabularyText } from '../vocabulary/VocabularyText';

export interface NotebookPeoplePanelProps {
  readonly people: readonly NotebookPerson[];
  readonly catalogue: readonly VocabularyEntry[];
  readonly strings: UiStrings;
  readonly translationMode: TranslationMode;
  readonly onEncounter: (vocabularyId: string, contextId: string) => void;
  readonly onInspect: (vocabularyId: string, contextId: string) => void;
  readonly onRevealTranslation: (vocabularyId: string, contextId: string) => void;
}

export function NotebookPeoplePanel({
  people,
  catalogue,
  strings,
  translationMode,
  onEncounter,
  onInspect,
  onRevealTranslation,
}: NotebookPeoplePanelProps): JSX.Element {
  const headingId = useId();
  if (!people.length) return <p>{strings.notebookEmptyPeople}</p>;
  return (
    <ul className="notebook-people-list">
      {people.map((person) => (
        <li key={person.npc.id}>
          <article className="notebook-person" aria-labelledby={`${headingId}-${person.npc.id}`}>
            <h3 id={`${headingId}-${person.npc.id}`}>{person.npc.name}</h3>
            <p>{person.npc.role}</p>
            <p className="notebook-person-status">
              {person.status === 'complete'
                ? strings.notebookInterviewComplete
                : strings.notebookInterviewInProgress}
            </p>
            <h4>{strings.notebookStatementsHeading}</h4>
            <ul className="notebook-statement-list">
              {person.statements.map((node) => (
                <li key={node.id}>
                  <VocabularyText
                    text={node.text}
                    translationVi={node.translationVi}
                    spans={node.vocabularySpans}
                    contextId={`dialogue:${person.treeId}:${node.id}:text`}
                    catalogue={catalogue}
                    mode={translationMode}
                    strings={strings}
                    onEncounter={onEncounter}
                    onInspect={onInspect}
                    onRevealTranslation={onRevealTranslation}
                  />
                </li>
              ))}
            </ul>
          </article>
        </li>
      ))}
    </ul>
  );
}
