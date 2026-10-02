import { describe, expect, it, vi } from 'vitest';
import { WorldCueLayer } from './WorldCueLayer';

function graphics() {
  return {
    setPosition: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setY: vi.fn().mockReturnThis(),
    setScrollFactor: vi.fn().mockReturnThis(),
    fillStyle: vi.fn(),
    lineStyle: vi.fn(),
    fillPoints: vi.fn(),
    strokePoints: vi.fn(),
    destroy: vi.fn(),
  };
}

describe('WorldCueLayer', () => {
  it('omits the nearby target outline, creates only visible markers, and destroys them on sync/shutdown', () => {
    const made: ReturnType<typeof graphics>[] = [];
    const scene = {
      add: {
        graphics: () => {
          const item = graphics();
          made.push(item);
          return item;
        },
      },
      tweens: { add: () => ({ stop: vi.fn() }) },
      textures: { exists: () => false },
    } as never;
    const layer = new WorldCueLayer(
      scene,
      new Map([
        ['note', { x: 12, y: 20, depth: 30 }],
        ['door', { x: 40, y: 50, depth: 60 }],
      ]),
    );
    layer.sync(new Set(['note', 'door', 'unknown']), 'note', true);
    expect(made).toHaveLength(1);
    expect(made[0]?.setPosition).toHaveBeenCalledWith(40, 50);
    layer.sync(new Set(['note', 'door']), null, true);
    expect(made).toHaveLength(2);
    layer.sync(new Set(), null, false);
    expect(made[0]?.destroy).toHaveBeenCalledOnce();
    expect(made[1]?.destroy).toHaveBeenCalledOnce();
    layer.destroy();
    expect(made).toHaveLength(2);
  });

  function richScene() {
    const tweens: { targets: unknown; stop: ReturnType<typeof vi.fn> }[] = [];
    const images: Record<string, ReturnType<typeof vi.fn>>[] = [];
    const scene = {
      add: {
        graphics: () => graphics(),
        image: () => {
          const image = {
            setOrigin: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            setScale: vi.fn().mockReturnThis(),
            setAlpha: vi.fn().mockReturnThis(),
            destroy: vi.fn(),
          };
          images.push(image);
          return image;
        },
      },
      tweens: {
        add: (config: { targets: unknown }) => {
          const tween = { targets: config.targets, stop: vi.fn() };
          tweens.push(tween);
          return tween;
        },
      },
      textures: { exists: () => true },
    } as never;
    return { scene, tweens, images };
  }
  const anchors = new Map([['note', { x: 12, y: 20, depth: 30, floor: { x: 12, y: 60 } }]]);

  it('floats the marker and pulses a ripple under it, and stops both when the cue goes', () => {
    const { scene, tweens, images } = richScene();
    const layer = new WorldCueLayer(scene, anchors);
    layer.sync(new Set(['note']), null, false);
    expect(images).toHaveLength(1);
    expect(tweens).toHaveLength(2);
    layer.sync(new Set(), null, false);
    expect(tweens.every(({ stop }) => stop.mock.calls.length > 0)).toBe(true);
    expect(images[0]?.destroy).toHaveBeenCalledOnce();
  });

  it('draws a still ripple and creates no tween when motion is reduced', () => {
    const { scene, tweens, images } = richScene();
    const layer = new WorldCueLayer(scene, anchors);
    layer.sync(new Set(['note']), null, true);
    expect(images).toHaveLength(1);
    expect(images[0]?.setAlpha).toHaveBeenLastCalledWith(0.5);
    expect(tweens).toHaveLength(0);
  });

  it('keeps a ripple under the nearby target but gives it no marker', () => {
    const { scene, images } = richScene();
    const layer = new WorldCueLayer(scene, anchors);
    layer.sync(new Set(['note']), 'note', false);
    expect(layer.activeCount).toBe(0);
    expect(images).toHaveLength(1);
  });

  it('gives doors only the diamond: no ripple and no edge pointer', () => {
    const { scene, images } = richScene();
    const layer = new WorldCueLayer(
      scene,
      new Map([
        ['door', { x: 12, y: 20, depth: 30, floor: { x: 12, y: 60 }, kind: 'door' as const }],
      ]),
    );
    layer.sync(new Set(['door']), null, false);
    expect(layer.activeCount).toBe(1);
    expect(images).toHaveLength(0);
    const camera = { worldView: { x: 0, y: 0 }, zoom: 1, width: 100, height: 100 } as never;
    layer.syncOffscreen(camera, { x: 50, y: 50 }, { top: 0, right: 0, bottom: 0, left: 0 }, 1);
    expect(layer.offscreenIds()).toEqual([]);
  });
});
