import { z } from 'zod';
import type { UiStrings } from '@lexicon/shared-types';
import { ContentValidationError } from '../loader/ContentValidationError';

const uiStringsSchema = z
  .object({
    objectiveHeading: z.string().min(1),
    caseFile: z.string().min(1),
    interact: z.string().min(1),
    pause: z.string().min(1),
    paused: z.string().min(1),
    resume: z.string().min(1),
    loadingGame: z.string().min(1),
    saveUnavailable: z.string().min(1),
    saveWriteFailed: z.string().min(1),
    saveRecoveryTitle: z.string().min(1),
    saveRecoveryBody: z.string().min(1),
    createFreshSave: z.string().min(1),
    cancel: z.string().min(1),
    notebook: z.string().min(1),
    evidence: z.string().min(1),
    people: z.string().min(1),
    vocabulary: z.string().min(1),
    close: z.string().min(1),
    notebookEmptyPeople: z.string().min(1),
    notebookEmptyVocabulary: z.string().min(1),
    evidenceEmpty: z.string().min(1),
    openNotebook: z.string().min(1),
  })
  .strict();

function formatIssue(issue: z.ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
  return `${path}: ${issue.message}`;
}

export function parseUiStrings(raw: unknown, source: string): UiStrings {
  const result = uiStringsSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map(formatIssue);
    throw new ContentValidationError(source, issues);
  }
  return result.data;
}
