import { describe, expect, it } from 'vitest';
import mainOffice from '../../cases/case-001/scenes/main_office.json';
import { ContentValidationError } from '../loader/ContentValidationError';
import { parseCaseDefinition } from './caseDefinition';

const caseRaw = {
  id: 'case-001',
  title: 'The Missing Report',
  evidenceTotal: 5,
  initialObjectiveId: 'find_what_happened',
  sceneIds: ['main_office'],
  sharedTextures: [
    { key: 'tex_hero_ne', url: '/assets/characters/hero/ne.png' },
    { key: 'tex_hero_se', url: '/assets/characters/hero/se.png' },
    { key: 'tex_hero_sw', url: '/assets/characters/hero/sw.png' },
    { key: 'tex_hero_nw', url: '/assets/characters/hero/nw.png' },
    {
      key: 'sheet_hero_walk',
      url: '/assets/characters/hero/walk.png',
      frameWidth: 160,
      frameHeight: 160,
    },
  ],
  characterSheets: {
    player: {
      idle: { NE: 'tex_hero_ne', SE: 'tex_hero_se', SW: 'tex_hero_sw', NW: 'tex_hero_nw' },
      walk: 'sheet_hero_walk',
    },
  },
  timeline: {
    slots: [{ id: '20_00', time: '20:00' }],
    events: [
      {
        id: 'meeting_started',
        text: 'The meeting began.',
        slotId: '20_00',
        location: 'Meeting room',
        personIds: [],
        source: 'Meeting Minutes',
        confidence: 'Recorded in the minutes',
        availability: { type: 'requiresFacts', factIds: ['meeting_started'] },
      },
    ],
  },
};

const objectivesRaw = {
  objectives: [{ id: 'find_what_happened', text: 'Tìm hiểu điều gì đã xảy ra với bản báo cáo' }],
};

const evidence = {
  id: 'meeting_minutes',
  caseId: 'case-001',
  name: 'Meeting Minutes',
  category: 'document',
  description: 'The meeting began at 8:00 PM.',
  relatedFactIds: ['meeting_started'],
};

const evidencesRaw = { evidences: [evidence] };
const fact = {
  id: 'meeting_started',
  text: 'The meeting started at 8:00 PM.',
  sourceEvidenceIds: ['meeting_minutes'],
  unlockCondition: { type: 'hasEvidence', evidenceId: 'meeting_minutes' },
};
const secondFact = {
  id: 'late_entry',
  text: 'A person entered the meeting room later.',
  sourceEvidenceIds: ['meeting_minutes'],
  unlockCondition: { type: 'hasEvidence', evidenceId: 'meeting_minutes' },
};
const factsRaw = { facts: [fact, secondFact] };
const contradiction = {
  id: 'meeting_statement_vs_log',
  factIds: ['meeting_started', 'late_entry'],
  explanation: 'The statement conflicts with the access log.',
  objectiveId: 'find_what_happened',
};

type RawInput = {
  caseRaw: unknown;
  objectivesRaw: unknown;
  evidencesRaw: unknown;
  factsRaw: unknown;
  contradictionsRaw?: unknown;
  listeningTasksRaw?: unknown;
  sceneRaws: readonly unknown[];
  npcsRaw: unknown;
  dialoguesRaw: unknown;
  vocabularyRaw: unknown;
};

function sceneWithEffects(effects: readonly unknown[]): unknown {
  const scene = structuredClone(mainOffice) as {
    assets: Array<{ id: string; interaction?: Record<string, unknown> }>;
    [key: string]: unknown;
  };
  return {
    ...scene,
    assets: scene.assets
      .filter(
        (asset) =>
          asset.id !== 'anna' &&
          asset.id !== 'leo' &&
          asset.id !== 'david' &&
          asset.id !== 'phone_recording',
      )
      .map((asset) =>
        asset.id === 'objective_note'
          ? { ...asset, interaction: { ...asset.interaction, effects } }
          : asset.id === 'hallway_door'
            ? {
                ...asset,
                interaction: { ...asset.interaction, transition: undefined },
              }
            : asset,
      ),
  };
}

function makeInput(changes: Partial<RawInput> = {}): RawInput {
  return {
    caseRaw,
    npcsRaw: { npcs: [] },
    dialoguesRaw: { dialogues: [] },
    vocabularyRaw: { vocabulary: [] },
    objectivesRaw,
    evidencesRaw,
    factsRaw,
    contradictionsRaw: { contradictions: [] },
    listeningTasksRaw: { tasks: [] },
    sceneRaws: [
      sceneWithEffects([{ type: 'completeObjective', objectiveId: 'find_what_happened' }]),
    ],
    ...changes,
  };
}

function parse(changes: Partial<RawInput> = {}) {
  return parseCaseDefinition(
    makeInput(changes) as Parameters<typeof parseCaseDefinition>[0],
    'cases/case-001',
  );
}

const listeningTask = {
  id: 'meeting_location',
  evidenceId: 'meeting_minutes',
  audioAsset: '/audio/case-001/recording.mp3',
  timestamp: '20:29',
  transcript: 'Leo is outside.',
  question: 'Where was Leo?',
  options: [
    { id: 'inside', text: 'Inside the room' },
    { id: 'outside', text: 'Outside the room' },
  ],
  correctOptionId: 'outside',
  keywordHints: ['outside'],
  completionFlag: 'recording_understood',
  correctEffects: [],
};

const listeningTasksRaw = { tasks: [listeningTask] };

function expectValidationIssue(changes: Partial<RawInput>, expected: string): void {
  try {
    parse(changes);
    throw new Error('expected parseCaseDefinition to throw');
  } catch (error) {
    expect(error).toBeInstanceOf(ContentValidationError);
    expect((error as ContentValidationError).issues.join('\n')).toContain(expected);
  }
}

describe('parseCaseDefinition', () => {
  it('rejects a declared asset ID that collides with a wall module during case loading', () => {
    const scene = sceneWithEffects([]) as { assets: unknown[] };
    scene.assets.push({
      id: 'wall_back:0',
      type: 'prop',
      texture: 'ph_prop',
      position: { u: 0.5, v: 0.125 },
      footprint: { u: 0, v: 0, width: 0.1, height: 0.1 },
    });
    expectValidationIssue({ sceneRaws: [scene] }, 'duplicate asset id "wall_back:0"');
  });
  it('rejects blocked spawn geometry during case loading', () => {
    const scene = sceneWithEffects([]) as {
      spawnPoints: Record<string, unknown>;
      assets: Array<{ id: string; position?: unknown }>;
    };
    scene.spawnPoints.default = scene.assets.find((a) => a.id === 'player_desk')!.position;
    expectValidationIssue({ sceneRaws: [scene] }, 'spawn "default"');
  });
  it('assembles the minimal case definition and scene', () => {
    const definition = parse();
    expect(definition).toMatchObject({
      id: 'case-001',
      title: 'The Missing Report',
      evidenceTotal: 5,
      initialObjectiveId: 'find_what_happened',
      scenes: [{ id: 'main_office' }],
      evidences: [{ id: 'meeting_minutes' }],
      facts: [{ id: 'meeting_started' }, { id: 'late_entry' }],
      objectives: [{ id: 'find_what_happened' }],
    });
  });

  it('assembles timeline and contradiction definitions with valid cross-references', () => {
    const definition = parse({ contradictionsRaw: { contradictions: [contradiction] } });

    expect(definition.timeline).toEqual(caseRaw.timeline);
    expect(definition.contradictions).toEqual([contradiction]);
  });

  it('rejects timeline events that reference an undeclared slot or fact', () => {
    expectValidationIssue(
      {
        caseRaw: {
          ...caseRaw,
          timeline: {
            ...caseRaw.timeline,
            events: [{ ...caseRaw.timeline.events[0], slotId: '21_05' }],
          },
        },
      },
      'unknown timeline slot id "21_05"',
    );
    expectValidationIssue(
      {
        caseRaw: {
          ...caseRaw,
          timeline: {
            ...caseRaw.timeline,
            events: [
              {
                ...caseRaw.timeline.events[0],
                availability: { type: 'requiresFacts', factIds: ['hidden_fact'] },
              },
            ],
          },
        },
      },
      'unknown fact id "hidden_fact"',
    );
  });

  it('rejects timeline events that reference an unknown person', () => {
    expectValidationIssue(
      {
        caseRaw: {
          ...caseRaw,
          timeline: {
            ...caseRaw.timeline,
            events: [{ ...caseRaw.timeline.events[0], personIds: ['unknown_person'] }],
          },
        },
      },
      'unknown NPC id "unknown_person"',
    );
  });

  it('rejects duplicate timeline slot and event IDs', () => {
    expectValidationIssue(
      {
        caseRaw: {
          ...caseRaw,
          timeline: {
            slots: [caseRaw.timeline.slots[0], caseRaw.timeline.slots[0]],
            events: caseRaw.timeline.events,
          },
        },
      },
      'timeline.slots: duplicate id "20_00"',
    );
    expectValidationIssue(
      {
        caseRaw: {
          ...caseRaw,
          timeline: {
            ...caseRaw.timeline,
            events: [caseRaw.timeline.events[0], caseRaw.timeline.events[0]],
          },
        },
      },
      'timeline.events: duplicate id "meeting_started"',
    );
  });

  it('rejects duplicate contradiction IDs', () => {
    expectValidationIssue(
      { contradictionsRaw: { contradictions: [contradiction, contradiction] } },
      'contradictions: duplicate id "meeting_statement_vs_log"',
    );
  });

  it('requires a contradiction to reference two distinct known facts and a known objective', () => {
    expectValidationIssue(
      {
        contradictionsRaw: { contradictions: [{ ...contradiction, factIds: ['meeting_started'] }] },
      },
      'must reference exactly two distinct fact IDs',
    );
    expectValidationIssue(
      {
        contradictionsRaw: {
          contradictions: [{ ...contradiction, factIds: ['meeting_started', 'hidden_fact'] }],
        },
      },
      'unknown fact id "hidden_fact"',
    );
    expectValidationIssue(
      {
        contradictionsRaw: {
          contradictions: [{ ...contradiction, objectiveId: 'hidden_objective' }],
        },
      },
      'unknown objective id "hidden_objective"',
    );
  });

  it('rejects a transition that references an unregistered destination scene or spawn', () => {
    const source = sceneWithEffects([
      { type: 'completeObjective', objectiveId: 'find_what_happened' },
    ]) as {
      assets: Array<{ id: string; interaction?: Record<string, unknown> }>;
      [key: string]: unknown;
    };
    const door = source.assets.find(({ id }) => id === 'objective_note')!;
    door.interaction = {
      x: 0,
      y: 0,
      radius: 90,
      prompt: 'Open door',
      transition: { targetSceneId: 'archive', targetSpawnId: 'from_office' },
    };

    expectValidationIssue({ sceneRaws: [source] }, 'unknown target scene id "archive"');

    const archive = structuredClone(source);
    archive.id = 'archive';
    archive.assets = [];
    archive.spawnPoints = { default: { u: 8, v: 8 } };
    expectValidationIssue(
      {
        caseRaw: { ...caseRaw, sceneIds: ['main_office', 'archive'] },
        sceneRaws: [source, archive],
      },
      'unknown spawn id "from_office" in scene "archive"',
    );
  });

  it.each([-1, 1.5])('rejects evidenceTotal %s', (evidenceTotal) => {
    expectValidationIssue({ caseRaw: { ...caseRaw, evidenceTotal } }, 'evidenceTotal');
  });

  it('rejects duplicate IDs in a content collection', () => {
    expectValidationIssue(
      { objectivesRaw: { objectives: [...objectivesRaw.objectives, objectivesRaw.objectives[0]] } },
      'duplicate id',
    );
  });

  it('rejects an unknown evidence category', () => {
    expectValidationIssue(
      { evidencesRaw: { evidences: [{ ...evidence, category: 'unknown' }] } },
      'category',
    );
  });

  it('rejects an initial objective that is not defined', () => {
    expectValidationIssue(
      { caseRaw: { ...caseRaw, initialObjectiveId: 'missing' } },
      'initialObjectiveId',
    );
  });

  it('rejects a fact that references missing source evidence', () => {
    expectValidationIssue(
      { factsRaw: { facts: [{ ...fact, sourceEvidenceIds: ['missing_evidence'] }] } },
      'sourceEvidenceIds',
    );
  });

  it('checks every source evidence reference on a fact', () => {
    expectValidationIssue(
      {
        factsRaw: {
          facts: [
            {
              ...fact,
              sourceEvidenceIds: ['meeting_minutes', 'missing_evidence'],
            },
          ],
        },
      },
      'unknown evidence id "missing_evidence"',
    );
  });

  it('rejects evidence that references a missing related fact', () => {
    expectValidationIssue(
      { evidencesRaw: { evidences: [{ ...evidence, relatedFactIds: ['missing_fact'] }] } },
      'relatedFactIds',
    );
  });

  it('rejects a scene ID that has no registered scene definition', () => {
    expectValidationIssue({ sceneRaws: [] }, 'sceneIds');
  });

  it('rejects duplicate interaction IDs across scenes', () => {
    const firstScene = sceneWithEffects([
      { type: 'completeObjective', objectiveId: 'find_what_happened' },
    ]) as { id: string; assets: Array<{ id: string }> };
    const secondScene = structuredClone(mainOffice) as {
      id: string;
      assets: Array<{ id: string }>;
      [key: string]: unknown;
    };
    secondScene.id = 'annex';
    secondScene.assets = [
      structuredClone(firstScene.assets.find((asset) => asset.id === 'objective_note')!),
    ];

    expectValidationIssue(
      {
        caseRaw: { ...caseRaw, sceneIds: ['main_office', 'annex'] },
        sceneRaws: [firstScene, secondScene],
      },
      'duplicate interaction id "objective_note"',
    );
  });

  it('rejects a condition that references unknown evidence', () => {
    expectValidationIssue(
      {
        factsRaw: {
          facts: [
            { ...fact, unlockCondition: { type: 'hasEvidence', evidenceId: 'missing_evidence' } },
          ],
        },
      },
      'evidenceId',
    );
  });

  it('rejects a condition that references an unknown fact', () => {
    expectValidationIssue(
      {
        factsRaw: {
          facts: [{ ...fact, unlockCondition: { type: 'hasFact', factId: 'missing_fact' } }],
        },
      },
      'factId',
    );
  });

  it('rejects a condition that references an unknown objective', () => {
    expectValidationIssue(
      {
        factsRaw: {
          facts: [
            {
              ...fact,
              unlockCondition: { type: 'objectiveCompleted', objectiveId: 'missing_objective' },
            },
          ],
        },
      },
      'objectiveId',
    );
  });

  it('rejects an interaction effect that references unknown evidence', () => {
    const sceneRaw = sceneWithEffects([{ type: 'addEvidence', evidenceId: 'missing_evidence' }]);
    expectValidationIssue({ sceneRaws: [sceneRaw] }, 'evidenceId');
  });

  it('rejects an interaction effect that references an unknown fact', () => {
    const sceneRaw = sceneWithEffects([{ type: 'unlockFact', factId: 'missing_fact' }]);
    expectValidationIssue({ sceneRaws: [sceneRaw] }, 'factId');
  });

  it('rejects an interaction effect with an unknown variant', () => {
    const sceneRaw = sceneWithEffects([{ type: 'executeScript', script: 'anything' }]);
    expectValidationIssue({ sceneRaws: [sceneRaw] }, 'effects');
  });

  it('rejects an interaction effect that references an unknown objective', () => {
    const sceneRaw = sceneWithEffects([
      { type: 'completeObjective', objectiveId: 'missing_objective' },
    ]);
    expectValidationIssue({ sceneRaws: [sceneRaw] }, 'objectiveId');
  });

  it('rejects a missing listening task collection', () => {
    expectValidationIssue({ listeningTasksRaw: undefined }, 'listening-tasks.json');
  });

  it('rejects duplicate listening task IDs', () => {
    expectValidationIssue(
      { listeningTasksRaw: { tasks: [listeningTask, listeningTask] } },
      'listeningTasks: duplicate id "meeting_location"',
    );
  });

  it('rejects a missing or unsafe audio source with its content path', () => {
    expectValidationIssue(
      {
        evidencesRaw: { evidences: [{ ...evidence, category: 'audio' }] },
        listeningTasksRaw: {
          tasks: [
            { ...listeningTask, evidenceId: 'meeting_minutes', audioAsset: '../recording.mp3' },
          ],
        },
      },
      'audioAsset',
    );
  });

  it('rejects a task that references an unknown or non-audio evidence', () => {
    expectValidationIssue(
      { listeningTasksRaw: { tasks: [{ ...listeningTask, evidenceId: 'missing_audio' }] } },
      'unknown evidence id "missing_audio"',
    );
    expectValidationIssue({ listeningTasksRaw }, 'must use audio evidence');
  });

  it('rejects duplicate option IDs and a correct option that is missing', () => {
    expectValidationIssue(
      {
        listeningTasksRaw: {
          tasks: [
            {
              ...listeningTask,
              options: [listeningTask.options[0], { id: 'inside', text: 'Another room' }],
            },
          ],
        },
      },
      'duplicate option id "inside"',
    );
    expectValidationIssue(
      { listeningTasksRaw: { tasks: [{ ...listeningTask, correctOptionId: 'missing' }] } },
      'unknown option id "missing"',
    );
  });

  it('rejects listening effects with unknown fact or evidence references', () => {
    expectValidationIssue(
      {
        evidencesRaw: { evidences: [{ ...evidence, category: 'audio' }] },
        listeningTasksRaw: {
          tasks: [
            {
              ...listeningTask,
              correctEffects: [{ type: 'unlockFact', factId: 'missing_fact' }],
            },
          ],
        },
      },
      'unknown fact id "missing_fact"',
    );
    expectValidationIssue(
      {
        evidencesRaw: { evidences: [{ ...evidence, category: 'audio' }] },
        listeningTasksRaw: {
          tasks: [
            { ...listeningTask, correctEffects: [{ type: 'addEvidence', evidenceId: 'missing' }] },
          ],
        },
      },
      'unknown evidence id "missing"',
    );
  });
});

describe('case conclusion contract', () => {
  const npcsRaw = {
    npcs: [
      {
        id: 'anna',
        name: 'Anna Reed',
        role: 'Project Coordinator',
        dialogueTreeId: 'anna_initial',
      },
      { id: 'david', name: 'David Cole', role: 'Office Manager', dialogueTreeId: 'david_initial' },
    ],
  };
  const conclusion = {
    suspectNpcIds: ['anna', 'david'],
    correctSuspectNpcId: 'david',
    objectiveId: 'submit_your_conclusion',
  };
  const objectivesWithConclusion = {
    objectives: [
      ...objectivesRaw.objectives,
      {
        id: 'submit_your_conclusion',
        text: 'Submit your conclusion',
        initialStatus: 'locked',
        activationCondition: {
          type: 'all',
          conditions: [
            { type: 'flag', key: 'david_confession_read', value: true },
            { type: 'hasFact', factId: 'meeting_started' },
          ],
        },
      },
    ],
  };
  function withConclusion(value: unknown, objectives: unknown = objectivesWithConclusion) {
    return {
      caseRaw: { ...caseRaw, conclusion: value },
      npcsRaw,
      objectivesRaw: objectives,
    } as Partial<RawInput>;
  }

  // Acceptance of a valid conclusion is covered against real Case #001 content in
  // loadCaseDefinition.test.ts (NPCs there own real dialogue trees).
  it('keeps conclusion optional for cases that do not declare one', () => {
    expect(parse().conclusion).toBeUndefined();
  });

  it('rejects an empty suspect list', () => {
    expectValidationIssue(withConclusion({ ...conclusion, suspectNpcIds: [] }), 'suspectNpcIds');
  });

  it('rejects duplicate suspects', () => {
    expectValidationIssue(
      withConclusion({ ...conclusion, suspectNpcIds: ['anna', 'anna', 'david'] }),
      'duplicate suspect',
    );
  });

  it('rejects a correct suspect that is not in the suspect list', () => {
    expectValidationIssue(
      withConclusion({ ...conclusion, suspectNpcIds: ['anna'] }),
      'correctSuspectNpcId',
    );
  });

  it('rejects a suspect that is not a declared NPC', () => {
    expectValidationIssue(
      withConclusion({ ...conclusion, suspectNpcIds: ['anna', 'david', 'ghost'] }),
      'unknown NPC id "ghost"',
    );
  });

  it('rejects a conclusion objective that is not defined', () => {
    expectValidationIssue(
      withConclusion({ ...conclusion, objectiveId: 'missing_objective' }),
      'conclusion.objectiveId',
    );
  });

  it('rejects an activation condition that references an unknown fact', () => {
    expectValidationIssue(
      withConclusion(conclusion, {
        objectives: [
          ...objectivesRaw.objectives,
          {
            id: 'submit_your_conclusion',
            text: 'Submit your conclusion',
            initialStatus: 'locked',
            activationCondition: { type: 'hasFact', factId: 'missing_fact' },
          },
        ],
      }),
      'activationCondition',
    );
  });

  it('exposes the shared textures and the character sheets', () => {
    const definition = parse();
    expect(definition.characterSheets).toEqual(caseRaw.characterSheets);
    expect(definition.sharedTextures).toEqual(caseRaw.sharedTextures);
  });

  const player = caseRaw.characterSheets.player;
  const withPlayer = (sheet: object) => ({
    caseRaw: { ...caseRaw, characterSheets: { player: { ...player, ...sheet } } },
  });

  it('rejects an idle facing texture that is not a shared texture', () => {
    expectValidationIssue(
      withPlayer({ idle: { ...player.idle, SW: 'tex_ghost' } }),
      'case.json.characterSheets.player.idle.SW: texture "tex_ghost" is not declared in sharedTextures',
    );
  });

  it('requires a player character sheet', () => {
    expectValidationIssue(
      { caseRaw: { ...caseRaw, characterSheets: { hero: player } } },
      'characterSheets must declare "player"',
    );
  });

  it('accepts a character without a walk sheet', () => {
    const definition = parse(withPlayer({ walk: null }));
    expect(definition.characterSheets.player.walk).toBeNull();
  });

  it('rejects a walk sheet that is not declared or not a spritesheet', () => {
    expectValidationIssue(
      withPlayer({ walk: 'sheet_ghost' }),
      'case.json.characterSheets.player.walk: texture "sheet_ghost" is not declared in sharedTextures',
    );
    expectValidationIssue(
      withPlayer({ walk: 'tex_hero_se' }),
      'case.json.characterSheets.player.walk: texture "tex_hero_se" needs frameWidth and frameHeight',
    );
  });

  it('rejects a texture with only one frame dimension', () => {
    expectValidationIssue(
      {
        caseRaw: {
          ...caseRaw,
          sharedTextures: [
            ...caseRaw.sharedTextures,
            { key: 'sheet_half', url: '/assets/half.png', frameWidth: 160 },
          ],
        },
      },
      'frameWidth and frameHeight go together',
    );
  });

  it('rejects a shared texture outside /assets/', () => {
    expectValidationIssue(
      {
        caseRaw: {
          ...caseRaw,
          sharedTextures: [...caseRaw.sharedTextures, { key: 'paper', url: 'paper.png' }],
        },
      },
      'sharedTextures',
    );
  });

  it('rejects one texture key mapped to two different urls', () => {
    const [first] = (mainOffice as unknown as { textures: Array<{ key: string; url: string }> })
      .textures;
    expectValidationIssue(
      {
        caseRaw: {
          ...caseRaw,
          sharedTextures: [
            ...caseRaw.sharedTextures,
            { key: first!.key, url: '/assets/other.png' },
          ],
        },
      },
      `texture key "${first!.key}" maps to different urls`,
    );
  });
  it('accepts an evidence image under /assets/ and rejects others', () => {
    const withImage = (image: string) => ({ evidences: [{ ...evidence, image }] });
    expect(parse({ evidencesRaw: withImage('/assets/evidence/x.png') }).evidences[0]!.image).toBe(
      '/assets/evidence/x.png',
    );
    expectValidationIssue({ evidencesRaw: withImage('evidence/x.png') }, 'image');
    expectValidationIssue({ evidencesRaw: withImage('/assets/../x.png') }, 'image');
  });

  it('rejects the unused legacy imageAsset evidence field', () => {
    expectValidationIssue(
      { evidencesRaw: { evidences: [{ ...evidence, imageAsset: '/assets/evidence/x.png' }] } },
      'imageAsset',
    );
  });
});
