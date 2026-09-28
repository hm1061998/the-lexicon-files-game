import { describe, expect, it, vi } from 'vitest';
import type { GameState } from '@lexicon/shared-types';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createGameStore } from '../state/gameStore';
import { connectAutosave } from './connectAutosave';

async function flushQueue(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('connectAutosave', () => {
  it('autosaves only when caseState changes', async () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });
    const saveGameState = vi.fn(async () => {});
    const disconnect = connectAutosave(store, saveGameState, vi.fn());

    store.getState().applyCaseEffects([{ type: 'addEvidence', evidenceId: 'meeting_minutes' }]);
    await flushQueue();

    expect(saveGameState).toHaveBeenCalledTimes(1);
    expect(saveGameState).toHaveBeenCalledWith(store.getState().caseState);
    disconnect();
  });

  it('does not autosave UI-only changes', async () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });
    const saveGameState = vi.fn(async () => {});
    const disconnect = connectAutosave(store, saveGameState, vi.fn());

    store.getState().openEvidence('meeting_minutes');
    store.getState().toggleNotebook();
    store.getState().setNotebookTab('people');
    await flushQueue();

    expect(saveGameState).not.toHaveBeenCalled();
    disconnect();
  });

  it('does not autosave duplicate evidence', async () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });
    const saveGameState = vi.fn(async () => {});
    const disconnect = connectAutosave(store, saveGameState, vi.fn());

    store.getState().applyCaseEffects([{ type: 'addEvidence', evidenceId: 'meeting_minutes' }]);
    store.getState().applyCaseEffects([{ type: 'addEvidence', evidenceId: 'meeting_minutes' }]);
    await flushQueue();

    expect(saveGameState).toHaveBeenCalledTimes(1);
    disconnect();
  });

  it('serializes writes in state order', async () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });
    const firstWrite: { resolve?: () => void } = {};
    const firstWritePending = new Promise<void>((resolve) => {
      firstWrite.resolve = resolve;
    });
    const snapshots: GameState[] = [];
    const saveGameState = vi.fn(async (state: GameState) => {
      snapshots.push(state);
      if (snapshots.length === 1) await firstWritePending;
    });
    const disconnect = connectAutosave(store, saveGameState, vi.fn());

    store.getState().applyCaseEffects([{ type: 'addEvidence', evidenceId: 'meeting_minutes' }]);
    await flushQueue();
    store.getState().applyCaseEffects([{ type: 'setFlag', key: 'checked_desk', value: true }]);
    await flushQueue();

    expect(snapshots).toHaveLength(1);
    firstWrite.resolve?.();
    await flushQueue();

    expect(snapshots.map((state) => state.flags.checked_desk ?? false)).toEqual([false, true]);
    disconnect();
  });

  it('reports save failures without losing in-memory state', async () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });
    const onError = vi.fn();
    const disconnect = connectAutosave(
      store,
      async () => {
        throw new Error('disk full');
      },
      onError,
    );

    store.getState().applyCaseEffects([{ type: 'addEvidence', evidenceId: 'meeting_minutes' }]);
    await flushQueue();

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'disk full' }));
    expect(store.getState().caseState.evidenceIds).toEqual(['meeting_minutes']);
    disconnect();
  });

  it('unsubscribes on cleanup', async () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });
    const saveGameState = vi.fn(async () => {});
    const disconnect = connectAutosave(store, saveGameState, vi.fn());
    disconnect();

    store.getState().applyCaseEffects([{ type: 'addEvidence', evidenceId: 'meeting_minutes' }]);
    await flushQueue();

    expect(saveGameState).not.toHaveBeenCalled();
  });
});
