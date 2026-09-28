import { describe, expect, it } from 'vitest';
import { createEventBus } from '../bridge/eventBus';
import type { GameEventMap } from '@lexicon/shared-types';
import { createLearningStore } from '../state/learningStore';
import { createDefaultLearningRecord } from './learningMigration';
import { connectLearningAutosave } from './connectLearningAutosave';

describe('learning autosave', () => {
  it('serializes rapid mode changes and saves the latest value last', async () => {
    const store = createLearningStore({
      catalogue: [],
      contexts: [],
      initialRecord: createDefaultLearningRecord(),
      bus: createEventBus<GameEventMap>(),
    });
    const modes: string[] = [];
    const disconnect = connectLearningAutosave(
      store,
      async (record) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        modes.push(record.translationMode);
      },
      () => undefined,
    );
    store.getState().setTranslationMode('Beginner');
    store.getState().setTranslationMode('Immersion');
    expect(store.getState().translationMode).toBe('Immersion');
    disconnect();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(modes).toEqual(['Beginner', 'Immersion']);
  });
});
