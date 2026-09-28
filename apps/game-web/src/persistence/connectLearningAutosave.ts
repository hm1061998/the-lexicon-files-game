import type { LearningStore } from '../state/learningStore';
import type { LearningRecordV1 } from './learningMigration';
export function connectLearningAutosave(
  store: LearningStore,
  save: (record: LearningRecordV1) => Promise<void>,
  onError: (error: unknown) => void,
): () => void {
  let chain = Promise.resolve();
  let previous = '';
  const unsubscribe = store.subscribe((state) => {
    const snapshot = JSON.stringify({
      profile: state.profile,
      translationMode: state.translationMode,
      vocabularyTutorialSeen: state.vocabularyTutorialSeen,
    });
    if (snapshot === previous) return;
    previous = snapshot;
    const record: LearningRecordV1 = {
      schemaVersion: 1,
      profile: state.profile,
      translationMode: state.translationMode,
      vocabularyTutorialSeen: state.vocabularyTutorialSeen,
      updatedAt: Date.now(),
    };
    chain = chain.then(() => save(record)).catch(onError);
  });
  return unsubscribe;
}
