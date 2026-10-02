import { describe, expect, it } from 'vitest';
import { createEventBus } from '../bridge/eventBus';
import type { GameEventMap } from '@lexicon/shared-types';
import { createDefaultLearningRecord } from '../persistence/learningMigration';
import { createLearningStore } from './learningStore';
import { allOnboardingSeen } from '../onboarding/onboardingTypes';

const catalogue = [
  {
    id: 'leave',
    lemma: 'leave',
    partOfSpeech: 'verb',
    cefr: 'A1' as const,
    definitionEn: 'To go away.',
    translationVi: 'rời đi',
    examples: ['I left.'],
    tags: [],
    surfaceForms: ['left'],
  },
];
const contexts = [{ id: 'dialogue:anna:entry:text', vocabularyIds: ['leave'] }];

describe('learning store', () => {
  it('emits typed events only for a new visible context encounter', () => {
    const bus = createEventBus<GameEventMap>();
    const seen: string[] = [];
    bus.on('vocab:seen', ({ vocabularyId, contextId }) =>
      seen.push(`${vocabularyId}:${contextId}`),
    );
    const store = createLearningStore({
      catalogue,
      contexts,
      initialRecord: createDefaultLearningRecord(),
      bus,
    });
    const action = {
      type: 'encounterContext' as const,
      vocabularyId: 'leave',
      contextId: contexts[0]!.id,
    };
    store.getState().dispatchLearning(action);
    store.getState().dispatchLearning(action);
    expect(seen).toEqual(['leave:dialogue:anna:entry:text']);
    expect(store.getState().profile.vocabulary.leave?.stage).toBe('seen');
  });

  it('keeps an invalid action readable without mutating the profile', () => {
    const bus = createEventBus<GameEventMap>();
    const store = createLearningStore({
      catalogue,
      contexts,
      initialRecord: createDefaultLearningRecord(),
      bus,
    });
    const profile = store.getState().profile;
    store.getState().dispatchLearning({
      type: 'encounterContext',
      vocabularyId: 'unknown',
      contextId: contexts[0]!.id,
    });
    expect(store.getState().profile).toBe(profile);
    expect(store.getState().error).toContain('Unknown vocabulary');
  });

  it('starts from the saved onboarding flags and marks a hint once', () => {
    const bus = createEventBus<GameEventMap>();
    const store = createLearningStore({
      catalogue,
      contexts,
      initialRecord: createDefaultLearningRecord(),
      bus,
    });
    expect(store.getState().onboardingSeen).toEqual(allOnboardingSeen(false));
    let notifications = 0;
    store.subscribe(() => (notifications += 1));
    store.getState().markOnboardingSeen('move');
    store.getState().markOnboardingSeen('move');
    expect(notifications).toBe(1);
    expect(store.getState().onboardingSeen).toEqual({ ...allOnboardingSeen(false), move: true });
    const resumed = createLearningStore({
      catalogue,
      contexts,
      initialRecord: { ...createDefaultLearningRecord(), onboardingSeen: allOnboardingSeen(true) },
      bus,
    });
    expect(resumed.getState().onboardingSeen).toEqual(allOnboardingSeen(true));
  });
});
