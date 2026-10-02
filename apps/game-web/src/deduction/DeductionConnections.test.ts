import { describe, expect, it } from 'vitest';
import { connectionCoordinates } from './DeductionConnections';
describe('authored connection geometry', () => {
  it('uses card centers relative to the scrolling surface', () => {
    expect(
      connectionCoordinates(
        { left: 110, top: 70, width: 40, height: 60 },
        { left: 310, top: 170, width: 80, height: 20 },
        { left: 100, top: 50 },
      ),
    ).toEqual({ x1: 30, y1: 50, x2: 250, y2: 130 });
  });
});

it('keeps cable endpoints in content coordinates after scrolling', () => {
  expect(
    connectionCoordinates(
      { left: 110, top: 70, width: 40, height: 60 },
      { left: 310, top: 170, width: 80, height: 20 },
      { left: 100, top: 50, scrollTop: 100, scrollLeft: 20 },
    ),
  ).toEqual({ x1: 50, y1: 150, x2: 270, y2: 230 });
});
