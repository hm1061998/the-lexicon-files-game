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
