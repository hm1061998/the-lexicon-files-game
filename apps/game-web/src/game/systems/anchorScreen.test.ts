import { describe, expect, it } from 'vitest';
import {
  ANCHOR_EMIT_INTERVAL_MS,
  clampBubble,
  placeBubble,
  shouldEmitAnchor,
  worldToScreen,
} from './anchorScreen';

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

  it('applies camera zoom before the CSS scale', () => {
    const zoomed = { ...camera, zoom: 2 };
    expect(worldToScreen({ x: 300, y: 250 }, zoomed, { width: 1920, height: 1080 })).toEqual({
      x: 400,
      y: 400,
    });
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

describe('shouldEmitAnchor', () => {
  it('always emits the first anchor', () => {
    expect(shouldEmitAnchor(null, { x: 1, y: 1 }, 0)).toBe(true);
  });

  it('waits for the interval', () => {
    expect(shouldEmitAnchor({ x: 0, y: 0 }, { x: 50, y: 0 }, ANCHOR_EMIT_INTERVAL_MS - 1)).toBe(
      false,
    );
  });

  it('ignores movement under 2 px', () => {
    expect(shouldEmitAnchor({ x: 0, y: 0 }, { x: 1, y: 1 }, ANCHOR_EMIT_INTERVAL_MS)).toBe(false);
    expect(shouldEmitAnchor({ x: 0, y: 0 }, { x: 2, y: 0 }, ANCHOR_EMIT_INTERVAL_MS)).toBe(true);
  });
});
