import { describe, expect, it } from 'vitest';
import { startProgressLoop } from './progressLoop';

function fakeFrames() {
  const queue = new Map<number, () => void>();
  let next = 1;
  return {
    request: (callback: () => void) => {
      queue.set(next, callback);
      return next++;
    },
    cancel: (id: number) => queue.delete(id),
    pending: () => queue.size,
    flush() {
      const callbacks = [...queue.values()];
      queue.clear();
      callbacks.forEach((callback) => callback());
    },
  };
}

describe('startProgressLoop', () => {
  it('publishes the progress on every frame while it runs', () => {
    const frames = fakeFrames();
    let value = 0;
    const seen: number[] = [];
    startProgressLoop(
      () => value,
      (v) => seen.push(v),
      frames.request,
      frames.cancel,
    );
    value = 0.25;
    frames.flush();
    value = 0.5;
    frames.flush();
    expect(seen).toEqual([0.25, 0.5]);
  });

  it('stops cleanly: no frame stays queued and nothing more is published', () => {
    const frames = fakeFrames();
    const seen: number[] = [];
    const stop = startProgressLoop(
      () => 0.3,
      (v) => seen.push(v),
      frames.request,
      frames.cancel,
    );
    frames.flush();
    stop();
    expect(frames.pending()).toBe(0);
    frames.flush();
    expect(seen).toEqual([0.3]);
  });

  it('does not repeat an unchanged value', () => {
    const frames = fakeFrames();
    const seen: number[] = [];
    startProgressLoop(
      () => 0.5,
      (v) => seen.push(v),
      frames.request,
      frames.cancel,
    );
    frames.flush();
    frames.flush();
    frames.flush();
    expect(seen).toEqual([0.5]);
  });
});
