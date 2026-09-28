import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { LearningStore, LearningStoreState } from './learningStore';
import { createInitialLanguageProfile } from '@lexicon/learning-engine';
const Context = createContext<LearningStore | null>(null);
const fallbackState: LearningStoreState = {
  profile: createInitialLanguageProfile(),
  translationMode: 'Learning',
  vocabularyTutorialSeen: false,
  activeWord: null,
  error: null,
  dispatchLearning() {},
  setTranslationMode() {},
  markVocabularyTutorialSeen() {},
  setActiveWord() {},
};
export function LearningStoreProvider({
  store,
  children,
}: {
  store: LearningStore;
  children: ReactNode;
}): JSX.Element {
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useLearningStore<T>(selector: (state: LearningStoreState) => T): T {
  const store = useContext(Context);
  const state = useSyncExternalStore(
    store?.subscribe ?? (() => () => undefined),
    store?.getState ?? (() => fallbackState),
    () => fallbackState,
  );
  return selector(state);
}
