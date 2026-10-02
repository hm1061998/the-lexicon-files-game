import { expect, it, vi } from 'vitest';
import { createPageFlipAdapter } from './pageFlipAdapter';

it('completes turns once and cancels callbacks on close and rapid navigation', () => {
  vi.useFakeTimers();
  const child = { style: {}, append() {} };
  vi.stubGlobal('document', { createElement: () => ({ ...child }) });
  const host = {
    style: {},
    animate: () => ({ cancel() {} }),
    clientWidth: 400,
    clientHeight: 500,
    append() {},
    replaceChildren() {},
  } as unknown as HTMLElement;
  const done = vi.fn();
  const adapter = createPageFlipAdapter(host, false);
  adapter.turn('forward', done);
  adapter.turn('backward', done);
  vi.advanceTimersByTime(550);
  expect(done).toHaveBeenCalledTimes(1);
  adapter.turn('forward', done);
  adapter.destroy();
  vi.runAllTimers();
  expect(done).toHaveBeenCalledTimes(1);
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it('uses a direct turn for reduced motion', () => {
  const done = vi.fn();
  const host = { style: {}, replaceChildren() {} } as unknown as HTMLElement;
  createPageFlipAdapter(host, true).turn('forward', done);
  expect(done).toHaveBeenCalledOnce();
});
