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
    expect(saveGameState).toHaveBeenCalledWith(store.getState().caseState, 'main_office');
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

  it('autosaves when the active scene changes without changing case progress', async () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });
    const saveGameState = vi.fn(async () => {});
    const disconnect = connectAutosave(store, saveGameState, vi.fn());

    store.getState().transitionScene('archive', 'from_office');
    await flushQueue();

    expect(saveGameState).toHaveBeenCalledTimes(1);
    expect(saveGameState).toHaveBeenCalledWith(store.getState().caseState, 'archive');
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

describe('connectAutosave triggers', () => {
  function setup() {
    const store = createGameStore({ caseDefinition: loadCaseDefinition('case-001') });
    const saveGameState = vi.fn(async (_state: GameState, _sceneId: string) => {});
    const disconnect = connectAutosave(store, saveGameState, vi.fn());
    return { store, saveGameState, disconnect };
  }

  it('saves once per progress trigger with the matching snapshot', async () => {
    const { store, saveGameState, disconnect } = setup();
    const triggers: Array<() => void> = [
      () =>
        store.getState().applyCaseEffects([{ type: 'addEvidence', evidenceId: 'meeting_minutes' }]),
      () =>
        store
          .getState()
          .applyCaseEffects([{ type: 'completeObjective', objectiveId: 'check_security_records' }]),
      () =>
        store
          .getState()
          .applyCaseEffects([{ type: 'setFlag', key: 'david_statement_read', value: true }]),
      () => store.getState().transitionScene('archive', 'from_office'),
      () =>
        store
          .getState()
          .applyCaseEffects([{ type: 'addEvidence', evidenceId: 'security_access_log' }]),
    ];
    let expected = 0;
    for (const trigger of triggers) {
      trigger();
      await flushQueue();
      expected += 1;
      expect(saveGameState).toHaveBeenCalledTimes(expected);
      expect(saveGameState).toHaveBeenLastCalledWith(
        store.getState().caseState,
        store.getState().activeSceneId,
      );
    }
    const result = store
      .getState()
      .submitContradiction('david_statement_vs_access_log', [
        'david_statement_no_entry_after_20_00',
        'david_entry_20_32',
      ]);
    await flushQueue();
    expect(result).toMatchObject({ ok: true, correct: true });
    expect(saveGameState).toHaveBeenCalledTimes(expected + 1);
    expect(saveGameState).toHaveBeenLastCalledWith(store.getState().caseState, 'archive');
    expect(store.getState().caseState.contradictionIds).toContain('david_statement_vs_access_log');
    disconnect();
  });

  it('does not save for UI-only actions', async () => {
    const { store, saveGameState, disconnect } = setup();
    store.getState().toggleNotebook();
    store.getState().toggleNotebook();
    store.getState().setPaused(true);
    store.getState().setPaused(false);
    store.getState().setNearby({ id: 'x', prompt: 'y' });
    store.getState().openEvidence('meeting_minutes');
    await flushQueue();
    expect(saveGameState).not.toHaveBeenCalled();
    disconnect();
  });

  it('does not save after disconnect', async () => {
    const { store, saveGameState, disconnect } = setup();
    disconnect();
    store.getState().transitionScene('archive', 'from_office');
    store.getState().applyCaseEffects([{ type: 'setFlag', key: 'checked_desk', value: true }]);
    await flushQueue();
    expect(saveGameState).not.toHaveBeenCalled();
  });
});
