import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForFonts } from './fontReady';

afterEach(() => vi.useRealTimers());

describe('waitForFonts', () => {
  it('resolves loaded when every font loads', async () => {
    const load = vi.fn(async () => []);
    await expect(waitForFonts({ load }, ['500 20px "A"', '400 16px "B"'], 3000)).resolves.toBe(
      'loaded',
    );
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('resolves timeout when loading never finishes', async () => {
    vi.useFakeTimers();
    const load = vi.fn(() => new Promise<never>(() => undefined));
    const result = waitForFonts({ load }, ['500 20px "A"'], 3000);
    await vi.advanceTimersByTimeAsync(3000);
    await expect(result).resolves.toBe('timeout');
  });

  it('resolves timeout without throwing when loading rejects', async () => {
    const load = vi.fn(async () => {
      throw new Error('network');
    });
    await expect(waitForFonts({ load }, ['500 20px "A"'], 3000)).resolves.toBe('timeout');
  });
});
