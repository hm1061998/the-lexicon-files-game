import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import {
  LIGHT_ALPHA_MAX,
  LIGHT_RADIUS_TILES_MAX,
  createPortalPresentation,
} from './portalPresentation';

function chain<T extends Record<string, unknown>>(target: T, names: readonly string[]): T {
  const proxy = target as Record<string, unknown>;
  for (const name of names) proxy[name] = vi.fn(() => target);
  return target;
}

function makeScene() {
  const graphics = chain({ destroy: vi.fn(), alphas: [] as number[] }, [
    'clear',
    'lineStyle',
    'strokeEllipse',
    'fillEllipse',
    'fillCircle',
    'setDepth',
    'setBlendMode',
  ]);
  graphics.fillStyle = vi.fn((_color: number, alpha: number) => {
    graphics.alphas.push(alpha);
    return graphics;
  });
  const veil = chain({ destroy: vi.fn(), frames: [] as number[] }, [
    'setOrigin',
    'setDepth',
    'setFlipX',
  ]);
  (veil as Record<string, unknown>).setFrame = vi.fn((frame: number) => {
    veil.frames.push(frame);
    return veil;
  });
  const sign = chain({ destroy: vi.fn() }, ['setOrigin', 'setDepth']);
  const tween = { stop: vi.fn(), remove: vi.fn() };
  const timer = { remove: vi.fn(), destroy: vi.fn() };
  const tweensAdd = vi.fn(() => tween);
  const addEvent = vi.fn(() => timer);
  const scene = {
    add: { graphics: () => graphics, sprite: () => veil, text: () => sign },
    tweens: { add: tweensAdd },
    time: { addEvent },
    textures: { exists: () => true },
  } as unknown as Phaser.Scene;
  return { scene, graphics, veil, sign, tween, timer, tweensAdd, addEvent };
}

const args = { position: { x: 100, y: 200 }, facing: 'ne' as const, label: 'PHÒNG THƯ' };

describe('createPortalPresentation', () => {
  it('creates no tween or frame timer and shows frame 0 when motion is reduced', () => {
    const { scene, veil, tweensAdd, addEvent } = makeScene();
    createPortalPresentation(scene, { ...args, reducedMotion: true });
    expect(tweensAdd).not.toHaveBeenCalled();
    expect(addEvent).not.toHaveBeenCalled();
    expect(veil.frames.at(-1)).toBe(0);
  });

  it('runs the veil frames and motes only while motion is on', () => {
    const { scene, tween, timer, tweensAdd, addEvent } = makeScene();
    const effect = createPortalPresentation(scene, { ...args, reducedMotion: true });
    effect.setReducedMotion(false);
    expect(addEvent).toHaveBeenCalledTimes(1);
    expect(tweensAdd).toHaveBeenCalledTimes(1);
    effect.setReducedMotion(true);
    expect(timer.remove).toHaveBeenCalledTimes(1);
    expect(tween.remove).toHaveBeenCalledTimes(1);
  });

  it('destroys every object and stops its tween and timer', () => {
    const { scene, graphics, veil, sign, tween, timer } = makeScene();
    const effect = createPortalPresentation(scene, { ...args, reducedMotion: false });
    effect.destroy();
    expect(graphics.destroy).toHaveBeenCalledTimes(2); // light + motes share the mock
    expect(veil.destroy).toHaveBeenCalledTimes(1);
    expect(sign.destroy).toHaveBeenCalledTimes(1);
    expect(tween.remove).toHaveBeenCalledTimes(1);
    expect(timer.remove).toHaveBeenCalledTimes(1);
  });

  it('keeps the warm light under the spec limits', () => {
    expect(LIGHT_ALPHA_MAX).toBeLessThanOrEqual(0.35);
    expect(LIGHT_RADIUS_TILES_MAX).toBeLessThanOrEqual(1.2);
    const { scene, graphics } = makeScene();
    createPortalPresentation(scene, { ...args, reducedMotion: false });
    expect(Math.max(...graphics.alphas)).toBeLessThanOrEqual(0.35);
  });

  it('mirrors the veil for flipped facings', () => {
    const { scene, veil } = makeScene();
    createPortalPresentation(scene, { ...args, facing: 'ne-flip', reducedMotion: true });
    expect(veil.setFlipX).toHaveBeenCalledWith(true);
  });
});
