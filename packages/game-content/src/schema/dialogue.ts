import { z } from 'zod';
import { conditionSchema, effectSchema } from './caseEngine';
import { vocabularySpanSchema } from './learning';
import { dialogueAudioSchema } from './audio';
const id = z.string().min(1);
export const npcSchema = z.object({ id, name: id, role: id, dialogueTreeId: id }).strict();
const choiceSchema = z
  .object({
    id,
    text: id,
    translationVi: id.optional(),
    nextNodeId: id,
    condition: conditionSchema.optional(),
    effects: z.array(effectSchema).optional(),
  })
  .strict();
const nodeSchema = z
  .object({
    id,
    speakerId: id,
    text: id,
    audio: dialogueAudioSchema.optional(),
    translationVi: id.optional(),
    vocabularySpans: z.array(vocabularySpanSchema).optional(),
    terminal: z.boolean(),
    choices: z.array(choiceSchema),
    condition: conditionSchema.optional(),
    effects: z.array(effectSchema).optional(),
  })
  .strict()
  .superRefine((node, ctx) => {
    if (node.terminal === node.choices.length > 0)
      ctx.addIssue({
        code: 'custom',
        path: ['choices'],
        message: 'terminal nodes must have no choices; nonterminal nodes need choices',
      });
  });
export const dialogueTreeSchema = z
  .object({
    id,
    npcId: id,
    entryNodeId: id,
    nodes: z.array(nodeSchema).min(1),
    completionFlag: id,
    completionCondition: conditionSchema,
    notebookStatements: z
      .array(
        z
          .object({
            nodeId: id,
            recordedCondition: conditionSchema,
          })
          .strict(),
      )
      .optional(),
  })
  .strict();
