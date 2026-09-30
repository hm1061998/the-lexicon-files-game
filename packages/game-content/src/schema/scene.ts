import { z } from 'zod';
import type { SceneDefinition } from '@lexicon/shared-types';
import { ContentValidationError } from '../loader/ContentValidationError';
import { effectSchema } from './caseEngine';
import { assetPathSchema } from './assetPath';

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

export const PLACEHOLDER_TEXTURE_PREFIX = 'ph_';

export const textureEntrySchema = z
  .object({
    key: z.string().min(1),
    url: assetPathSchema,
    frameWidth: z.number().int().positive().optional(),
    frameHeight: z.number().int().positive().optional(),
  })
  .strict()
  .refine(
    (entry) => (entry.frameWidth === undefined) === (entry.frameHeight === undefined),
    'frameWidth and frameHeight go together',
  );

/** Reports duplicate keys in a texture list as `<label>: duplicate texture key "<key>"`. */
export function findDuplicateTextureKeys(textures: readonly { key: string }[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const { key } of textures) {
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return [...duplicates];
}

const sceneAssetTypeSchema = z.enum(['background', 'wall', 'prop', 'interactable', 'npc']);

const sceneAssetDefinitionSchema = z
  .object({
    id: z.string().min(1),
    type: sceneAssetTypeSchema,
    texture: z.string().min(1),
    x: z.number(),
    y: z.number(),
    origin: z.tuple([z.number(), z.number()]).default([0.5, 0.9]),
    scale: z.number().positive().default(1),
    depth: z.number().optional(),
    depthBias: z.number().default(0),
    collision: rectCollisionSchema.optional(),
    interaction: interactionAreaSchema.optional(),
  })
  .strict();

const sceneLabelSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().trim().min(1, 'label text must not be empty'),
    x: z.number(),
    y: z.number(),
    angle: z.number().optional(),
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
    textures: z.array(textureEntrySchema),
    assets: z.array(sceneAssetDefinitionSchema),
    labels: z.array(sceneLabelSchema).optional(),
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

    for (const key of findDuplicateTextureKeys(scene.textures)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['textures'],
        message: `scene "${scene.id}": duplicate texture key "${key}"`,
      });
    }
    const declared = new Set(scene.textures.map(({ key }) => key));
    scene.assets.forEach((asset, index) => {
      if (asset.texture.startsWith(PLACEHOLDER_TEXTURE_PREFIX) || declared.has(asset.texture)) {
        return;
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['assets', index, 'texture'],
        message: `scene "${scene.id}": asset "${asset.id}" uses texture "${asset.texture}" that is not declared in textures`,
      });
    });

    const { spawnPoints, worldBounds } = scene;
    const within = (p: { x: number; y: number }) =>
      p.x >= worldBounds.x &&
      p.x <= worldBounds.x + worldBounds.width &&
      p.y >= worldBounds.y &&
      p.y <= worldBounds.y + worldBounds.height;
    const labelIds = new Set<string>();
    (scene.labels ?? []).forEach((label, index) => {
      if (labelIds.has(label.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['labels', index, 'id'],
          message: `scene "${scene.id}": duplicate label id "${label.id}"`,
        });
      }
      labelIds.add(label.id);
      if (!within(label)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['labels', index],
          message: `scene "${scene.id}": label "${label.id}" must be within worldBounds`,
        });
      }
    });
    if (!Object.hasOwn(spawnPoints, 'default')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['spawnPoints', 'default'],
        message: 'default spawn point is required',
      });
    }
    for (const [id, spawn] of Object.entries(spawnPoints)) {
      if (!within(spawn)) {
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
