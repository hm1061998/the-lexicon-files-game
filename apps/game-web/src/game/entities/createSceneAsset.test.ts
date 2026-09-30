import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import type { IsoProjection } from '@lexicon/shared-types';
import { createSceneAsset } from './createSceneAsset';
import { resolveSceneAssets } from '../systems/sceneAssetResolver';

const projection: IsoProjection = {
  type: 'dimetric-2:1',
  originX: 100,
  originY: 50,
  tileWidth: 128,
  tileHeight: 64,
};

function fakeScene() {
  const sprite = {
    setOrigin: vi.fn(),
    setScale: vi.fn(),
    setAngle: vi.fn(),
    setDepth: vi.fn(),
  };
  const scene = {
    textures: { exists: vi.fn(() => true) },
    add: {
      image: vi.fn(() => sprite),
      sprite: vi.fn(() => sprite),
      zone: vi.fn(() => ({})),
    },
    physics: { add: { existing: vi.fn() } },
  } as unknown as Phaser.Scene;
  return { scene, sprite };
}

describe('createSceneAsset', () => {
  it('rotates an asset along its projected logical wall direction', () => {
    const resolved = resolveSceneAssets([
      {
        id: 'wall',
        type: 'wall',
        texture: 'wall',
        position: { u: 2, v: 0 },
        origin: [0.5, 1],
        scale: 0.5,
        depthBias: 0,
        angle: 26.565,
      },
    ])[0]!;
    const { scene, sprite } = fakeScene();
    createSceneAsset(scene, resolved, projection);
    expect(sprite.setAngle).toHaveBeenCalledWith(26.565);
  });

  it('creates NPCs as animation-capable Phaser sprites', () => {
    const resolved = resolveSceneAssets([
      {
        id: 'anna',
        type: 'npc',
        texture: 'anna_idle',
        position: { u: 2, v: 3 },
        origin: [0.5, 0.88],
        scale: 1,
        depthBias: 0,
      },
    ])[0]!;
    const { scene } = fakeScene();
    createSceneAsset(scene, resolved, projection);
    expect(scene.add.sprite).toHaveBeenCalledWith(36, 210, 'anna_idle');
  });

  it('renders an elevated logical asset at its projected visual anchor and floor depth', () => {
    const resolved = resolveSceneAssets([
      {
        id: 'evidence',
        type: 'interactable',
        texture: 'paper',
        position: { u: 2, v: 3 },
        elevationPx: 24,
        origin: [0.5, 0.5],
        scale: 1,
        depthBias: 3,
        collision: { type: 'rect', u: -0.25, v: -0.25, width: 0.5, height: 0.5 },
      },
    ])[0]!;
    const { scene, sprite } = fakeScene();

    createSceneAsset(scene, resolved, projection);

    expect(scene.add.image).toHaveBeenCalledWith(36, 186, 'paper');
    expect(sprite.setDepth).toHaveBeenCalledWith(213);
    expect(scene.add.zone).not.toHaveBeenCalled();
  });

  it('keeps legacy asset positions and Arcade collision zones in screen space', () => {
    const resolved = resolveSceneAssets([
      {
        id: 'desk',
        type: 'prop',
        texture: 'desk',
        x: 300,
        y: 200,
        origin: [0.5, 1],
        scale: 1,
        depthBias: 0,
        collision: { type: 'rect', x: -20, y: -10, width: 40, height: 10 },
      },
    ])[0]!;
    const { scene } = fakeScene();

    createSceneAsset(scene, resolved);

    expect(scene.add.image).toHaveBeenCalledWith(300, 200, 'desk');
    expect(scene.add.zone).toHaveBeenCalledWith(300, 195, 40, 10);
  });
});
