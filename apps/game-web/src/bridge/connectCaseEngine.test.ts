import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import type { GameEventMap } from '@lexicon/shared-types';
import { createEventBus } from './eventBus';
import { connectCaseEngine } from './connectCaseEngine';
import { createGameStore } from '../state/gameStore';

describe('connectCaseEngine', () => {
  it('applies the objective note effects when interaction is triggered', () => {
    const definition = loadCaseDefinition('case-001');
    const bus = createEventBus<GameEventMap>();
    const store = createGameStore({ caseDefinition: definition });
    connectCaseEngine(bus, store, definition);

    bus.emit('interaction:triggered', { interactableId: 'objective_note' });

    expect(store.getState().caseState.objectiveStatuses[definition.initialObjectiveId]).toBe(
      'completed',
    );
    expect(store.getState().caseState.evidenceIds).toEqual([]);
  });

  it('does not change case state for an interaction without effects', () => {
    const definition = loadCaseDefinition('case-001');
    const bus = createEventBus<GameEventMap>();
    const store = createGameStore({ caseDefinition: definition });
    connectCaseEngine(bus, store, definition);
    const before = store.getState().caseState;

    bus.emit('interaction:triggered', { interactableId: 'unknown-interaction' });

    expect(store.getState().caseState).toBe(before);
  });

  it('disconnect stops applying interaction effects', () => {
    const definition = loadCaseDefinition('case-001');
    const bus = createEventBus<GameEventMap>();
    const store = createGameStore({ caseDefinition: definition });
    const disconnect = connectCaseEngine(bus, store, definition);
    const before = store.getState().caseState;

    disconnect();
    bus.emit('interaction:triggered', { interactableId: 'objective_note' });

    expect(store.getState().caseState).toBe(before);
  });
});
