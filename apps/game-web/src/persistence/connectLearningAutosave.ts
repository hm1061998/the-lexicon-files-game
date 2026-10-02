import type { LearningStore } from '../state/learningStore';
import type { LearningRecordV3 } from './learningMigration';
export function connectLearningAutosave(
  store: LearningStore,
  save: (record: LearningRecordV3) => Promise<void>,
  onError: (error: unknown) => void,
): () => void {
  let chain = Promise.resolve();
  let previous = '';
  const unsubscribe = store.subscribe((state) => {
    const snapshot = JSON.stringify({
      profile: state.profile,
      vocabularyTutorialSeen: state.vocabularyTutorialSeen,
      onboardingSeen: state.onboardingSeen,
    });
    if (snapshot === previous) return;
    previous = snapshot;
    const record: LearningRecordV3 = {
      schemaVersion: 3,
      profile: state.profile,
      vocabularyTutorialSeen: state.vocabularyTutorialSeen,
      onboardingSeen: state.onboardingSeen,
      updatedAt: Date.now(),
    };
    chain = chain.then(() => save(record)).catch(onError);
  });
  return unsubscribe;
}
