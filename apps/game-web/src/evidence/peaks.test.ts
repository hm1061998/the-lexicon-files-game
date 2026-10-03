import { describe, expect, it } from 'vitest';
import { parsePeaks } from './peaks';

const bars = Array.from({ length: 64 }, (_, i) => i / 64);

describe('parsePeaks', () => {
  it('accepts a version 1 file with 64 columns in 0..1', () => {
    expect(parsePeaks({ version: 1, bars })).toEqual(bars);
  });

  it('rejects anything else so the waveform is simply hidden', () => {
    expect(parsePeaks(null)).toBeNull();
    expect(parsePeaks({ version: 2, bars })).toBeNull();
    expect(parsePeaks({ version: 1, bars: bars.slice(1) })).toBeNull();
    expect(parsePeaks({ version: 1, bars: bars.map((v, i) => (i === 3 ? 1.5 : v)) })).toBeNull();
    expect(parsePeaks({ version: 1, bars: bars.map((v, i) => (i === 3 ? 'x' : v)) })).toBeNull();
    expect(parsePeaks('nope')).toBeNull();
  });
});
