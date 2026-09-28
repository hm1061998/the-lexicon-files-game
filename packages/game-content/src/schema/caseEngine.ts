import { z } from 'zod';
import type { Condition, Effect } from '@lexicon/shared-types';

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ type: z.literal('hasEvidence'), evidenceId: z.string().min(1) }).strict(),
    z.object({ type: z.literal('hasFact'), factId: z.string().min(1) }).strict(),
    z
      .object({ type: z.literal('objectiveCompleted'), objectiveId: z.string().min(1) })
      .strict(),
    z.object({ type: z.literal('flag'), key: z.string().min(1), value: z.boolean() }).strict(),
    z.object({ type: z.literal('all'), conditions: z.array(conditionSchema) }).strict(),
    z.object({ type: z.literal('any'), conditions: z.array(conditionSchema) }).strict(),
  ]),
);

export const effectSchema: z.ZodType<Effect> = z.discriminatedUnion('type', [
  z.object({ type: z.literal('addEvidence'), evidenceId: z.string().min(1) }).strict(),
  z.object({ type: z.literal('unlockFact'), factId: z.string().min(1) }).strict(),
  z
    .object({ type: z.literal('setFlag'), key: z.string().min(1), value: z.boolean() })
    .strict(),
  z.object({ type: z.literal('activateObjective'), objectiveId: z.string().min(1) }).strict(),
  z.object({ type: z.literal('completeObjective'), objectiveId: z.string().min(1) }).strict(),
]);
