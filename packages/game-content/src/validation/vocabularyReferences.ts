import type { VocabularyEntryData } from '../schema/learning';
import type { VocabularySpanData } from '../schema/learning';

type Context = {
  id: string;
  text: string;
  spans?: readonly VocabularySpanData[] | undefined;
  vocabularyIds?: readonly string[] | undefined;
};
type Input = {
  source: string;
  catalogue: readonly Pick<VocabularyEntryData, 'id' | 'lemma' | 'surfaceForms'>[];
  evidenceContexts: readonly Context[];
  dialogueContexts: readonly Context[];
  briefingContexts?: readonly Context[];
};

export function validateVocabularyReferences({
  source,
  catalogue,
  evidenceContexts,
  dialogueContexts,
  briefingContexts = [],
}: Input): string[] {
  const issues: string[] = [];
  const byId = new Map(catalogue.map((entry) => [entry.id, entry]));
  for (const [kind, contexts] of [
    ['evidence', evidenceContexts],
    ['dialogue', dialogueContexts],
    ['briefing', briefingContexts],
  ] as const) {
    for (const context of contexts) {
      const spans = context.spans ?? [];
      const refs = spans.map((span) => span.vocabularyId);
      if (new Set(refs).size !== refs.length)
        issues.push(`${source}/${kind}.${context.id}.spans: duplicate content reference`);
      const sorted = [...spans].sort((a, b) => a.start - b.start);
      let previousEnd = -1;
      for (const [index, span] of sorted.entries()) {
        const path = `${source}/${kind}.${context.id}.spans.${index}`;
        if (span.start < 0) issues.push(`${path}.start: must be a nonnegative UTF-16 offset`);
        if (span.end < 0 || span.end <= span.start || span.end > context.text.length)
          issues.push(`${path}.end: out of bounds or reversed UTF-16 span`);
        if (span.start < previousEnd) issues.push(`${path}: spans overlap`);
        previousEnd = Math.max(previousEnd, span.end);
        const entry = byId.get(span.vocabularyId);
        if (!entry) {
          issues.push(`${path}.vocabularyId: unknown vocabulary id "${span.vocabularyId}"`);
          continue;
        }
        const surface = context.text.slice(span.start, span.end).toLocaleLowerCase();
        if (
          ![entry.lemma, ...entry.surfaceForms].some((form) => form.toLocaleLowerCase() === surface)
        ) {
          issues.push(`${path}: annotated surface text does not match vocabulary entry`);
        }
      }
      if (kind === 'evidence' && context.vocabularyIds) {
        const unique = [...new Set(refs)].sort();
        const declared = [...context.vocabularyIds].sort();
        if (
          new Set(declared).size !== declared.length ||
          unique.join('\0') !== declared.join('\0')
        ) {
          issues.push(
            `${source}/${kind}.${context.id}.vocabularyIds: must match unique description span references`,
          );
        }
      }
    }
  }
  return issues;
}
