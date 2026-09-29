import { describe, expect, it } from 'vitest';
import { SHADOW_ALPHA, SHADOW_SIZE, shadowLayers, shadowPlacement } from './shadow';

describe('shadowLayers', () => {
  const layers = shadowLayers();

  it('stacks several concentric low-alpha ellipses instead of a blur', () => {
    expect(layers.length).toBeGreaterThanOrEqual(3);
    for (const layer of layers) expect(layer.alpha).toBeLessThan(0.15);
    expect(layers[0]).toMatchObject(SHADOW_SIZE);
    for (let i = 1; i < layers.length; i += 1) {
      expect(layers[i]!.width).toBeLessThan(layers[i - 1]!.width);
      expect(layers[i]!.height).toBeLessThan(layers[i - 1]!.height);
    }
  });

  it('reaches the target ink alpha at the centre', () => {
    const centre = 1 - layers.reduce((clear, layer) => clear * (1 - layer.alpha), 1);
    expect(centre).toBeCloseTo(SHADOW_ALPHA, 2);
    expect(SHADOW_SIZE).toEqual({ width: 44, height: 16 });
    expect(SHADOW_ALPHA).toBe(0.28);
  });
});

describe('shadowPlacement', () => {
  it('sits on the feet, one depth step below the character', () => {
    expect(shadowPlacement({ x: 120, y: 340, depth: 340 })).toEqual({ x: 120, y: 340, depth: 339 });
  });
});
