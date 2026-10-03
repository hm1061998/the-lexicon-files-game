import type { UiStrings } from '@lexicon/shared-types';
import { getAvailableChoices } from '@lexicon/game-core';
import { useGameStore } from '../state/GameStoreContext';
import { DialogueView } from './DialogueView';
import { useLearningStore } from '../state/LearningStoreContext';
import { useTranslationMode } from '../state/useTranslationMode';
import { useCallback } from 'react';
import { selectNotebookPeople } from '../notebook/selectNotebookPeople';
import { useSettingsStore } from '../state/SettingsStoreContext';
import { isChoiceSeen } from './isChoiceSeen';
export function DialogueLayer({
  strings,
  returnFocusRef,
}: {
  strings: UiStrings;
  returnFocusRef: { readonly current: HTMLElement | null };
}): JSX.Element | null {
  const state = useGameStore((s) => s);
  const dispatchLearning = useLearningStore((s) => s.dispatchLearning);
  const [translationMode] = useTranslationMode();
  const logOpen = useGameStore((s) => s.dialogueLogOpen);
  const textSpeed = useSettingsStore((s) => s.settings.textSpeed);
  const reducedMotion = useSettingsStore((s) => s.settings.reducedMotion);
  const vocabularyTutorialSeen = useLearningStore((s) => s.vocabularyTutorialSeen);
  const markVocabularyTutorialSeen = useLearningStore((s) => s.markVocabularyTutorialSeen);
  const onEncounter = useCallback(
    (vocabularyId: string, contextId: string) =>
      dispatchLearning({ type: 'encounterContext', vocabularyId, contextId }),
    [dispatchLearning],
  );
  const onInspect = useCallback(
    (vocabularyId: string, contextId: string) =>
      dispatchLearning({ type: 'inspectVocabulary', vocabularyId, contextId }),
    [dispatchLearning],
  );
  const onRevealTranslation = useCallback(
    (vocabularyId: string, contextId: string) =>
      dispatchLearning({ type: 'revealTranslation', vocabularyId, contextId }),
    [dispatchLearning],
  );
  const session = state.dialogueSession;
  if (!session)
    return state.dialogueError ? (
      <div role="alert" className="dialogue-error-notice">
        {strings.dialogueError} {state.dialogueError}
      </div>
    ) : null;
  const tree = state.caseDefinition.dialogues.find((t) => t.id === session.treeId);
  const node = tree?.nodes.find((n) => n.id === session.nodeId);
  if (!node)
    return (
      <div role="alert">
        {strings.dialogueError} Unknown active dialogue node: {session.nodeId}
      </div>
    );
  const speaker = state.caseDefinition.npcs.find((n) => n.id === node.speakerId);
  const notes =
    selectNotebookPeople(state.caseDefinition, state.caseState)
      .find((person) => person.npc.id === session.npcId)
      ?.statements.map((statement) => statement.text) ?? [];
  return (
    <DialogueView
      speakerName={speaker?.name ?? strings.investigator}
      speakerRole={speaker?.role ?? strings.investigator}
      node={node}
      choices={getAvailableChoices(state.caseDefinition, state.caseState, session)}
      session={session}
      strings={strings}
      error={state.dialogueError}
      onChoose={state.chooseDialogue}
      onClose={state.closeDialogue}
      returnFocusRef={returnFocusRef}
      vocabulary={state.caseDefinition.vocabulary}
      translationMode={translationMode}
      onEncounter={onEncounter}
      onInspect={onInspect}
      onRevealTranslation={onRevealTranslation}
      vocabularyTutorialSeen={vocabularyTutorialSeen}
      onVocabularyTutorialSeen={markVocabularyTutorialSeen}
      textSpeed={textSpeed}
      keysDisabled={logOpen}
      reducedMotion={reducedMotion}
      portraitSrc={speaker?.portrait?.default}
      notes={notes}
      isChoiceSeen={(choice) =>
        isChoiceSeen(
          choice,
          tree?.nodes.find((n) => n.id === choice.nextNodeId),
          state.caseState.flags,
        )
      }
    />
  );
}
