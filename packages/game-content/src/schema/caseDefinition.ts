import { z } from 'zod';
import type {
  CaseDefinition,
  Condition,
  Effect,
  EvidenceDefinition,
  FactDefinition,
  ObjectiveDefinition,
} from '@lexicon/shared-types';
import { ContentValidationError } from '../loader/ContentValidationError';
import { conditionSchema } from './caseEngine';
import { sceneDefinitionSchema } from './scene';

const caseRawSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    evidenceTotal: z.number().int().min(0),
    initialObjectiveId: z.string().min(1),
    sceneIds: z.array(z.string().min(1)).min(1),
  })
  .strict();

const objectiveSchema = z.object({ id: z.string().min(1), text: z.string().min(1) }).strict();

const evidenceSchema = z
  .object({
    id: z.string().min(1),
    caseId: z.string().min(1),
    name: z.string().min(1),
    category: z.enum(['document', 'audio', 'photo', 'object', 'statement', 'digital']),
    description: z.string().min(1),
    relatedFactIds: z.array(z.string().min(1)),
    relatedNpcIds: z.array(z.string().min(1)).optional(),
    vocabularyIds: z.array(z.string().min(1)).optional(),
    imageAsset: z.string().min(1).optional(),
  })
  .strict();

const factSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    sourceEvidenceIds: z.array(z.string().min(1)).min(1),
    unlockCondition: conditionSchema,
  })
  .strict();

const objectivesRawSchema = z.object({ objectives: z.array(objectiveSchema).min(1) }).strict();
const evidencesRawSchema = z.object({ evidences: z.array(evidenceSchema) }).strict();
const factsRawSchema = z.object({ facts: z.array(factSchema) }).strict();

type ParseCaseDefinitionInput = {
  caseRaw: unknown;
  objectivesRaw: unknown;
  evidencesRaw: unknown;
  factsRaw: unknown;
  sceneRaws: readonly unknown[];
};

function formatIssue(issue: z.ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
  return `${path}: ${issue.message}`;
}

function appendSchemaIssues(issues: string[], label: string, error: z.ZodError): void {
  issues.push(...error.issues.map((issue) => `${label}.${formatIssue(issue)}`));
}

function findDuplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates];
}

function visitCondition(condition: Condition, visit: (condition: Condition) => void): void {
  visit(condition);
  if (condition.type === 'all' || condition.type === 'any') {
    condition.conditions.forEach((child) => visitCondition(child, visit));
  }
}

function validateConditionReferences(
  condition: Condition,
  evidenceIds: ReadonlySet<string>,
  factIds: ReadonlySet<string>,
  objectiveIds: ReadonlySet<string>,
  path: string,
  issues: string[],
): void {
  visitCondition(condition, (item) => {
    if (item.type === 'hasEvidence' && !evidenceIds.has(item.evidenceId)) {
      issues.push(`${path}.evidenceId: unknown evidence id "${item.evidenceId}"`);
    } else if (item.type === 'hasFact' && !factIds.has(item.factId)) {
      issues.push(`${path}.factId: unknown fact id "${item.factId}"`);
    } else if (item.type === 'objectiveCompleted' && !objectiveIds.has(item.objectiveId)) {
      issues.push(`${path}.objectiveId: unknown objective id "${item.objectiveId}"`);
    }
  });
}

function validateEffectReferences(
  effect: Effect,
  evidenceIds: ReadonlySet<string>,
  factIds: ReadonlySet<string>,
  objectiveIds: ReadonlySet<string>,
  path: string,
  issues: string[],
): void {
  if (effect.type === 'addEvidence' && !evidenceIds.has(effect.evidenceId)) {
    issues.push(`${path}.evidenceId: unknown evidence id "${effect.evidenceId}"`);
  } else if (effect.type === 'unlockFact' && !factIds.has(effect.factId)) {
    issues.push(`${path}.factId: unknown fact id "${effect.factId}"`);
  } else if (
    (effect.type === 'activateObjective' || effect.type === 'completeObjective') &&
    !objectiveIds.has(effect.objectiveId)
  ) {
    issues.push(`${path}.objectiveId: unknown objective id "${effect.objectiveId}"`);
  }
}

export function parseCaseDefinition(
  input: ParseCaseDefinitionInput,
  source: string,
): CaseDefinition {
  const caseResult = caseRawSchema.safeParse(input.caseRaw);
  const objectivesResult = objectivesRawSchema.safeParse(input.objectivesRaw);
  const evidencesResult = evidencesRawSchema.safeParse(input.evidencesRaw);
  const factsResult = factsRawSchema.safeParse(input.factsRaw);
  const scenesResult = input.sceneRaws.map((scene) => sceneDefinitionSchema.safeParse(scene));

  const issues: string[] = [];
  if (!caseResult.success) appendSchemaIssues(issues, `${source}/case.json`, caseResult.error);
  if (!objectivesResult.success) {
    appendSchemaIssues(issues, `${source}/objectives.json`, objectivesResult.error);
  }
  if (!evidencesResult.success) {
    appendSchemaIssues(issues, `${source}/evidences.json`, evidencesResult.error);
  }
  if (!factsResult.success) appendSchemaIssues(issues, `${source}/facts.json`, factsResult.error);
  scenesResult.forEach((result, index) => {
    if (!result.success) {
      appendSchemaIssues(issues, `${source}/sceneRaws.${index}`, result.error);
    }
  });

  if (
    !caseResult.success ||
    !objectivesResult.success ||
    !evidencesResult.success ||
    !factsResult.success ||
    scenesResult.some((result) => !result.success)
  ) {
    throw new ContentValidationError(source, issues);
  }

  const caseData = caseResult.data;
  const objectives = objectivesResult.data.objectives as ObjectiveDefinition[];
  const evidences = evidencesResult.data.evidences as EvidenceDefinition[];
  const facts = factsResult.data.facts as FactDefinition[];
  const scenes = scenesResult.map(
    (result) => (result as { success: true; data: (typeof sceneDefinitionSchema)['_output'] }).data,
  );

  const collections: ReadonlyArray<{ label: string; ids: readonly string[] }> = [
    { label: 'sceneIds', ids: caseData.sceneIds },
    { label: 'objectives', ids: objectives.map(({ id }) => id) },
    { label: 'evidences', ids: evidences.map(({ id }) => id) },
    { label: 'facts', ids: facts.map(({ id }) => id) },
    { label: 'scenes', ids: scenes.map(({ id }) => id) },
  ];
  for (const collection of collections) {
    for (const id of findDuplicates(collection.ids)) {
      issues.push(`${collection.label}: duplicate id "${id}"`);
    }
  }

  const objectiveIds = new Set(objectives.map(({ id }) => id));
  const evidenceIds = new Set(evidences.map(({ id }) => id));
  const factIds = new Set(facts.map(({ id }) => id));
  const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));

  if (!objectiveIds.has(caseData.initialObjectiveId)) {
    issues.push(
      `case.json.initialObjectiveId: unknown objective id "${caseData.initialObjectiveId}"`,
    );
  }
  for (const id of caseData.sceneIds) {
    if (!sceneById.has(id)) issues.push(`case.json.sceneIds: no scene definition for "${id}"`);
  }
  for (const scene of scenes) {
    if (!caseData.sceneIds.includes(scene.id)) {
      issues.push(`scene ${scene.id}: not referenced by case.json.sceneIds`);
    }
  }

  evidences.forEach((evidence, index) => {
    if (evidence.caseId !== caseData.id) {
      issues.push(`evidences.${index}.caseId: expected "${caseData.id}"`);
    }
    evidence.relatedFactIds.forEach((id) => {
      if (!factIds.has(id))
        issues.push(`evidences.${index}.relatedFactIds: unknown fact id "${id}"`);
    });
  });

  facts.forEach((fact, index) => {
    fact.sourceEvidenceIds.forEach((id) => {
      if (!evidenceIds.has(id)) {
        issues.push(`facts.${index}.sourceEvidenceIds: unknown evidence id "${id}"`);
      }
    });
    validateConditionReferences(
      fact.unlockCondition,
      evidenceIds,
      factIds,
      objectiveIds,
      `facts.${index}.unlockCondition`,
      issues,
    );
  });

  scenes.forEach((scene, sceneIndex) => {
    scene.assets.forEach((asset, assetIndex) => {
      asset.interaction?.effects?.forEach((effect, effectIndex) => {
        validateEffectReferences(
          effect,
          evidenceIds,
          factIds,
          objectiveIds,
          `scenes.${sceneIndex}.assets.${assetIndex}.interaction.effects.${effectIndex}`,
          issues,
        );
      });
    });
  });

  if (issues.length > 0) throw new ContentValidationError(source, issues);

  const scenesInCaseOrder = caseData.sceneIds.map((id) => sceneById.get(id)!);
  return {
    id: caseData.id,
    title: caseData.title,
    evidenceTotal: caseData.evidenceTotal,
    initialObjectiveId: caseData.initialObjectiveId,
    scenes: scenesInCaseOrder,
    evidences,
    facts,
    objectives,
  };
}
