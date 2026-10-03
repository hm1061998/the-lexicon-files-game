import { describe, expect, it } from 'vitest';
import { swipeOrigin, swipeScrollFor } from './SwipeRow';

describe('mouse drag on a swipe row', () => {
  it('starts from the pointer and the scroll of the row own axis', () => {
    const pointer = { x: 900, y: 300 };
    const scroll = { left: 12, top: 80 };
    expect(swipeOrigin('x', pointer, scroll)).toEqual({ start: 900, from: 12 });
    expect(swipeOrigin('y', pointer, scroll)).toEqual({ start: 300, from: 80 });
  });

  it('a vertical drag moves the column by the vertical distance only', () => {
    const origin = swipeOrigin('y', { x: 900, y: 300 }, { left: 0, top: 80 });
    // The pointer moved 1px down and 200px sideways: that is no drag at all.
    expect(swipeScrollFor('y', origin, { x: 1100, y: 301 })).toEqual({ moved: false, scroll: 80 });
    // Dragging up by 120px scrolls the content down by 120px.
    expect(swipeScrollFor('y', origin, { x: 905, y: 180 })).toEqual({ moved: true, scroll: 200 });
  });

  it('a horizontal drag moves the row by the horizontal distance only', () => {
    const origin = swipeOrigin('x', { x: 400, y: 300 }, { left: 50, top: 0 });
    expect(swipeScrollFor('x', origin, { x: 300, y: 500 })).toEqual({ moved: true, scroll: 150 });
    expect(swipeScrollFor('x', origin, { x: 398, y: 500 })).toEqual({ moved: false, scroll: 50 });
  });
});
