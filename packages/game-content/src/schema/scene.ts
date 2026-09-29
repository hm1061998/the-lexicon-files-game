import { z } from 'zod';
import type { SceneDefinition } from '@lexicon/shared-types';
import { ContentValidationError } from '../loader/ContentValidationError';
import { effectSchema } from './caseEngine';

const rectCollisionSchema = z
  .object({
    type: z.literal('rect'),
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  })
  .strict();

const interactionAreaSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    radius: z.number().positive(),
    prompt: z.string().min(1),
    effects: z.array(effectSchema).optional(),
    npcId: z.string().min(1).optional(),
    transition: z
      .object({
        targetSceneId: z.string().min(1),
        targetSpawnId: z.string().min(1),
      })
      .strict()
      .optional(),
  })
  .strict();

const spawnPointSchema = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .strict();

const sceneAssetTypeSchema = z.enum(['background', 'wall', 'prop', 'interactable', 'npc']);

const sceneAssetDefinitionSchema = z
  .object({
    id: z.string().min(1),
    type: sceneAssetTypeSchema,
    texture: z.string().min(1),
    x: z.number(),
    y: z.number(),
    origin: z.tuple([z.number(), z.number()]).default([0.5, 0.9]),
    depth: z.number().optional(),
    depthBias: z.number().default(0),
    collision: rectCollisionSchema.optional(),
    interaction: interactionAreaSchema.optional(),
  })
  .strict();

export const sceneDefinitionSchema = z
  .object({
    id: z.string().min(1),
    size: z
      .object({
        width: z.number().positive(),
        height: z.number().positive(),
      })
      .strict(),
    worldBounds: z
      .object({
        x: z.number(),
        y: z.number(),
        width: z.number().positive(),
        height: z.number().positive(),
      })
      .strict(),
    spawnPoints: z.record(z.string().min(1), spawnPointSchema),
    assets: z.array(sceneAssetDefinitionSchema),
  })
  .strict()
  .superRefine((scene, ctx) => {
    const seenIds = new Set<string>();
    for (const asset of scene.assets) {
      if (seenIds.has(asset.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['assets'],
          message: `duplicate asset id "${asset.id}"`,
        });
      }
      seenIds.add(asset.id);
    }

    const { spawnPoints, worldBounds } = scene;
    if (!Object.hasOwn(spawnPoints, 'default')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['spawnPoints', 'default'],
        message: 'default spawn point is required',
      });
    }
    for (const [id, spawn] of Object.entries(spawnPoints)) {
      const withinBounds =
        spawn.x >= worldBounds.x &&
        spawn.x <= worldBounds.x + worldBounds.width &&
        spawn.y >= worldBounds.y &&
        spawn.y <= worldBounds.y + worldBounds.height;
      if (!withinBounds) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['spawnPoints', id],
          message: 'spawn point must be within worldBounds',
        });
      }
    }
  });

function formatIssue(issue: z.ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
  return `${path}: ${issue.message}`;
}

export function parseSceneDefinition(raw: unknown, source: string): SceneDefinition {
  const result = sceneDefinitionSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map(formatIssue);
    throw new ContentValidationError(source, issues);
  }
  return result.data;
}
