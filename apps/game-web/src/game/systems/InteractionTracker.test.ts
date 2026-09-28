import { describe, expect, it } from 'vitest';
import type { EventBus, GameEventMap } from '@lexicon/shared-types';
import { InteractionTracker } from './InteractionTracker';
import type { InteractableArea } from './interaction';

type Emitted = { event: keyof GameEventMap; payload: unknown };

function createFakeBus(): { bus: EventBus<GameEventMap>; emitted: Emitted[] } {
  const emitted: Emitted[] = [];
  const bus: EventBus<GameEventMap> = {
    on: () => () => {},
    off: () => {},
    emit: (event, payload) => {
      emitted.push({ event, payload });
    },
  };
  return { bus, emitted };
}

const areas: InteractableArea[] = [
  { id: 'a', x: 0, y: 0, radius: 10 },
  { id: 'b', x: 100, y: 0, radius: 10 },
];

describe('InteractionTracker', () => {
  it('emits nearby once when entering', () => {
    const { bus, emitted } = createFakeBus();
    const tracker = new InteractionTracker(bus);

    tracker.update({ x: 0, y: 0 }, areas);

    expect(emitted).toEqual([{ event: 'interaction:nearby', payload: { interactableId: 'a' } }]);
    expect(tracker.current).toBe('a');
  });

  it('does not re-emit while staying', () => {
    const { bus, emitted } = createFakeBus();
    const tracker = new InteractionTracker(bus);

    tracker.update({ x: 0, y: 0 }, areas);
    tracker.update({ x: 1, y: 0 }, areas);
    tracker.update({ x: 2, y: 0 }, areas);

    expect(emitted).toHaveLength(1);
  });

  it('emits cleared when leaving', () => {
    const { bus, emitted } = createFakeBus();
    const tracker = new InteractionTracker(bus);

    tracker.update({ x: 0, y: 0 }, areas);
    tracker.update({ x: 500, y: 500 }, areas);

    expect(emitted).toEqual([
      { event: 'interaction:nearby', payload: { interactableId: 'a' } },
      { event: 'interaction:cleared', payload: {} },
    ]);
    expect(tracker.current).toBeNull();
  });

  it('switching directly between areas emits nearby with the new id', () => {
    const { bus, emitted } = createFakeBus();
    const tracker = new InteractionTracker(bus);

    tracker.update({ x: 0, y: 0 }, areas);
    tracker.update({ x: 100, y: 0 }, areas);

    expect(emitted).toEqual([
      { event: 'interaction:nearby', payload: { interactableId: 'a' } },
      { event: 'interaction:nearby', payload: { interactableId: 'b' } },
    ]);
    expect(tracker.current).toBe('b');
  });
});
