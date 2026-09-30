import { describe, expect, it } from 'vitest';
import { parseCaseDefinition } from './caseDefinition';
import caseRaw from '../../cases/case-001/case.json';
import objectivesRaw from '../../cases/case-001/objectives.json';
import allEvidencesRaw from '../../cases/case-001/evidences.json';
import fullFacts from '../../cases/case-001/facts.json';
import office from '../../cases/case-001/scenes/main_office.json';
import vocabularyRaw from '../../cases/case-001/vocabulary.json';

const evidencesRaw = {
  evidences: [
    {
      ...allEvidencesRaw.evidences.find((evidence) => evidence.id === 'meeting_minutes')!,
      relatedFactIds: ['meeting_started'],
    },
  ],
};
const factsRaw = { facts: [fullFacts.facts.find((fact) => fact.id === 'meeting_started')!] };
const dialogueCaseRaw = {
  id: caseRaw.id,
  title: caseRaw.title,
  evidenceTotal: caseRaw.evidenceTotal,
  initialObjectiveId: caseRaw.initialObjectiveId,
  sceneIds: ['main_office'],
  sharedTextures: caseRaw.sharedTextures,
  characterSheets: caseRaw.characterSheets,
  timeline: {
    slots: [{ id: '20_00', time: '20:00' }],
    events: [caseRaw.timeline.events.find((event) => event.id === 'meeting_started')!],
  },
};
// The conclusion objective depends on facts outside this minimal fixture.
const dialogueObjectivesRaw = {
  objectives: objectivesRaw.objectives.filter(({ id }) => id !== 'submit_your_conclusion'),
};
function input() {
  return {
    caseRaw: dialogueCaseRaw,
    objectivesRaw: dialogueObjectivesRaw,
    evidencesRaw,
    factsRaw,
    contradictionsRaw: { contradictions: [] },
    listeningTasksRaw: { tasks: [] },
    sceneRaws: [
      {
        ...office,
        assets: office.assets
          .filter((asset) => asset.id !== 'phone_recording')
          .filter((a) => a.type !== 'npc' || a.id === 'anna')
          .map((asset) => {
            const { cue: _ignoredCue, ...a } = asset;
            void _ignoredCue;
            return a.id === 'anna'
              ? {
                  ...a,
                  interaction: { ...a.interaction, npcId: 'anna' },
                }
              : a.id === 'hallway_door'
                ? { ...a, interaction: { ...a.interaction, transition: undefined } }
                : a;
          }),
      },
    ],
    npcsRaw: {
      npcs: [{ id: 'anna', name: 'Anna Reed', role: 'Coordinator', dialogueTreeId: 'test' }],
    },
    dialoguesRaw: {
      dialogues: [
        {
          id: 'test',
          npcId: 'anna',
          entryNodeId: 'entry',
          completionFlag: 'done',
          completionCondition: { type: 'flag', key: 'read', value: true },
          nodes: [
            {
              id: 'entry',
              speakerId: 'anna',
              text: 'Hello',
              terminal: false,
              choices: [
                {
                  id: 'ask',
                  text: 'When?',
                  nextNodeId: 'answer',
                  effects: [{ type: 'setFlag', key: 'read', value: true }],
                },
              ],
            },
            { id: 'answer', speakerId: 'anna', text: 'Yesterday', terminal: true, choices: [] },
          ],
        },
      ],
    },
  };
}
type Input = ReturnType<typeof input>;
function parse(value: unknown) {
  return parseCaseDefinition({ ...value, vocabularyRaw } as Input, 'cases/test');
}
function changed(change: (v: Input) => void) {
  const value = structuredClone(input());
  change(value);
  return value;
}
describe('dialogue graph validation', () => {
  it('loads NPCs and dialogue trees', () => {
    expect(parse(input())).toMatchObject({ npcs: [{ id: 'anna' }], dialogues: [{ id: 'test' }] });
  });
  it.each([
    ['duplicate NPC', (v: Input) => v.npcsRaw.npcs.push(v.npcsRaw.npcs[0]!)],
    ['duplicate tree', (v: Input) => v.dialoguesRaw.dialogues.push(v.dialoguesRaw.dialogues[0]!)],
    [
      'duplicate node',
      (v: Input) => v.dialoguesRaw.dialogues[0]!.nodes.push(v.dialoguesRaw.dialogues[0]!.nodes[0]!),
    ],
    [
      'duplicate choice',
      (v: Input) =>
        v.dialoguesRaw.dialogues[0]!.nodes[0]!.choices.push(
          v.dialoguesRaw.dialogues[0]!.nodes[0]!.choices[0]!,
        ),
    ],
    [
      'missing owner',
      (v: Input) => {
        v.dialoguesRaw.dialogues[0]!.npcId = 'missing';
      },
    ],
    [
      'missing speaker',
      (v: Input) => {
        v.dialoguesRaw.dialogues[0]!.nodes[0]!.speakerId = 'missing';
      },
    ],
    [
      'missing entry',
      (v: Input) => {
        v.dialoguesRaw.dialogues[0]!.entryNodeId = 'missing';
      },
    ],
    [
      'missing target',
      (v: Input) => {
        v.dialoguesRaw.dialogues[0]!.nodes[0]!.choices[0]!.nextNodeId = 'missing';
      },
    ],
    [
      'nonterminal dead end',
      (v: Input) => {
        v.dialoguesRaw.dialogues[0]!.nodes[0]!.choices = [];
      },
    ],
    [
      'terminal choices',
      (v: Input) => {
        v.dialoguesRaw.dialogues[0]!.nodes[0]!.terminal = true;
      },
    ],
    [
      'missing NPC scene ref',
      (v: Input) => {
        v.sceneRaws[0]!.assets = v.sceneRaws[0]!.assets.map((a) =>
          a.id === 'anna' ? { ...a, interaction: { ...a.interaction, npcId: 'missing' } } : a,
        );
      },
    ],
  ])('rejects %s with source context', (_, change) => {
    expect(() => parse(changed(change))).toThrow(/cases\/test/);
  });
  it('rejects entry conditions and ungrounded facts', () => {
    const value = input();
    expect(() =>
      parse({
        ...value,
        dialoguesRaw: {
          dialogues: [
            {
              ...value.dialoguesRaw.dialogues[0],
              nodes: value.dialoguesRaw.dialogues[0]!.nodes.map((n) => ({
                ...n,
                condition: { type: 'flag', key: 'x', value: true },
              })),
            },
          ],
        },
      }),
    ).toThrow();
    expect(() =>
      parse({ ...value, factsRaw: { facts: [{ ...factsRaw.facts[0], sourceEvidenceIds: [] }] } }),
    ).toThrow();
  });
  it('accepts dialogue sourced facts and rejects unknown sources', () => {
    const value = input();
    expect(
      parse({
        ...value,
        factsRaw: {
          facts: [{ ...factsRaw.facts[0], sourceEvidenceIds: [], sourceDialogueIds: ['test'] }],
        },
      }).facts,
    ).toHaveLength(1);
    expect(() =>
      parse({
        ...value,
        factsRaw: { facts: [{ ...factsRaw.facts[0], sourceDialogueIds: ['bad'] }] },
      }),
    ).toThrow();
  });
});
