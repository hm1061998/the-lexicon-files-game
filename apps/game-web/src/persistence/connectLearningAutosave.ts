import type { LearningStore } from '../state/learningStore';
import type { LearningRecordV2 } from './learningMigration';
export function connectLearningAutosave(
  store: LearningStore,
  save: (record: LearningRecordV2) => Promise<void>,
  onError: (error: unknown) => void,
): () => void {
  let chain = Promise.resolve();
  let previous = '';
  const unsubscribe = store.subscribe((state) => {
    const snapshot = JSON.stringify({
      profile: state.profile,
      vocabularyTutorialSeen: state.vocabularyTutorialSeen,
    });
    if (snapshot === previous) return;
    previous = snapshot;
    const record: LearningRecordV2 = {
      schemaVersion: 2,
      profile: state.profile,
      vocabularyTutorialSeen: state.vocabularyTutorialSeen,
      updatedAt: Date.now(),
    };
    chain = chain.then(() => save(record)).catch(onError);
  });
  return unsubscribe;
}
