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
const factsRaw = { facts: [fact] };

type RawInput = {
  caseRaw: unknown;
  objectivesRaw: unknown;
  evidencesRaw: unknown;
  factsRaw: unknown;
  sceneRaws: readonly unknown[];
};

function sceneWithEffects(effects: readonly unknown[]): unknown {
  const scene = structuredClone(mainOffice) as {
    assets: Array<{ id: string; interaction?: Record<string, unknown> }>;
    [key: string]: unknown;
  };
  return {
    ...scene,
    assets: scene.assets.map((asset) =>
      asset.id === 'objective_note'
        ? { ...asset, interaction: { ...asset.interaction, effects } }
        : asset,
    ),
  };
}

function makeInput(changes: Partial<RawInput> = {}): RawInput {
  return {
    caseRaw,
    objectivesRaw,
    evidencesRaw,
    factsRaw,
    sceneRaws: [
      sceneWithEffects([{ type: 'completeObjective', objectiveId: 'find_what_happened' }]),
    ],
    ...changes,
  };
}

function parse(changes: Partial<RawInput> = {}) {
  return parseCaseDefinition(makeInput(changes), 'cases/case-001');
}

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
  it('assembles the minimal case definition and scene', () => {
    const definition = parse();
    expect(definition).toMatchObject({
      id: 'case-001',
      title: 'The Missing Report',
      evidenceTotal: 5,
      initialObjectiveId: 'find_what_happened',
      scenes: [{ id: 'main_office' }],
      evidences: [{ id: 'meeting_minutes' }],
      facts: [{ id: 'meeting_started' }],
      objectives: [{ id: 'find_what_happened' }],
    });
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
});
