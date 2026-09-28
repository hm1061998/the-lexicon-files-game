import Phaser from 'phaser';
import type { SceneAssetDefinition } from '@lexicon/shared-types';
import { computeDepth } from '../systems/depth';

export type SceneAssetObjects = {
  sprite: Phaser.GameObjects.Image;
  body: Phaser.GameObjects.Zone | null;
};

export function createSceneAsset(
  scene: Phaser.Scene,
  asset: SceneAssetDefinition,
): SceneAssetObjects {
  let texture = asset.texture;
  if (!scene.textures.exists(texture)) {
    console.warn(`[Scene] missing texture ${texture}`);
    texture = 'ph_missing';
  }

  const sprite = scene.add.image(asset.x, asset.y, texture);
  sprite.setOrigin(asset.origin[0], asset.origin[1]);
  sprite.setDepth(asset.depth ?? computeDepth(asset.y, asset.depthBias));

  let body: Phaser.GameObjects.Zone | null = null;
  if (asset.collision) {
    const c = asset.collision;
    body = scene.add.zone(
      asset.x + c.x + c.width / 2,
      asset.y + c.y + c.height / 2,
      c.width,
      c.height,
    );
    scene.physics.add.existing(body, true);
  }

  return { sprite, body };
}
