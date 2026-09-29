import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import { type SettingsStore, type SettingsStoreState } from './settingsStore';

const Context = createContext<SettingsStore | null>(null);

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
  const store = useContext(Context);
  if (!store) throw new Error('useSettingsStore must be used within a SettingsStoreProvider');
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  return selector(state);
}
