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

const logicalCollisionSchema = z
  .object({
    type: z.literal('rect'),
    u: z.number().finite(),
    v: z.number().finite(),
    width: z.number().positive(),
    height: z.number().positive(),
  })
  .strict();

const logicalPointSchema = z
  .object({ u: z.number().finite(), v: z.number().finite() })
  .strict();

const surfaceOffsetSchema = z
  .object({
    u: z.number().finite(),
    v: z.number().finite(),
    elevationPx: z.number().finite(),
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
  .union([
    z.object({ x: z.number().finite(), y: z.number().finite() }).strict(),
    logicalPointSchema,
  ]);

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
    x: z.number().finite().optional(),
    y: z.number().finite().optional(),
    position: logicalPointSchema.optional(),
    restsOn: z.string().min(1).optional(),
    surfaceOffset: surfaceOffsetSchema.optional(),
    origin: z.tuple([z.number(), z.number()]).default([0.5, 0.9]),
    scale: z.number().positive().default(1),
    depth: z.number().finite().optional(),
    angle: z.number().finite().optional(),
    depthBias: z.number().finite().default(0),
    elevationPx: z.number().finite().optional(),
    collision: z.union([rectCollisionSchema, logicalCollisionSchema]).optional(),
    interaction: interactionAreaSchema.optional(),
  })
  .strict()
  .superRefine((asset, ctx) => {
    const legacy = asset.x !== undefined && asset.y !== undefined;
    const positioned = asset.position !== undefined;
    const surfaceChild = asset.restsOn !== undefined || asset.surfaceOffset !== undefined;
    const validLegacy = legacy && !positioned && !surfaceChild;
    const validPositioned = positioned && !legacy && !surfaceChild;
    const validChild = surfaceChild && !legacy && !positioned && Boolean(asset.restsOn) && asset.surfaceOffset !== undefined;
    if (!(validLegacy || validPositioned || validChild)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['position'],
        message: 'asset must use legacy x/y, logical position, or restsOn with surfaceOffset',
      });
    }
  });

const sceneLabelSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().trim().min(1, 'label text must not be empty'),
    x: z.number().finite().optional(),
    y: z.number().finite().optional(),
    u: z.number().finite().optional(),
    v: z.number().finite().optional(),
    angle: z.number().optional(),
  })
  .strict()
  .refine((label) => (label.x !== undefined && label.y !== undefined && label.u === undefined && label.v === undefined) || (label.u !== undefined && label.v !== undefined && label.x === undefined && label.y === undefined), 'label must use x/y or u/v');

const isoProjectionSchema = z
  .object({
    type: z.literal('dimetric-2:1'),
    originX: z.number().finite(),
    originY: z.number().finite(),
    tileWidth: z.literal(128),
    tileHeight: z.literal(64),
  })
  .strict();

export const sceneDefinitionSchema = z
  .object({
    id: z.string().min(1),
    projection: isoProjectionSchema.optional(),
    size: z
      .object({
        width: z.number().positive(),
        height: z.number().positive(),
      })
      .strict(),
    worldBounds: z.union([
      z.object({ x: z.number().finite(), y: z.number().finite(), width: z.number().positive(), height: z.number().positive() }).strict(),
      z.object({ u: z.number().finite(), v: z.number().finite(), width: z.number().positive(), height: z.number().positive() }).strict(),
    ]),
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
    const logicalBounds = 'u' in worldBounds;
    const within = (p: { x?: number | undefined; y?: number | undefined; u?: number | undefined; v?: number | undefined }) => {
      if (logicalBounds) return p.u !== undefined && p.v !== undefined && p.u >= worldBounds.u && p.u <= worldBounds.u + worldBounds.width && p.v >= worldBounds.v && p.v <= worldBounds.v + worldBounds.height;
      return p.x !== undefined && p.y !== undefined && p.x >= worldBounds.x && p.x <= worldBounds.x + worldBounds.width && p.y >= worldBounds.y && p.y <= worldBounds.y + worldBounds.height;
    };
    if (logicalBounds && !scene.projection) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['worldBounds'], message: 'logical worldBounds require dimetric projection metadata' });
    }
    if (logicalBounds) {
      scene.assets.forEach((asset, index) => {
        const logicalPosition = asset.position !== undefined || asset.restsOn !== undefined;
        if (!logicalPosition || (asset.collision !== undefined && !('u' in asset.collision))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['assets', index],
            message: 'dimetric scenes require logical positions and logical collision rectangles',
          });
        }
      });
    }
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
  return result.data as unknown as SceneDefinition;
}
