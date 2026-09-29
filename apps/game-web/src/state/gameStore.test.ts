import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createCaseState } from '@lexicon/game-core';
import { createGameStore } from './gameStore';

describe('createGameStore', () => {
  it('initializes the core case state from the case definition', () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });
    const state = store.getState();

    expect(state.caseDefinition).toBe(definition);
    expect(state.caseState.caseId).toBe(definition.id);
    expect(state.caseState.caseTitle).toBe(definition.title);
    expect(state.caseState.evidenceTotal).toBe(definition.evidenceTotal);
    expect(state.caseState.evidenceIds).toEqual([]);
    expect(state.caseState.objectiveStatuses[definition.initialObjectiveId]).toBe('active');
  });

  it('applies case effects through the core reducer', () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });

    const result = store
      .getState()
      .applyCaseEffects([
        { type: 'completeObjective', objectiveId: definition.initialObjectiveId },
      ]);

    expect(result.ok).toBe(true);
    expect(store.getState().caseState.objectiveStatuses[definition.initialObjectiveId]).toBe(
      'completed',
    );
  });

  it('applies correct listening effects through game-core and leaves wrong answers unchanged', () => {
    const definition = loadCaseDefinition('case-001');
    const initial = applyAudioEvidence(definition);
    const store = createGameStore({ caseDefinition: definition, initialState: initial });
    const beforeWrongAnswer = store.getState().caseState;

    const wrong = store.getState().answerListeningTask('leo_phone_recording_location', 'inside');
    expect(wrong).toMatchObject({ ok: true, correct: false, state: beforeWrongAnswer, events: [] });
    expect(store.getState().caseState).toBe(beforeWrongAnswer);

    const correct = store.getState().answerListeningTask('leo_phone_recording_location', 'outside');
    expect(correct).toMatchObject({ ok: true, correct: true });
    expect(store.getState().caseState.discoveredFactIds).toContain('leo_outside_at_2029');
  });

  it('uses a restored core state when provided', () => {
    const definition = loadCaseDefinition('case-001');
    const restored = {
      ...createCaseState(definition),
      evidenceIds: ['meeting_minutes'],
    };

    const store = createGameStore({ caseDefinition: definition, initialState: restored });

    expect(store.getState().caseState).toBe(restored);
  });

  it('starts with the Evidence notebook tab closed and unlocked', () => {
    const definition = loadCaseDefinition('case-001');
    const state = createGameStore({ caseDefinition: definition }).getState();

    expect(state.activeEvidenceId).toBeNull();
    expect(state.notebookOpen).toBe(false);
    expect(state.notebookTab).toBe('evidence');
    expect(state.inputLocked).toBe(false);
  });

  it('locks input while evidence is open and unlocks it when closed', () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });

    store.getState().openEvidence('meeting_minutes');
    expect(store.getState().activeEvidenceId).toBe('meeting_minutes');
    expect(store.getState().inputLocked).toBe(true);

    store.getState().closeEvidence();
    expect(store.getState().activeEvidenceId).toBeNull();
    expect(store.getState().inputLocked).toBe(false);
  });

  it('locks input while notebook is open and allows selecting its tab', () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });

    store.getState().toggleNotebook();
    store.getState().setNotebookTab('people');

    expect(store.getState().notebookTab).toBe('people');
    expect(store.getState().notebookOpen).toBe(true);
    expect(store.getState().inputLocked).toBe(true);

    store.getState().toggleNotebook();
    expect(store.getState().inputLocked).toBe(false);
  });

  it('reopens the notebook on Evidence after closing it from another tab', () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });

    store.getState().toggleNotebook();
    store.getState().setNotebookTab('people');
    store.getState().toggleNotebook();
    store.getState().toggleNotebook();

    expect(store.getState().notebookOpen).toBe(true);
    expect(store.getState().notebookTab).toBe('evidence');
  });

  it('does not notify store subscribers when opening the same evidence twice', () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });
    let notifications = 0;
    store.subscribe(() => {
      notifications += 1;
    });

    store.getState().openEvidence('meeting_minutes');
    const afterFirstOpen = notifications;
    store.getState().openEvidence('meeting_minutes');

    expect(notifications).toBe(afterFirstOpen);
  });

  it('keeps persistence errors separate from the core case state', () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });
    const caseState = store.getState().caseState;

    store.getState().setPersistenceError('save failed');

    expect(store.getState().caseState).toBe(caseState);
    expect(store.getState().persistenceError).toBe('save failed');
  });
});

function applyAudioEvidence(definition: ReturnType<typeof loadCaseDefinition>) {
  return createGameStore({ caseDefinition: definition })
    .getState()
    .applyCaseEffects([{ type: 'addEvidence', evidenceId: 'leo_phone_recording' }]).state;
}
