import { z } from 'zod';
import type { CaseAudioDefinition, DialogueAudio } from '@lexicon/shared-types';

const audioUrl = z
  .string()
  .startsWith('/audio/')
  .refine((url) => !url.includes('..'), 'must be a traversal-safe local /audio/ path');
export const dialogueAudioSchema: z.ZodType<DialogueAudio> = z
  .object({
    url: audioUrl,
    textSha256: z.string().regex(/^[a-f0-9]{64}$/i),
  })
  .strict();

const cuePaths = (minimum: number) => z.array(audioUrl).min(minimum);
export const caseAudioDefinitionSchema = z
  .object({
    sfx: z
      .object({
        footstep: cuePaths(2),
        paper: cuePaths(1),
        ui: cuePaths(1),
        evidence: cuePaths(1),
        door: cuePaths(1),
        dialogue: cuePaths(1),
      })
      .strict(),
  })
  .strict() satisfies z.ZodType<CaseAudioDefinition>;
