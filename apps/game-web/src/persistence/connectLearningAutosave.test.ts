import { describe, expect, it } from 'vitest';
import { createEventBus } from '../bridge/eventBus';
import type { GameEventMap } from '@lexicon/shared-types';
import { createLearningStore } from '../state/learningStore';
import { createDefaultLearningRecord } from './learningMigration';
import { connectLearningAutosave } from './connectLearningAutosave';

describe('learning autosave', () => {
  it('serializes rapid changes, saves the latest value last and omits translationMode', async () => {
    const store = createLearningStore({
      catalogue: [],
      contexts: [],
      initialRecord: createDefaultLearningRecord(),
      bus: createEventBus<GameEventMap>(),
    });
    const saves: unknown[] = [];
    const disconnect = connectLearningAutosave(
      store,
      async (record) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        saves.push(record);
      },
      () => undefined,
    );
    store.getState().markVocabularyTutorialSeen();
    disconnect();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(saves).toHaveLength(1);
    expect(saves[0]).toMatchObject({
      schemaVersion: 3,
      vocabularyTutorialSeen: true,
      onboardingSeen: { move: false, interact: false, notebook: false, board: false },
    });
    expect(saves[0]).not.toHaveProperty('translationMode');
  });
});
