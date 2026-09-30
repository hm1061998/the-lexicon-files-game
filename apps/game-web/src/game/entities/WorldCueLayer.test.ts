import { describe, expect, it, vi } from 'vitest';
import { WorldCueLayer } from './WorldCueLayer';

function graphics() {
  return {
    setPosition: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
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
});
