import { describe, expect, it } from 'vitest';
import type {
  CaseDefinition,
  DialogueSession,
  DialogueTransitionResult,
  Effect,
  GameState,
} from '@lexicon/shared-types';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createCaseState } from '../case/createCaseState';
import { reconcileDialogueProgress } from './reconcileDialogueProgress';
import { startDialogue, getAvailableChoices, chooseDialogueChoice } from './dialogueRunner';

function fixture(): CaseDefinition {
  return {
    id: 'fixture',
    title: 'Fixture',
    evidenceTotal: 0,
    initialObjectiveId: 'old',
    scenes: [],
    evidences: [],
    objectives: [
      { id: 'old', text: 'Old' },
      {
        id: 'interview',
        text: 'Talk',
        initialStatus: 'active',
        completionCondition: {
          type: 'all',
          conditions: ['a', 'b', 'c'].map((key) => ({
            type: 'flag',
            key: key + '_done',
            value: true,
          })),
        },
      },
    ],
    facts: [
      {
        id: 'truth',
        text: 'Truth',
        sourceEvidenceIds: [],
        sourceDialogueIds: ['c_tree'],
        unlockCondition: { type: 'flag', key: 'confessed', value: true },
      },
    ],
    npcs: ['a', 'b', 'c'].map((id) => ({
      id,
      name: id,
      role: 'Witness',
      dialogueTreeId: id + '_tree',
    })),
    dialogues: ['a', 'b', 'c'].map((id) => ({
      id: id + '_tree',
      npcId: id,
      entryNodeId: 'entry',
      completionFlag: id + '_done',
      completionCondition: {
        type: 'all',
        conditions: [1, 2, 3].map((i) => ({ type: 'flag', key: id + '_q' + i, value: true })),
      },
      nodes: [
        {
          id: 'entry',
          speakerId: id,
          text: 'Initial',
          terminal: false,
          choices: [
            ...[1, 2, 3].map((i) => ({
              id: 'q' + i,
              text: 'Question ' + i,
              nextNodeId: 'answer' + i,
            })),
            {
              id: 'challenge',
              text: 'Challenge',
              nextNodeId: 'folder',
              condition: { type: 'flag' as const, key: 'gate', value: true },
            },
            {
              id: 'certain',
              text: 'Certain?',
              nextNodeId: 'certain',
              condition: { type: 'flag' as const, key: 'gate', value: false },
            },
          ],
        },
        ...[1, 2, 3].map((i) => ({
          id: 'answer' + i,
          speakerId: id,
          text: 'Answer ' + i,
          terminal: false,
          choices: [
            {
              id: 'continue',
              text: 'Continue',
              nextNodeId: 'entry',
              effects: [{ type: 'setFlag' as const, key: id + '_q' + i, value: true }],
            },
          ],
        })),
        {
          id: 'certain',
          speakerId: id,
          text: "Yes. I'm certain.",
          terminal: false,
          choices: [{ id: 'continue', text: 'Continue', nextNodeId: 'entry' }],
        },
        {
          id: 'folder',
          speakerId: id,
          text: 'Folder',
          condition: { type: 'flag', key: 'gate', value: true },
          terminal: false,
          choices: [{ id: 'which', text: 'Which folder?', nextNodeId: 'confession' }],
        },
        {
          id: 'confession',
          speakerId: id,
          text: 'Confession',
          condition: { type: 'flag', key: 'gate', value: true },
          effects: [{ type: 'setFlag', key: 'confessed', value: true }],
          terminal: true,
          choices: [],
        },
      ],
    })),
  };
}
function success(result: DialogueTransitionResult) {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.detail);
  return result;
}
function choose(d: CaseDefinition, s: GameState, session: DialogueSession, id: string) {
  return chooseDialogueChoice(d, s, session, {
    nodeId: session.nodeId,
    revision: session.revision,
    choiceId: id,
  });
}
describe('pure dialogue runner', () => {
  it('starts a generic tree and keeps getAvailableChoices pure', () => {
    const d = fixture(),
      s = createCaseState(d),
      r = success(startDialogue(d, s, 'a'));
    expect(r.state).toBe(s);
    expect(r.session.nodeId).toBe('entry');
    const choices = getAvailableChoices(d, s, r.session);
    expect(choices.map((c) => c.id)).toContain('certain');
    expect(choices.map((c) => c.id)).not.toContain('challenge');
    expect(s.flags).toEqual({});
    expect(startDialogue(d, s, 'missing')).toMatchObject({
      ok: false,
      state: s,
      error: { code: 'unknownNpc' },
    });
  });
  it('rejects stale actions, unknown choices and locked target nodes without effects', () => {
    const d = fixture(),
      s = createCaseState(d),
      r = success(startDialogue(d, s, 'a'));
    expect(choose(d, s, r.session, 'bad')).toMatchObject({
      ok: false,
      state: s,
      error: { code: 'unknownChoice' },
    });
    expect(choose(d, s, r.session, 'challenge')).toMatchObject({
      ok: false,
      state: s,
      error: { code: 'conditionNotMet' },
    });
    const advanced = success(choose(d, s, r.session, 'q1'));
    expect(
      chooseDialogueChoice(d, advanced.state, advanced.session, { ...r.session, choiceId: 'q1' }),
    ).toMatchObject({ ok: false, state: s, error: { code: 'staleAction' } });
  });
  it('marks a branch only after continue and reading again is idempotent', () => {
    const d = fixture(),
      s = createCaseState(d),
      r = success(startDialogue(d, s, 'a'));
    const answer = success(choose(d, s, r.session, 'q1'));
    expect(answer.state.flags).toEqual({});
    const continued = success(choose(d, answer.state, answer.session, 'continue'));
    expect(continued.state.flags.a_q1).toBe(true);
    const reread = success(choose(d, continued.state, continued.session, 'q1'));
    const again = success(choose(d, reread.state, reread.session, 'continue'));
    expect(again.state).toBe(continued.state);
    expect(again.events).toEqual([]);
    expect(success(startDialogue(d, continued.state, 'a')).session.nodeId).toBe('entry');
  });
  it('completes interviews and objective only after all three branches of all three people', () => {
    const d = fixture();
    let s = createCaseState(d);
    expect(s.objectiveStatuses.interview).toBe('active');
    for (const npc of ['a', 'b', 'c']) {
      let r = success(startDialogue(d, s, npc));
      for (const i of [1, 2, 3]) {
        r = success(choose(d, r.state, r.session, 'q' + i));
        r = success(choose(d, r.state, r.session, 'continue'));
      }
      s = r.state;
      expect(s.flags[npc + '_done']).toBe(true);
      if (npc !== 'c') expect(s.objectiveStatuses.interview).toBe('active');
    }
    expect(s.objectiveStatuses.interview).toBe('completed');
  });
  it('unlocks confession only after the follow-up question, not on gate or open', () => {
    const d = fixture(),
      s = { ...createCaseState(d), flags: { gate: true } },
      r = success(startDialogue(d, s, 'c'));
    expect(r.state.discoveredFactIds).toEqual([]);
    const challenged = success(choose(d, r.state, r.session, 'challenge'));
    expect(challenged.state.discoveredFactIds).toEqual([]);
    const confession = success(choose(d, challenged.state, challenged.session, 'which'));
    expect(confession.state.discoveredFactIds).toEqual(['truth']);
  });
  it('rolls back choice and node effects as one transaction', () => {
    const d = fixture();
    const tree = d.dialogues[0]!;
    const broken = {
      ...d,
      dialogues: [
        {
          ...tree,
          nodes: tree.nodes.map((n) =>
            n.id === 'answer1'
              ? { ...n, effects: [{ type: 'addEvidence', evidenceId: 'missing' } as Effect] }
              : n.id === 'entry'
                ? {
                    ...n,
                    choices: n.choices.map((c) =>
                      c.id === 'q1'
                        ? {
                            ...c,
                            effects: [{ type: 'setFlag', key: 'partial', value: true } as Effect],
                          }
                        : c,
                    ),
                  }
                : n,
          ),
        },
        ...d.dialogues.slice(1),
      ],
    };
    const s = createCaseState(broken),
      r = success(startDialogue(broken, s, 'a'));
    const fail = choose(broken, s, r.session, 'q1');
    expect(fail).toMatchObject({ ok: false, error: { code: 'effectFailed' } });
    expect(fail.state).toBe(s);
    expect(fail.session).toBe(r.session);
    expect(s.flags.partial).toBeUndefined();
  });
});

describe('objective activation on Case #001', () => {
  const caseDefinition = loadCaseDefinition('case-001');
  const objectiveId = caseDefinition.conclusion!.objectiveId;
  function reconcileWith(flags: Record<string, boolean>, facts: string[]) {
    const base = createCaseState(caseDefinition);
    const result = reconcileDialogueProgress(caseDefinition, {
      ...base,
      flags,
      discoveredFactIds: facts,
    });
    if (!result.ok) throw new Error(result.error.code);
    return result;
  }

  it('keeps the conclusion objective locked at the start of the case', () => {
    expect(createCaseState(caseDefinition).objectiveStatuses[objectiveId]).toBe('locked');
  });

  it('stays locked after the contradiction is found but before the confession is read', () => {
    const r = reconcileWith({ david_contradiction_found: true }, [
      'david_statement_no_entry_after_20_00',
      'david_entry_20_32',
    ]);
    expect(r.state.objectiveStatuses[objectiveId]).toBe('locked');
  });

  it('stays locked with the fact but without the confession flag', () => {
    const r = reconcileWith({}, ['david_took_report']);
    expect(r.state.objectiveStatuses[objectiveId]).toBe('locked');
  });

  it('activates once both the confession flag and the fact are present, idempotently', () => {
    const r = reconcileWith({ david_confession_read: true }, ['david_took_report']);
    expect(r.state.objectiveStatuses[objectiveId]).toBe('active');
    expect(r.events).toContainEqual({ type: 'objectiveActivated', objectiveId });
    const again = reconcileDialogueProgress(caseDefinition, r.state);
    expect(again.ok && again.events).toEqual([]);
  });
});
