import { afterEach, describe, expect, it, vi } from 'vitest';

const volume = vi.hoisted(() => vi.fn());
vi.mock('howler', () => ({ Howler: { volume } }));

import { applyMasterVolume, masterVolumeGain } from './useMasterVolume';

afterEach(() => volume.mockClear());

describe('masterVolumeGain', () => {
  it.each([
    [0, 0],
    [50, 0.5],
    [100, 1],
    [140, 1],
    [-10, 0],
  ])('maps %d to %d', (input, expected) => {
    expect(masterVolumeGain(input)).toBe(expected);
  });
});

describe('applyMasterVolume', () => {
  it('sets the Howler master volume from the 0-100 setting', () => {
    applyMasterVolume(30);
    expect(volume.mock.calls).toEqual([[0.3]]);
  });

  it('is idempotent, so the StrictMode double effect run leaves the same volume', () => {
    // React StrictMode runs the effect twice on mount; both runs must set the same gain.
    applyMasterVolume(30);
    applyMasterVolume(30);
    expect(volume.mock.calls).toEqual([[0.3], [0.3]]);
  });
});
