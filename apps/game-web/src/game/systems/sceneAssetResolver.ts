import type {
  LogicalPoint,
  LogicalRectCollision,
  RectCollision,
  SceneAssetDefinition,
} from '@lexicon/shared-types';

export type ScreenPoint = { readonly x: number; readonly y: number };
export type SpatialPoint = LogicalPoint | ScreenPoint;
export type VisualAnchor = SpatialPoint & { readonly elevationPx: number };

export interface ResolvedSceneAsset {
  readonly id: string;
  readonly asset: SceneAssetDefinition;
  readonly floorAnchor: SpatialPoint;
  readonly visualAnchor: VisualAnchor;
  readonly collision: RectCollision | LogicalRectCollision | null;
  readonly footprint: LogicalRectCollision | null;
  readonly interactionAnchor: VisualAnchor | null;
}

function addOffset(anchor: SpatialPoint, u: number, v: number): SpatialPoint {
  return 'u' in anchor
    ? { u: anchor.u + u, v: anchor.v + v }
    : { x: anchor.x + u, y: anchor.y + v };
}

function isSurfaceChild(
  asset: SceneAssetDefinition,
): asset is Extract<SceneAssetDefinition, { restsOn: string }> {
  return 'restsOn' in asset && asset.restsOn !== undefined;
}

/** Resolves tabletop dependencies, validating references and preserving each asset's own footprint. */
export function resolveSceneAssets(
  assets: readonly SceneAssetDefinition[],
): readonly ResolvedSceneAsset[] {
  const byId = new Map<string, SceneAssetDefinition>();
  for (const asset of assets) {
    if (byId.has(asset.id)) throw new Error(`duplicate scene asset id "${asset.id}"`);
    byId.set(asset.id, asset);
  }

  const resolved = new Map<string, ResolvedSceneAsset>();
  const resolving = new Set<string>();
  const ordered: ResolvedSceneAsset[] = [];
  const resolve = (asset: SceneAssetDefinition): ResolvedSceneAsset => {
    const cached = resolved.get(asset.id);
    if (cached) return cached;
    if (resolving.has(asset.id)) throw new Error(`surface dependency cycle includes "${asset.id}"`);
    resolving.add(asset.id);

    let floorAnchor: SpatialPoint;
    let elevationPx = asset.elevationPx ?? 0;
    if (isSurfaceChild(asset)) {
      if (asset.restsOn === asset.id)
        throw new Error(`scene asset "${asset.id}" cannot rest on itself`);
      const parent = byId.get(asset.restsOn);
      if (!parent)
        throw new Error(`scene asset "${asset.id}" rests on unknown asset "${asset.restsOn}"`);
      const resolvedParent = resolve(parent);
      if (!('u' in resolvedParent.floorAnchor)) {
        throw new Error(`scene asset "${asset.id}" surface parent must use logical coordinates`);
      }
      const offset = asset.surfaceOffset;
      if (
        !offset ||
        !Number.isFinite(offset.u) ||
        !Number.isFinite(offset.v) ||
        !Number.isFinite(offset.elevationPx)
      ) {
        throw new Error(`scene asset "${asset.id}" requires a finite surfaceOffset`);
      }
      floorAnchor = addOffset(resolvedParent.floorAnchor, offset.u, offset.v);
      elevationPx = resolvedParent.visualAnchor.elevationPx + offset.elevationPx;
    } else if ('position' in asset && asset.position) {
      floorAnchor = asset.position;
    } else if ('x' in asset && asset.x !== undefined && 'y' in asset && asset.y !== undefined) {
      floorAnchor = { x: asset.x, y: asset.y };
    } else {
      throw new Error(`scene asset "${(asset as SceneAssetDefinition).id}" has no valid position`);
    }

    const visualAnchor = { ...floorAnchor, elevationPx } as VisualAnchor;
    let interactionAnchor: VisualAnchor | null = null;
    if (asset.interaction) {
      const point = addOffset(floorAnchor, asset.interaction.x, asset.interaction.y);
      interactionAnchor = { ...point, elevationPx } as VisualAnchor;
    }
    const item: ResolvedSceneAsset = {
      id: asset.id,
      asset,
      floorAnchor,
      visualAnchor,
      collision: asset.collision ?? null,
      footprint:
        asset.footprint && 'u' in floorAnchor
          ? {
              type: 'rect',
              u: floorAnchor.u + asset.footprint.u,
              v: floorAnchor.v + asset.footprint.v,
              width: asset.footprint.width,
              height: asset.footprint.height,
            }
          : null,
      interactionAnchor,
    };
    resolving.delete(asset.id);
    resolved.set(asset.id, item);
    ordered.push(item);
    return item;
  };

  assets.forEach(resolve);
  return ordered;
}
