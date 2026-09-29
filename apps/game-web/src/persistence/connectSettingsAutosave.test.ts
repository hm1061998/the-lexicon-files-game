import { describe, expect, it } from 'vitest';
import { createDefaultSettings, type SettingsV1 } from './settingsSchema';
import { createSettingsStore } from '../state/settingsStore';
import { connectSettingsAutosave } from './connectSettingsAutosave';

describe('settings autosave', () => {
  it('writes once per change, in order, and skips identical values', async () => {
    const store = createSettingsStore(createDefaultSettings({ prefersReducedMotion: false }));
    const saves: SettingsV1[] = [];
    const disconnect = connectSettingsAutosave(
      store,
      async (s) => {
        await new Promise((r) => setTimeout(r, 5));
        saves.push(s);
      },
      () => undefined,
    );
    store.getState().setVolume(50);
    store.getState().setVolume(50);
    store.getState().setVolume(60);
    disconnect();
    store.getState().setVolume(70);
    await new Promise((r) => setTimeout(r, 60));
    expect(saves.map((s) => s.volume)).toEqual([50, 60]);
  });
  it('reports write errors and keeps going', async () => {
    const store = createSettingsStore(createDefaultSettings({ prefersReducedMotion: false }));
    const errors: unknown[] = [];
    let n = 0;
    connectSettingsAutosave(
      store,
      async () => {
        if (n++ === 0) throw new Error('boom');
      },
      (e) => errors.push(e),
    );
    store.getState().setVolume(10);
    store.getState().setVolume(20);
    await new Promise((r) => setTimeout(r, 30));
    expect(errors).toHaveLength(1);
    expect(n).toBe(2);
  });
});
