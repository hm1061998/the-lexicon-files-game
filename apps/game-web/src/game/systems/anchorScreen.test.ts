import { describe, expect, it } from 'vitest';
import {
  ANCHOR_EMIT_INTERVAL_MS,
  canAnchorBubble,
  clampBubble,
  placeBubble,
  shouldEmitAnchor,
  worldToScreen,
} from './anchorScreen';
import { projectInteractionAnchor } from './anchorScreen';

const camera = { scrollX: 100, scrollY: 50, zoom: 1, width: 1920, height: 1080 };

describe('worldToScreen', () => {
  it('subtracts the camera scroll at zoom 1', () => {
    expect(worldToScreen({ x: 300, y: 250 }, camera, { width: 1920, height: 1080 })).toEqual({
      x: 200,
      y: 200,
    });
  });

  it('scales by the CSS shrink of the canvas', () => {
    expect(worldToScreen({ x: 300, y: 250 }, camera, { width: 960, height: 540 })).toEqual({
      x: 100,
      y: 100,
    });
  });

  it('zooms about the camera centre like Phaser (world view centre stays put)', () => {
    const zoomed = { ...camera, zoom: 2 };
    // Camera centre in world space is scroll + half the size; it maps to the canvas centre.
    const centre = { x: 100 + 960, y: 50 + 540 };
    expect(worldToScreen(centre, zoomed, { width: 1920, height: 1080 })).toEqual({
      x: 960,
      y: 540,
    });
    // One world px right of the centre is two screen px right.
    expect(
      worldToScreen({ x: centre.x + 1, y: centre.y }, zoomed, { width: 1920, height: 1080 }).x,
    ).toBe(962);
  });
});

describe('projectInteractionAnchor', () => {
  const projection = {
    type: 'dimetric-2:1' as const,
    originX: 0,
    originY: 0,
    tileWidth: 128 as const,
    tileHeight: 64 as const,
  };

  it('applies projection, camera zoom and CSS canvas scaling once each', () => {
    const anchor = { u: 2, v: 1 };
    expect(
      projectInteractionAnchor(anchor, projection, camera, { width: 1920, height: 1080 }),
    ).toEqual({
      x: -36,
      y: 46,
    });
    expect(
      projectInteractionAnchor(
        anchor,
        projection,
        { ...camera, zoom: 2 },
        { width: 960, height: 540 },
      ),
    ).toEqual({ x: -516, y: -224 });
  });
});

describe('clampBubble', () => {
  const size = { width: 100, height: 40 };
  const viewport = { width: 800, height: 600 };

  it('leaves an inside position alone', () => {
    expect(clampBubble({ x: 200, y: 200 }, size, viewport, 8)).toEqual({ x: 200, y: 200 });
  });

  it('keeps the bubble inside every edge with the margin', () => {
    expect(clampBubble({ x: -50, y: 200 }, size, viewport, 8).x).toBe(8);
    expect(clampBubble({ x: 790, y: 200 }, size, viewport, 8).x).toBe(692);
    expect(clampBubble({ x: 200, y: -30 }, size, viewport, 8).y).toBe(8);
    expect(clampBubble({ x: 200, y: 700 }, size, viewport, 8).y).toBe(552);
  });
});

describe('placeBubble', () => {
  const size = { width: 100, height: 40 };
  const viewport = { width: 800, height: 600 };

  it('places the bubble to the right of the anchor by default', () => {
    const pos = placeBubble({ x: 300, y: 300 }, size, viewport, 8, []);
    expect(pos).not.toBeNull();
    expect(pos!.x).toBeGreaterThan(300);
  });

  it('flips to the opposite side when the right side hits a forbidden rectangle', () => {
    const forbidden = { left: 300, top: 250, right: 500, bottom: 400 };
    const pos = placeBubble({ x: 300, y: 300 }, size, viewport, 8, [forbidden]);
    expect(pos).not.toBeNull();
    expect(pos!.x + size.width).toBeLessThanOrEqual(300);
  });

  it('never overlaps a forbidden rectangle and returns null when no side fits', () => {
    const wall = { left: 0, top: 0, right: 800, bottom: 600 };
    expect(placeBubble({ x: 300, y: 300 }, size, viewport, 8, [wall])).toBeNull();
  });

  it('stays inside the viewport near the right edge', () => {
    const pos = placeBubble({ x: 790, y: 300 }, size, viewport, 8, []);
    expect(pos).not.toBeNull();
    expect(pos!.x + size.width).toBeLessThanOrEqual(792);
    expect(pos!.x).toBeGreaterThanOrEqual(8);
  });
});

describe('canAnchorBubble', () => {
  it('uses the compact HUD cutoffs for bottom-safe-zone prompts', () => {
    expect(canAnchorBubble(959, 720)).toBe(false);
    expect(canAnchorBubble(960, 640)).toBe(true);
    expect(canAnchorBubble(1280, 639)).toBe(false);
  });
});

describe('shouldEmitAnchor', () => {
  const a = { id: 'a', x: 0, y: 0 };

  it('always emits the first anchor', () => {
    expect(shouldEmitAnchor(null, { id: 'a', x: 1, y: 1 }, 0)).toBe(true);
  });

  it('waits for the interval', () => {
    expect(shouldEmitAnchor(a, { id: 'a', x: 50, y: 0 }, ANCHOR_EMIT_INTERVAL_MS - 1)).toBe(false);
  });

  it('ignores movement under 2 px', () => {
    expect(shouldEmitAnchor(a, { id: 'a', x: 1, y: 1 }, ANCHOR_EMIT_INTERVAL_MS)).toBe(false);
    expect(shouldEmitAnchor(a, { id: 'a', x: 2, y: 0 }, ANCHOR_EMIT_INTERVAL_MS)).toBe(true);
  });

  it('publishes a changed player avoidance rectangle after the normal throttle', () => {
    const previous = {
      id: 'a',
      x: 10,
      y: 12,
      avoidRects: [{ left: 1, top: 2, right: 21, bottom: 42 }],
    };
    expect(
      shouldEmitAnchor(
        previous,
        { ...previous, avoidRects: [{ left: 3, top: 2, right: 23, bottom: 42 }] },
        ANCHOR_EMIT_INTERVAL_MS - 1,
      ),
    ).toBe(false);
    expect(
      shouldEmitAnchor(
        previous,
        { ...previous, avoidRects: [{ left: 3, top: 2, right: 23, bottom: 42 }] },
        ANCHOR_EMIT_INTERVAL_MS,
      ),
    ).toBe(true);
  });

  it('emits at once when the target id changes, even within 50 ms and under 2 px', () => {
    expect(shouldEmitAnchor(a, { id: 'b', x: 0.5, y: 0 }, 1)).toBe(true);
  });
});
