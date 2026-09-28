import { describe, expect, it } from 'vitest';
import type { CaseSummary, GameEventMap } from '@lexicon/shared-types';
import { createEventBus } from './eventBus';
import { connectBusToStore } from './connectBusToStore';
import { createGameStore } from '../state/gameStore';

const caseSummary: CaseSummary = {
  id: 'case-test',
  title: 'Test Case',
  evidenceTotal: 5,
  initialObjective: { id: 'obj-1', text: 'Do the thing' },
};

describe('connectBusToStore', () => {
  it('nearby event sets store.nearby', () => {
    const bus = createEventBus<GameEventMap>();
    const store = createGameStore({ caseSummary });
    connectBusToStore(bus, store);

    bus.emit('interaction:nearby', { interactableId: 'note', prompt: 'Read the note' });

    expect(store.getState().nearby).toEqual({ id: 'note', prompt: 'Read the note' });
  });

  it('cleared event resets nearby', () => {
    const bus = createEventBus<GameEventMap>();
    const store = createGameStore({ caseSummary });
    connectBusToStore(bus, store);

    bus.emit('interaction:nearby', { interactableId: 'note', prompt: 'Read the note' });
    bus.emit('interaction:cleared', {});

    expect(store.getState().nearby).toBeNull();
  });

  it('disconnect stops syncing', () => {
    const bus = createEventBus<GameEventMap>();
    const store = createGameStore({ caseSummary });
    const disconnect = connectBusToStore(bus, store);

    disconnect();
    bus.emit('interaction:nearby', { interactableId: 'note', prompt: 'Read the note' });

    expect(store.getState().nearby).toBeNull();
  });
});
