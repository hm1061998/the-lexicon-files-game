import { describe, expect, it } from 'vitest';
import { computeHudInsets, sameInsets } from './hudInsets';

const viewport = { width: 1280, height: 720 };

describe('computeHudInsets', () => {
  it('turns the objective card and the key line into top and bottom insets', () => {
    expect(
      computeHudInsets(viewport, [
        { left: 0, top: 0, right: 340, bottom: 110 },
        { left: 400, top: 680, right: 880, bottom: 720 },
      ]),
    ).toEqual({ top: 110, bottom: 40, left: 0, right: 0 });
  });

  it('ignores blocks that touch no edge within 32px', () => {
    expect(computeHudInsets(viewport, [{ left: 400, top: 300, right: 700, bottom: 400 }])).toEqual({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });
  });

  it('uses the tallest reach when several blocks share an edge', () => {
    const insets = computeHudInsets(viewport, [
      { left: 20, top: 20, right: 360, bottom: 120 },
      { left: 1000, top: 20, right: 1260, bottom: 300 },
    ]);
    expect(insets.top).toBe(300);
  });

  it('assigns a block on the right edge to the right inset', () => {
    expect(
      computeHudInsets(viewport, [{ left: 1000, top: 300, right: 1280, bottom: 400 }]),
    ).toEqual({ top: 0, bottom: 0, left: 0, right: 280 });
  });

  it('treats blocks within 32px of an edge as touching it', () => {
    expect(computeHudInsets(viewport, [{ left: 20, top: 20, right: 200, bottom: 90 }]).top).toBe(
      90,
    );
  });
});

describe('computeHudInsets with a letterboxed canvas', () => {
  // Canvas occupies y 86..634 of a 760x720 page (bars above and below).
  const canvas = { width: 760, height: 548, origin: { x: 0, y: 86 } };

  it('measures HUD reach from the canvas edge, not from the page edge', () => {
    // An objective card over the top bar and the first 34px of the canvas.
    const insets = computeHudInsets(
      { width: canvas.width, height: canvas.height },
      [{ left: 0, top: 20, right: 340, bottom: 120 }],
      canvas.origin,
    );
    expect(insets).toEqual({ top: 34, bottom: 0, left: 0, right: 0 });
  });

  it('ignores HUD blocks lying entirely over the letterbox bars', () => {
    const insets = computeHudInsets(
      { width: canvas.width, height: canvas.height },
      [{ left: 0, top: 8, right: 200, bottom: 60 }],
      canvas.origin,
    );
    expect(insets).toEqual({ top: 0, bottom: 0, left: 0, right: 0 });
  });
});

describe('sameInsets', () => {
  it('compares all four sides', () => {
    expect(
      sameInsets(
        { top: 1, right: 2, bottom: 3, left: 4 },
        { top: 1, right: 2, bottom: 3, left: 4 },
      ),
    ).toBe(true);
    expect(
      sameInsets(
        { top: 1, right: 2, bottom: 3, left: 4 },
        { top: 1, right: 2, bottom: 3, left: 5 },
      ),
    ).toBe(false);
  });
});
