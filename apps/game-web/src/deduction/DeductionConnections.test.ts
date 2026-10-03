import { describe, expect, it } from 'vitest';
import { cablePath, connectionCoordinates } from './DeductionConnections';
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

describe('cable between two pins', () => {
  it('starts and ends on the pins and sags below the lower one', () => {
    const d = cablePath({ x1: 100, y1: 40, x2: 300, y2: 50 });
    expect(d.startsWith('M 100 40 Q 200 ')).toBe(true);
    expect(d.endsWith(' 300 50')).toBe(true);
    const control = Number(d.split(' ')[5]);
    expect(control).toBeGreaterThan(50);
  });

  it('sags more over a longer span but never past a limit', () => {
    const sagOf = (x2: number) => Number(cablePath({ x1: 0, y1: 0, x2, y2: 0 }).split(' ')[5]);
    expect(sagOf(400)).toBeGreaterThan(sagOf(100));
    expect(sagOf(100000)).toBeLessThanOrEqual(60);
  });
});
