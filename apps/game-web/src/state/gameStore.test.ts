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

  it('places timeline events through game-core, permits retries, and saves only correct placements', () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });
    const initial = store.getState().caseState;

    const wrong = store.getState().placeTimelineEvent('report_missing_21_05', '20_45');
    expect(wrong).toMatchObject({ ok: true, correct: false, state: initial });
    expect(store.getState().caseState).toBe(initial);

    const correct = store.getState().placeTimelineEvent('report_missing_21_05', '21_05');
    expect(correct).toMatchObject({ ok: true, correct: true });
    expect(store.getState().caseState.timelineEventIds).toEqual(['report_missing_21_05']);

    const completed = store.getState().caseState;
    expect(store.getState().placeTimelineEvent('report_missing_21_05', '21_05')).toMatchObject({
      ok: true,
      correct: true,
      state: completed,
    });
    expect(store.getState().caseState).toBe(completed);
  });

  it('submits contradiction pairs through game-core without losing retry progress', () => {
    const definition = loadCaseDefinition('case-001');
    const initial = {
      ...createCaseState(definition),
      discoveredFactIds: [
        'david_statement_no_entry_after_20_00',
        'david_entry_20_32',
        'meeting_started',
        'leo_outside_at_2029',
      ],
    };
    const store = createGameStore({ caseDefinition: definition, initialState: initial });
    const wrong = store
      .getState()
      .submitContradiction('david_statement_vs_access_log', [
        'meeting_started',
        'leo_outside_at_2029',
      ]);
    expect(wrong).toMatchObject({ ok: true, correct: false, state: initial, events: [] });
    expect(store.getState().caseState).toBe(initial);

    const correct = store
      .getState()
      .submitContradiction('david_statement_vs_access_log', [
        'david_statement_no_entry_after_20_00',
        'david_entry_20_32',
      ]);
    expect(correct).toMatchObject({ ok: true, correct: true });
    expect(store.getState().caseState.flags.david_contradiction_found).toBe(true);
    expect(store.getState().caseState.objectiveStatuses.compare_david_statement).toBe('completed');
    expect(store.getState().caseState.contradictionIds).toEqual(['david_statement_vs_access_log']);
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

  it('starts at a valid scene and transitions only to a declared scene and spawn', () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition, initialSceneId: 'main_office' });

    expect(store.getState().activeSceneId).toBe('main_office');
    expect(store.getState().transitionScene('archive', 'from_office')).toBe(true);
    expect(store.getState().activeSceneId).toBe('archive');
    expect(store.getState().transitionScene('unknown', 'default')).toBe(false);
    expect(store.getState().transitionScene('archive', 'unknown')).toBe(false);
    expect(store.getState().activeSceneId).toBe('archive');
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

  function storeReadyToAccuse() {
    const definition = loadCaseDefinition('case-001');
    const base = createCaseState(definition);
    const conclusion = definition.conclusion!;
    const initialState = {
      ...base,
      discoveredFactIds: ['david_took_report'],
      flags: { david_confession_read: true },
      objectiveStatuses: { ...base.objectiveStatuses, [conclusion.objectiveId]: 'active' as const },
    };
    return {
      definition,
      conclusion,
      store: createGameStore({ caseDefinition: definition, initialState }),
    };
  }

  it('keeps the exact case state after a wrong accusation', () => {
    const { conclusion, store } = storeReadyToAccuse();
    const before = store.getState().caseState;
    const wrong = conclusion.suspectNpcIds.find((id) => id !== conclusion.correctSuspectNpcId)!;
    const result = store.getState().submitAccusation(wrong);
    expect(result.ok && result.correct).toBe(false);
    expect(store.getState().caseState).toBe(before);
  });

  it('closes the case through game-core and locks gameplay input on a correct accusation', () => {
    const { conclusion, store } = storeReadyToAccuse();
    const result = store.getState().submitAccusation(conclusion.correctSuspectNpcId);
    expect(result.ok && result.correct).toBe(true);
    expect(store.getState().caseState.flags.case_closed).toBe(true);
    expect(store.getState().caseState.objectiveStatuses[conclusion.objectiveId]).toBe('completed');
    expect(store.getState().inputLocked).toBe(true);
    store.getState().setPaused(false);
    expect(store.getState().inputLocked).toBe(true);
  });

  it('locks input from the start when restoring a closed case', () => {
    const definition = loadCaseDefinition('case-001');
    const initialState = { ...createCaseState(definition), flags: { case_closed: true } };
    const store = createGameStore({ caseDefinition: definition, initialState });
    expect(store.getState().inputLocked).toBe(true);
  });

  it('closes the notebook when the correct accusation closes the case', () => {
    const { conclusion, store } = storeReadyToAccuse();
    store.getState().toggleNotebook();
    store.getState().setNotebookTab('conclusion');
    store.getState().submitAccusation(conclusion.correctSuspectNpcId);
    expect(store.getState().notebookOpen).toBe(false);
    expect(store.getState().notebookTab).toBe('evidence');
  });

  it('does not reopen the notebook or pause once the case is closed', () => {
    const definition = loadCaseDefinition('case-001');
    const initialState = { ...createCaseState(definition), flags: { case_closed: true } };
    const store = createGameStore({ caseDefinition: definition, initialState });
    store.getState().toggleNotebook();
    expect(store.getState().notebookOpen).toBe(false);
    store.getState().setPaused(true);
    expect(store.getState().paused).toBe(false);
  });

  it('rejects further investigation writes once the case is closed', () => {
    const definition = loadCaseDefinition('case-001');
    const initialState = { ...createCaseState(definition), flags: { case_closed: true } };
    const store = createGameStore({ caseDefinition: definition, initialState });
    const before = store.getState().caseState;
    const event = definition.timeline.events[0]!;
    store.getState().placeTimelineEvent(event.id, event.slotId);
    store.getState().applyCaseEffects([{ type: 'setFlag', key: 'late_write', value: true }]);
    expect(store.getState().caseState).toBe(before);
  });

  it('reopens a collected evidence from the notebook without changing the case state', () => {
    const definition = loadCaseDefinition('case-001');
    const initialState = { ...createCaseState(definition), evidenceIds: ['leo_phone_recording'] };
    const store = createGameStore({ caseDefinition: definition, initialState });
    const before = store.getState().caseState;
    store.getState().toggleNotebook();
    store.getState().reviewEvidence('leo_phone_recording');
    expect(store.getState().notebookOpen).toBe(false);
    expect(store.getState().activeEvidenceId).toBe('leo_phone_recording');
    expect(store.getState().inputLocked).toBe(true);
    expect(store.getState().caseState).toBe(before);
    store.getState().closeEvidence();
    expect(store.getState().inputLocked).toBe(false);
  });

  it('does not review evidence that was not collected or after the case is closed', () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });
    store.getState().toggleNotebook();
    store.getState().reviewEvidence('leo_phone_recording');
    expect(store.getState().activeEvidenceId).toBeNull();
    expect(store.getState().notebookOpen).toBe(true);

    const closed = createGameStore({
      caseDefinition: definition,
      initialState: {
        ...createCaseState(definition),
        evidenceIds: ['leo_phone_recording'],
        flags: { case_closed: true },
      },
    });
    closed.getState().reviewEvidence('leo_phone_recording');
    expect(closed.getState().activeEvidenceId).toBeNull();
  });
});

function applyAudioEvidence(definition: ReturnType<typeof loadCaseDefinition>) {
  return createGameStore({ caseDefinition: definition })
    .getState()
    .applyCaseEffects([{ type: 'addEvidence', evidenceId: 'leo_phone_recording' }]).state;
}

describe('minimap state', () => {
  it('stores the published player position and resets it on scene change', () => {
    const caseDefinition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition });
    expect(store.getState().playerPosition).toBeNull();
    store.getState().setPlayerPosition({ x: 10, y: 20 });
    expect(store.getState().playerPosition).toEqual({ x: 10, y: 20 });
    const other = caseDefinition.scenes.find(({ id }) => id !== store.getState().activeSceneId)!;
    store.getState().transitionScene(other.id, Object.keys(other.spawnPoints)[0]!);
    expect(store.getState().playerPosition).toBeNull();
  });

  it('is visible by default and toggles unless input is locked', () => {
    const store = createGameStore({ caseDefinition: loadCaseDefinition('case-001') });
    expect(store.getState().minimapVisible).toBe(true);
    store.getState().toggleMinimap();
    expect(store.getState().minimapVisible).toBe(false);
    store.getState().toggleMinimap();
    expect(store.getState().minimapVisible).toBe(true);
    store.getState().togglePause();
    store.getState().toggleMinimap();
    expect(store.getState().minimapVisible).toBe(true);
  });
});
