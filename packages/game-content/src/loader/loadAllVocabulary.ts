import type { CaseDefinition } from '@lexicon/shared-types';
import { ContentValidationError } from './ContentValidationError';
import { loadCaseDefinition, REGISTERED_CASE_IDS } from './loadCaseDefinition';

type VocabularyEntry = CaseDefinition['vocabulary'][number];
type VocabularyContext = CaseDefinition['vocabularyContexts'][number];

/**
 * Union of the vocabulary and context catalogues of every registered case.
 * Learning progress is global across cases, so a learning record must be
 * validated against this union, never against the active case alone.
 */
export function loadAllVocabulary(
  caseIds: readonly string[] = REGISTERED_CASE_IDS,
  loadCase: (caseId: string) => CaseDefinition = loadCaseDefinition,
): { catalogue: VocabularyEntry[]; contexts: VocabularyContext[] } {
  const entries = new Map<string, { entry: VocabularyEntry; caseId: string }>();
  const contexts = new Map<string, { context: VocabularyContext; caseId: string }>();
  const issues: string[] = [];

  for (const caseId of caseIds) {
    const definition = loadCase(caseId);
    for (const entry of definition.vocabulary) {
      const known = entries.get(entry.id);
      if (!known) entries.set(entry.id, { entry, caseId });
      else if (JSON.stringify(known.entry) !== JSON.stringify(entry))
        issues.push(
          `vocabulary id "${entry.id}" is defined differently in ${known.caseId} and ${caseId}`,
        );
    }
    for (const context of definition.vocabularyContexts) {
      const known = contexts.get(context.id);
      if (known)
        issues.push(
          `context id "${context.id}" appears in both ${known.caseId} and ${caseId}; context ids must be unique across cases`,
        );
      else contexts.set(context.id, { context, caseId });
    }
  }

  if (issues.length > 0) throw new ContentValidationError('registered cases vocabulary', issues);
  return {
    catalogue: [...entries.values()].map(({ entry }) => entry),
    contexts: [...contexts.values()].map(({ context }) => context),
  };
}
