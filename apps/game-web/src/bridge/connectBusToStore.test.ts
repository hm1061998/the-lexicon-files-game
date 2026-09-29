import { describe, expect, it } from 'vitest';
import type { GameEventMap } from '@lexicon/shared-types';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createEventBus } from './eventBus';
import { connectBusToStore } from './connectBusToStore';
import { createGameStore } from '../state/gameStore';

const caseDefinition = loadCaseDefinition('case-001');

describe('connectBusToStore', () => {
  it('nearby event sets store.nearby', () => {
    const bus = createEventBus<GameEventMap>();
    const store = createGameStore({ caseDefinition });
    connectBusToStore(bus, store);

    bus.emit('interaction:nearby', { interactableId: 'note', prompt: 'Read the note' });

    expect(store.getState().nearby).toEqual({ id: 'note', prompt: 'Read the note' });
  });

  it('cleared event resets nearby', () => {
    const bus = createEventBus<GameEventMap>();
    const store = createGameStore({ caseDefinition });
    connectBusToStore(bus, store);

    bus.emit('interaction:nearby', { interactableId: 'note', prompt: 'Read the note' });
    bus.emit('interaction:cleared', {});

    expect(store.getState().nearby).toBeNull();
  });

  it('clears nearby interaction when a scene transition is requested', () => {
    const bus = createEventBus<GameEventMap>();
    const store = createGameStore({ caseDefinition });
    connectBusToStore(bus, store);
    store.getState().setNearby({ id: 'hallway_door', prompt: 'Enter Archive' });

    bus.emit('scene:transitionRequested', { sceneId: 'archive', spawnId: 'from_office' });

    expect(store.getState().nearby).toBeNull();
  });

  it('player:moved publishes the position to the store', () => {
    const bus = createEventBus<GameEventMap>();
    const store = createGameStore({ caseDefinition });
    connectBusToStore(bus, store);

    bus.emit('player:moved', { x: 12, y: 34 });

    expect(store.getState().playerPosition).toEqual({ x: 12, y: 34 });
  });

  it('a scene transition clears the published player position', () => {
    const bus = createEventBus<GameEventMap>();
    const store = createGameStore({ caseDefinition });
    connectBusToStore(bus, store);
    bus.emit('player:moved', { x: 12, y: 34 });

    bus.emit('scene:transitionRequested', { sceneId: 'archive', spawnId: 'from_office' });

    expect(store.getState().playerPosition).toBeNull();
  });

  it('interaction:anchor sets and clears interactionAnchor', () => {
    const bus = createEventBus<GameEventMap>();
    const store = createGameStore({ caseDefinition });
    connectBusToStore(bus, store);

    bus.emit('interaction:anchor', { interactableId: 'note', x: 10, y: 20 });
    expect(store.getState().interactionAnchor).toEqual({ x: 10, y: 20 });

    bus.emit('interaction:anchor', { interactableId: null });
    expect(store.getState().interactionAnchor).toBeNull();
  });

  it('interaction:cleared and scene transitions clear interactionAnchor', () => {
    const bus = createEventBus<GameEventMap>();
    const store = createGameStore({ caseDefinition });
    connectBusToStore(bus, store);

    bus.emit('interaction:anchor', { interactableId: 'note', x: 10, y: 20 });
    bus.emit('interaction:cleared', {});
    expect(store.getState().interactionAnchor).toBeNull();

    bus.emit('interaction:anchor', { interactableId: 'note', x: 10, y: 20 });
    bus.emit('scene:transitionRequested', { sceneId: 'archive', spawnId: 'from_office' });
    expect(store.getState().interactionAnchor).toBeNull();
  });

  it('disconnect stops syncing', () => {
    const bus = createEventBus<GameEventMap>();
    const store = createGameStore({ caseDefinition });
    const disconnect = connectBusToStore(bus, store);

    disconnect();
    bus.emit('interaction:nearby', { interactableId: 'note', prompt: 'Read the note' });

    expect(store.getState().nearby).toBeNull();
  });
});
