import type { TranslationMode, UiStrings, VocabularyEntry } from '@lexicon/shared-types';
import type { NotebookPerson } from '../notebook/selectNotebookPeople';
import { VocabularyText } from '../vocabulary/VocabularyText';
export interface InvestigationLearningProps {
  catalogue: readonly VocabularyEntry[];
  strings: UiStrings;
  translationMode: TranslationMode;
  onEncounter(id: string, contextId: string): void;
  onInspect(id: string, contextId: string): void;
  onRevealTranslation(id: string, contextId: string): void;
}
export function RecordedStatements({
  person,
  ...learning
}: { person: NotebookPerson } & InvestigationLearningProps): JSX.Element {
  return (
    <>
      <h4>{learning.strings.notebookStatementsHeading}</h4>
      <ul className="notebook-statement-list">
        {person.statements.map((node) => (
          <li key={node.id}>
            <VocabularyText
              key={`${person.treeId}:${node.id}`}
              text={node.text}
              translationVi={node.translationVi}
              spans={node.vocabularySpans}
              contextId={`dialogue:${person.treeId}:${node.id}:text`}
              mode={learning.translationMode}
              {...learning}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
