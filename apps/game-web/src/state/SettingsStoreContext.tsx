import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import { createDefaultSettings } from '../persistence/settingsSchema';
import { createSettingsStore, type SettingsStore, type SettingsStoreState } from './settingsStore';

const Context = createContext<SettingsStore | null>(null);
const fallbackStore = createSettingsStore(createDefaultSettings({ prefersReducedMotion: false }));

export function SettingsStoreProvider({
  store,
  children,
}: {
  store: SettingsStore;
  children: ReactNode;
}): JSX.Element {
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useSettingsStore<T>(selector: (state: SettingsStoreState) => T): T {
  const store = useContext(Context) ?? fallbackStore;
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  return selector(state);
}
