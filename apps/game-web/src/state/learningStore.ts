import { createStore, type StoreApi } from 'zustand/vanilla';
import type {
  EventBus,
  GameEventMap,
  LanguageProfile,
  LearningAction,
  VocabularyContextDefinition,
  VocabularyEntry,
} from '@lexicon/shared-types';
import { applyLearningAction } from '@lexicon/learning-engine';
import type { LearningRecordV2 } from '../persistence/learningMigration';

export type LearningStoreState = {
  profile: LanguageProfile;
  vocabularyTutorialSeen: boolean;
  activeWord: { vocabularyId: string; contextId: string } | null;
  error: string | null;
  dispatchLearning(action: LearningAction): void;
  markVocabularyTutorialSeen(): void;
  setActiveWord(word: LearningStoreState['activeWord']): void;
};
export type LearningStore = StoreApi<LearningStoreState>;
export function createLearningStore({
  catalogue,
  contexts,
  initialRecord,
  bus,
  now = () => new Date().toISOString(),
}: {
  catalogue: readonly VocabularyEntry[];
  contexts: readonly VocabularyContextDefinition[];
  initialRecord: LearningRecordV2;
  bus: EventBus<GameEventMap>;
  now?: () => string;
}): LearningStore {
  return createStore<LearningStoreState>((set, get) => ({
    profile: initialRecord.profile,
    vocabularyTutorialSeen: initialRecord.vocabularyTutorialSeen,
    activeWord: null,
    error: null,
    dispatchLearning(action) {
      const result = applyLearningAction(get().profile, catalogue, contexts, action, now());
      if (!result.ok) {
        set({ error: result.error.detail });
        return;
      }
      set({ profile: result.profile, error: null });
      for (const event of result.events) {
        if (event.type === 'vocabularySeen')
          bus.emit('vocab:seen', { vocabularyId: event.vocabularyId, contextId: event.contextId });
        else if (event.type === 'vocabularyInspected')
          bus.emit('vocab:inspected', {
            vocabularyId: event.vocabularyId,
            contextId: event.contextId,
          });
        else
          bus.emit('translation:opened', {
            vocabularyId: event.vocabularyId,
            contextId: event.contextId,
          });
      }
    },
    markVocabularyTutorialSeen() {
      set({ vocabularyTutorialSeen: true });
    },
    setActiveWord(activeWord) {
      set({ activeWord });
    },
  }));
}
