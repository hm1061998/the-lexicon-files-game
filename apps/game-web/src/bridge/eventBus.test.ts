import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from './eventBus';

type TestEventMap = {
  ping: { value: number };
};

describe('createEventBus', () => {
  it('delivers payload to subscribers', () => {
    const bus = createEventBus<TestEventMap>();
    const handler = vi.fn();
    bus.on('ping', handler);

    bus.emit('ping', { value: 1 });

    expect(handler).toHaveBeenCalledWith({ value: 1 });
  });

  it('off stops delivery', () => {
    const bus = createEventBus<TestEventMap>();
    const handler = vi.fn();
    bus.on('ping', handler);
    bus.off('ping', handler);

    bus.emit('ping', { value: 1 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('unsubscribe returned by on works', () => {
    const bus = createEventBus<TestEventMap>();
    const handler = vi.fn();
    const unsubscribe = bus.on('ping', handler);
    unsubscribe();

    bus.emit('ping', { value: 1 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('emit with no subscribers is a no-op', () => {
    const bus = createEventBus<TestEventMap>();

    expect(() => bus.emit('ping', { value: 1 })).not.toThrow();
  });

  it('handler added twice is called once', () => {
    const bus = createEventBus<TestEventMap>();
    const handler = vi.fn();
    bus.on('ping', handler);
    bus.on('ping', handler);

    bus.emit('ping', { value: 1 });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
