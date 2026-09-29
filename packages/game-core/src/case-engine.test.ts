import { describe, expect, it } from 'vitest';
import type { CaseDefinition, GameState } from '@lexicon/shared-types';
import { createCaseState } from './case/createCaseState';
import { evaluateCondition } from './condition/evaluateCondition';
import { applyEffects } from './effect/applyEffects';
import { activateObjective, completeObjective } from './objective/transitionObjective';

const definition: CaseDefinition = {
  id: 'case-001',
  title: 'The Missing Report',
  evidenceTotal: 5,
  initialObjectiveId: 'find_what_happened',
  scenes: [],
  npcs: [],
  dialogues: [],
  evidences: [
    {
      id: 'meeting_minutes',
      caseId: 'case-001',
      name: 'Meeting Minutes',
      category: 'document',
      description: 'The meeting began at 8:00 PM.',
      relatedFactIds: ['meeting_started'],
    },
  ],
  facts: [
    {
      id: 'meeting_started',
      text: 'The meeting began at 8:00 PM.',
      sourceEvidenceIds: ['meeting_minutes'],
      unlockCondition: { type: 'hasEvidence', evidenceId: 'meeting_minutes' },
    },
  ],
  objectives: [
    { id: 'find_what_happened', text: 'Find out what happened to the report.' },
    { id: 'speak_to_anna', text: 'Speak to Anna.' },
  ],
  vocabulary: [],
  vocabularyContexts: [],
  listeningTasks: [],
  timeline: { slots: [], events: [] },
  contradictions: [],
};

const initialState: GameState = {
  caseId: 'case-001',
  caseTitle: 'The Missing Report',
  evidenceTotal: 5,
  objectiveStatuses: {
    find_what_happened: 'active',
    speak_to_anna: 'locked',
  },
  evidenceIds: [],
  discoveredFactIds: [],
  timelineEventIds: [],
  contradictionIds: [],
  flags: {},
};

describe('createCaseState', () => {
  it('activates the initial objective and initializes empty progress', () => {
    expect(createCaseState(definition)).toEqual(initialState);
  });
});

describe('evaluateCondition', () => {
  it('evaluates evidence, fact, objective, flag, nested all/any, and empty groups', () => {
    const state: GameState = {
      ...initialState,
      evidenceIds: ['meeting_minutes'],
      discoveredFactIds: ['meeting_started'],
      flags: { note_read: true },
      objectiveStatuses: { find_what_happened: 'completed', speak_to_anna: 'active' },
    };

    expect(evaluateCondition(state, { type: 'hasEvidence', evidenceId: 'meeting_minutes' })).toBe(
      true,
    );
    expect(evaluateCondition(state, { type: 'hasFact', factId: 'meeting_started' })).toBe(true);
    expect(
      evaluateCondition(state, {
        type: 'objectiveCompleted',
        objectiveId: 'find_what_happened',
      }),
    ).toBe(true);
    expect(evaluateCondition(state, { type: 'flag', key: 'note_read', value: true })).toBe(true);
    expect(
      evaluateCondition(state, {
        type: 'all',
        conditions: [
          { type: 'hasEvidence', evidenceId: 'meeting_minutes' },
          {
            type: 'any',
            conditions: [
              { type: 'flag', key: 'note_read', value: false },
              { type: 'hasFact', factId: 'meeting_started' },
            ],
          },
        ],
      }),
    ).toBe(true);
    expect(evaluateCondition(state, { type: 'all', conditions: [] })).toBe(true);
    expect(evaluateCondition(state, { type: 'any', conditions: [] })).toBe(false);
  });

  it('returns false when a condition is not satisfied', () => {
    expect(
      evaluateCondition(initialState, { type: 'hasEvidence', evidenceId: 'meeting_minutes' }),
    ).toBe(false);
    expect(evaluateCondition(initialState, { type: 'flag', key: 'note_read', value: true })).toBe(
      false,
    );
  });
});

describe('applyEffects', () => {
  it('does not reveal a fact before its unlock condition is met', () => {
    const result = applyEffects(definition, initialState, [
      { type: 'unlockFact', factId: 'meeting_started' },
    ]);

    expect(result).toEqual({ ok: true, state: initialState, events: [] });
  });

  it('waits for all evidence in a compound fact unlock condition', () => {
    const multiEvidenceDefinition: CaseDefinition = {
      ...definition,
      evidences: [
        ...definition.evidences,
        {
          id: 'attendance_sheet',
          caseId: definition.id,
          name: 'Attendance Sheet',
          category: 'document',
          description: 'A list of attendees.',
          relatedFactIds: ['meeting_started'],
        },
      ],
      facts: [
        {
          ...definition.facts[0]!,
          sourceEvidenceIds: ['meeting_minutes', 'attendance_sheet'],
          unlockCondition: {
            type: 'all',
            conditions: [
              { type: 'hasEvidence', evidenceId: 'meeting_minutes' },
              { type: 'hasEvidence', evidenceId: 'attendance_sheet' },
            ],
          },
        },
      ],
    };

    const noEvidence = applyEffects(multiEvidenceDefinition, initialState, [
      { type: 'unlockFact', factId: 'meeting_started' },
    ]);
    expect(noEvidence).toEqual({ ok: true, state: initialState, events: [] });
    if (!noEvidence.ok) return;

    const oneEvidence = applyEffects(multiEvidenceDefinition, noEvidence.state, [
      { type: 'addEvidence', evidenceId: 'meeting_minutes' },
    ]);
    expect(oneEvidence.ok && oneEvidence.state.discoveredFactIds).toEqual([]);
    if (!oneEvidence.ok) return;

    const bothEvidence = applyEffects(multiEvidenceDefinition, oneEvidence.state, [
      { type: 'addEvidence', evidenceId: 'attendance_sheet' },
    ]);
    expect(bothEvidence.ok && bothEvidence.state.discoveredFactIds).toEqual(['meeting_started']);
    expect(bothEvidence.ok && bothEvidence.events).toContainEqual({
      type: 'factUnlocked',
      factId: 'meeting_started',
    });
  });

  it('applies ordered effects and unlocks facts whose conditions become true', () => {
    const result = applyEffects(definition, initialState, [
      { type: 'addEvidence', evidenceId: 'meeting_minutes' },
      { type: 'setFlag', key: 'note_read', value: true },
      { type: 'completeObjective', objectiveId: 'find_what_happened' },
      { type: 'activateObjective', objectiveId: 'speak_to_anna' },
    ]);

    expect(result).toEqual({
      ok: true,
      state: {
        ...initialState,
        objectiveStatuses: {
          find_what_happened: 'completed',
          speak_to_anna: 'active',
        },
        evidenceIds: ['meeting_minutes'],
        discoveredFactIds: ['meeting_started'],
        flags: { note_read: true },
      },
      events: [
        { type: 'evidenceAdded', evidenceId: 'meeting_minutes' },
        { type: 'flagChanged', key: 'note_read', value: true },
        { type: 'objectiveCompleted', objectiveId: 'find_what_happened' },
        { type: 'objectiveActivated', objectiveId: 'speak_to_anna' },
        { type: 'factUnlocked', factId: 'meeting_started' },
      ],
    });
  });

  it('unlocks a requested fact and does not duplicate state or events', () => {
    const first = applyEffects(definition, initialState, [
      { type: 'addEvidence', evidenceId: 'meeting_minutes' },
      { type: 'unlockFact', factId: 'meeting_started' },
      { type: 'setFlag', key: 'note_read', value: true },
    ]);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const repeated = applyEffects(definition, first.state, [
      { type: 'unlockFact', factId: 'meeting_started' },
      { type: 'setFlag', key: 'note_read', value: true },
      { type: 'addEvidence', evidenceId: 'meeting_minutes' },
    ]);
    expect(repeated).toEqual({ ok: true, state: first.state, events: [] });
  });

  it('returns the original state without partial changes when an effect ID is invalid', () => {
    const result = applyEffects(definition, initialState, [
      { type: 'addEvidence', evidenceId: 'meeting_minutes' },
      { type: 'activateObjective', objectiveId: 'missing_objective' },
    ]);

    expect(result).toEqual({
      ok: false,
      state: initialState,
      error: { code: 'unknownObjective', id: 'missing_objective' },
    });
  });

  it('rejects an unknown evidence or fact ID', () => {
    expect(
      applyEffects(definition, initialState, [{ type: 'addEvidence', evidenceId: 'missing' }]),
    ).toMatchObject({
      ok: false,
      error: { code: 'unknownEvidence', id: 'missing' },
    });
    expect(
      applyEffects(definition, initialState, [{ type: 'unlockFact', factId: 'missing' }]),
    ).toMatchObject({
      ok: false,
      error: { code: 'unknownFact', id: 'missing' },
    });
  });
});

describe('objective transitions', () => {
  it('requires an active objective before completion', () => {
    expect(completeObjective(definition, initialState, 'speak_to_anna')).toEqual({
      ok: false,
      state: initialState,
      error: { code: 'objectiveNotActive', id: 'speak_to_anna' },
    });
  });

  it('does not reactivate a completed objective', () => {
    const completedState: GameState = {
      ...initialState,
      objectiveStatuses: { find_what_happened: 'completed', speak_to_anna: 'active' },
    };
    expect(activateObjective(definition, completedState, 'find_what_happened')).toEqual({
      ok: false,
      state: completedState,
      error: { code: 'objectiveAlreadyCompleted', id: 'find_what_happened' },
    });
  });

  it('reports unknown objective IDs', () => {
    expect(activateObjective(definition, initialState, 'missing')).toEqual({
      ok: false,
      state: initialState,
      error: { code: 'unknownObjective', id: 'missing' },
    });
  });
});
