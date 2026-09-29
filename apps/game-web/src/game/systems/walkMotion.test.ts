import { describe, expect, it } from 'vitest';
import { isWalking } from './walkMotion';

describe('isWalking', () => {
  it('is walking when the body actually moved', () => {
    expect(isWalking({ deltaX: 3.6, deltaY: 0, blocked: false })).toBe(true);
    expect(isWalking({ deltaX: -2, deltaY: 2, blocked: false })).toBe(true);
  });

  it('is idle when the body did not move (pushing into an obstacle)', () => {
    expect(isWalking({ deltaX: 0, deltaY: 0, blocked: true })).toBe(false);
    expect(isWalking({ deltaX: 0, deltaY: 0, blocked: false })).toBe(false);
  });

  it('ignores sub-epsilon jitter from collision separation', () => {
    expect(isWalking({ deltaX: 0.3, deltaY: 0.2, blocked: false })).toBe(false);
    expect(isWalking({ deltaX: 0.8, deltaY: 0, blocked: true })).toBe(false);
  });

  it('still walks when sliding along an obstacle', () => {
    expect(isWalking({ deltaX: 0, deltaY: 3.6, blocked: true })).toBe(true);
  });

  it('honours a custom epsilon', () => {
    expect(isWalking({ deltaX: 1, deltaY: 0, blocked: false }, 2)).toBe(false);
    expect(isWalking({ deltaX: 3, deltaY: 0, blocked: false }, 2)).toBe(true);
  });
});
