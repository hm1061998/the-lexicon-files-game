import { z } from 'zod';
import type { CaseSummary } from '@lexicon/shared-types';
import { ContentValidationError } from '../loader/ContentValidationError';

const caseRawSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    evidenceTotal: z.number().int().min(0),
    initialObjectiveId: z.string().min(1),
    sceneIds: z.array(z.string().min(1)).optional(),
  })
  .strict();

const objectiveSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
  })
  .strict();

const objectivesRawSchema = z
  .object({
    objectives: z.array(objectiveSchema),
  })
  .strict();

function formatIssue(issue: z.ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
  return `${path}: ${issue.message}`;
}

export function parseCaseSummary(
  caseRaw: unknown,
  objectivesRaw: unknown,
  source: string,
): CaseSummary {
  const caseResult = caseRawSchema.safeParse(caseRaw);
  const objectivesResult = objectivesRawSchema.safeParse(objectivesRaw);

  const issues: string[] = [];
  if (!caseResult.success) {
    issues.push(...caseResult.error.issues.map(formatIssue));
  }
  if (!objectivesResult.success) {
    issues.push(...objectivesResult.error.issues.map(formatIssue));
  }
  if (!caseResult.success || !objectivesResult.success) {
    throw new ContentValidationError(source, issues);
  }

  const caseData = caseResult.data;
  const objectives = objectivesResult.data.objectives;
  const initialObjective = objectives.find(
    (objective) => objective.id === caseData.initialObjectiveId,
  );
  if (!initialObjective) {
    throw new ContentValidationError(source, [
      `initialObjectiveId: no objective with id "${caseData.initialObjectiveId}"`,
    ]);
  }

  return {
    id: caseData.id,
    title: caseData.title,
    evidenceTotal: caseData.evidenceTotal,
    initialObjective: {
      id: initialObjective.id,
      text: initialObjective.text,
    },
  };
}
