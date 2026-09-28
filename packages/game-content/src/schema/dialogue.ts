import { z } from 'zod';
import { conditionSchema, effectSchema } from './caseEngine';
const id = z.string().min(1);
export const npcSchema = z.object({ id, name: id, role: id, dialogueTreeId: id }).strict();
const choiceSchema = z
  .object({
    id,
    text: id,
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
  })
  .strict();
