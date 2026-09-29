import { describe, expect, it } from 'vitest';
import { CHARACTER_FIGURE_HEIGHT } from '../constants';
import { MARKER_HEAD_GAP, MARKER_TOP_GAP, markerBaseY, markerPositionY } from './markerFloat';

describe('markerPositionY', () => {
  it.each([
    [100, 0, 100],
    [100, -4, 96],
    [-50, -4, -54],
  ])('base %d + offset %d = %d', (base, offset, expected) => {
    expect(markerPositionY(base, offset)).toBe(expected);
  });
});

describe('markerBaseY', () => {
  it('keeps the default offset above short, flat props', () => {
    // note: area at 1100, sprite top at 1089 -> default -90 is already higher
    expect(markerBaseY(1100, 1089)).toBe(1010);
  });

  it('lifts the marker above tall sprites so it never covers them', () => {
    // door: area at 720, sprite top at 568 -> above the top edge
    expect(markerBaseY(720, 568)).toBe(568 - MARKER_TOP_GAP);
  });

  it('clears the head of a player standing behind a blocking footprint', () => {
    // terminal: area at 1000, art top at 940, footprint blocks the feet at y=956
    const base = markerBaseY(1000, 940, 956);
    expect(base).toBe(956 - CHARACTER_FIGURE_HEIGHT - MARKER_HEAD_GAP);
    expect(base).toBeLessThan(956 - CHARACTER_FIGURE_HEIGHT);
  });

  it('ignores the standing point when other limits are already higher', () => {
    expect(markerBaseY(720, 568, 700)).toBe(568 - MARKER_TOP_GAP);
  });
});
