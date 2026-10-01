import { expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { createPortalPresentation } from './portalPresentation';
it('keeps reduced motion static and destroys its graphics and tween', () => {
  const g = {
    clear: vi.fn(),
    lineStyle: vi.fn(),
    strokeEllipse: vi.fn(),
    fillStyle: vi.fn(),
    fillCircle: vi.fn(),
    setDepth: vi.fn(),
    destroy: vi.fn(),
  };
  for (const name of [
    'clear',
    'lineStyle',
    'strokeEllipse',
    'fillStyle',
    'fillCircle',
    'setDepth',
  ] as const)
    g[name].mockReturnValue(g);
  const tween = { stop: vi.fn(), remove: vi.fn() };
  const add = vi.fn(() => tween);
  const scene = { add: { graphics: () => g }, tweens: { add } } as unknown as Phaser.Scene;
  const effect = createPortalPresentation(scene, { x: 100, y: 200 }, true);
  expect(add).not.toHaveBeenCalled();
  effect.setReducedMotion(false);
  expect(add).toHaveBeenCalledTimes(1);
  effect.setReducedMotion(true);
  expect(tween.remove).toHaveBeenCalledTimes(1);
  effect.destroy();
  expect(g.destroy).toHaveBeenCalledTimes(1);
});
