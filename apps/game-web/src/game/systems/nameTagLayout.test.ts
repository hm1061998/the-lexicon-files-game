import { describe, expect, it } from 'vitest';
import { nameTagPosition } from './nameTagLayout';

describe('nameTagPosition', () => {
  it('anchors above the actor and moves up to clear an interaction prompt', () => {
    const args = {
      centerX: 100,
      feetY: 300,
      figureHeight: 100,
      tagHeight: 24,
      tagWidth: 90,
      gap: 8,
      prompt: { x: 50, y: 166, width: 100, height: 32 },
    };
    const position = nameTagPosition(args);
    const tagTop = position.y - args.tagHeight / 2;
    expect(tagTop + args.tagHeight).toBeLessThanOrEqual(args.prompt.y);
    expect(position.x).toBe(100);
  });

  it('keeps the default figure-relative anchor when no prompt is present', () => {
    expect(
      nameTagPosition({
        centerX: 30,
        feetY: 200,
        figureHeight: 100,
        tagHeight: 20,
        tagWidth: 80,
        gap: 10,
        prompt: null,
      }),
    ).toEqual({ x: 30, y: 80 });
  });
});
