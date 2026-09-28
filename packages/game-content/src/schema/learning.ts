import { z } from 'zod';

export const vocabularySpanSchema = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  vocabularyId: z.string().min(1),
}).strict();

export const vocabularyEntrySchema = z.object({
  id: z.string().min(1),
  lemma: z.string().min(1),
  partOfSpeech: z.string().min(1),
  cefr: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
  definitionEn: z.string().min(1),
  translationVi: z.string().min(1),
  examples: z.array(z.string().min(1)).min(1),
  synonyms: z.array(z.string().min(1)).optional(),
  tags: z.array(z.string().min(1)),
  surfaceForms: z.array(z.string().min(1)),
}).strict().superRefine((entry, ctx) => {
  for (const [field, values] of Object.entries({ synonyms: entry.synonyms ?? [], tags: entry.tags, surfaceForms: entry.surfaceForms })) {
    if (new Set(values.map((value) => value.toLocaleLowerCase())).size !== values.length) {
      ctx.addIssue({ code: 'custom', path: [field], message: `duplicate ${field}` });
    }
  }
});

export const vocabularyCatalogueSchema = z.object({ vocabulary: z.array(vocabularyEntrySchema) }).strict().superRefine(({ vocabulary }, ctx) => {
  const ids = new Set<string>();
  const lemmas = new Set<string>();
  vocabulary.forEach((entry, index) => {
    if (ids.has(entry.id)) ctx.addIssue({ code: 'custom', path: ['vocabulary', index, 'id'], message: 'duplicate id' });
    if (lemmas.has(entry.lemma.toLocaleLowerCase())) ctx.addIssue({ code: 'custom', path: ['vocabulary', index, 'lemma'], message: 'duplicate lemma' });
    ids.add(entry.id);
    lemmas.add(entry.lemma.toLocaleLowerCase());
  });
});

export type VocabularyEntryData = z.infer<typeof vocabularyEntrySchema>;
export type VocabularySpanData = z.infer<typeof vocabularySpanSchema>;
