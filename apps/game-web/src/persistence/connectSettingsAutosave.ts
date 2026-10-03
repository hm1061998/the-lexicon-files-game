import type { SettingsStore } from '../state/settingsStore';
import type { SettingsV2 } from './settingsSchema';

export function connectSettingsAutosave(
  store: SettingsStore,
  save: (settings: SettingsV2) => Promise<void>,
  onError: (error: unknown) => void,
): () => void {
  let chain = Promise.resolve();
  let previous = JSON.stringify(store.getState().settings);
  return store.subscribe((state) => {
    const snapshot = JSON.stringify(state.settings);
    if (snapshot === previous) return;
    previous = snapshot;
    const settings = state.settings;
    chain = chain.then(() => save(settings)).catch(onError);
  });
}
