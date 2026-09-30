import Phaser from 'phaser';
import type { IsoProjection } from '@lexicon/shared-types';
import { resolveTextureKey } from '../assetManifest';
import { computeDepth, computeIsoDepth } from '../systems/depth';
import type { ResolvedSceneAsset } from '../systems/sceneAssetResolver';
import { projectScenePoint, projectVisualAnchor } from '../systems/sceneProjection';

export type SceneAssetObjects = {
  sprite: Phaser.GameObjects.Image;
  body: Phaser.GameObjects.Zone | null;
};

export function createSceneAsset(
  scene: Phaser.Scene,
  resolved: ResolvedSceneAsset,
  projection?: IsoProjection,
): SceneAssetObjects {
  const { asset, floorAnchor, visualAnchor } = resolved;
  const texture = resolveTextureKey(scene, asset.texture);
  const floorPoint = projectScenePoint({ projection }, floorAnchor);
  const visualPoint = projectVisualAnchor({ projection }, visualAnchor);
  const sprite = scene.add.image(visualPoint.x, visualPoint.y, texture);
  sprite.setOrigin(asset.origin[0], asset.origin[1]);
  sprite.setScale(asset.scale);
  sprite.setAngle(asset.angle ?? 0);
  const depth = 'u' in floorAnchor && projection
    ? computeIsoDepth(floorAnchor, projection, asset.depthBias)
    : computeDepth(floorPoint.y, asset.depthBias);
  sprite.setDepth(asset.depth ?? depth);

  let body: Phaser.GameObjects.Zone | null = null;
  if (asset.collision && 'x' in asset.collision && 'x' in floorAnchor) {
    const c = asset.collision;
    body = scene.add.zone(
      floorAnchor.x + c.x + c.width / 2,
      floorAnchor.y + c.y + c.height / 2,
      c.width,
      c.height,
    );
    scene.physics.add.existing(body, true);
  }

  return { sprite, body };
}
