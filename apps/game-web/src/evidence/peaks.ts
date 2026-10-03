import { useEffect, useState } from 'react';

const BARS = 64;

/** A `.peaks.json` file as the recorder uses it, or null when it is missing or malformed. */
export function parsePeaks(raw: unknown): readonly number[] | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { version, bars } = raw as { version?: unknown; bars?: unknown };
  if (version !== 1 || !Array.isArray(bars) || bars.length !== BARS) return null;
  return bars.every((v) => typeof v === 'number' && v >= 0 && v <= 1) ? (bars as number[]) : null;
}

/** Loads `<audio>.peaks.json` once per recording; a failure just means no waveform. */
export function usePeaks(audioAsset: string): readonly number[] | null {
  const [peaks, setPeaks] = useState<readonly number[] | null>(null);
  useEffect(() => {
    let active = true;
    setPeaks(null);
    fetch(`${audioAsset}.peaks.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((json: unknown) => {
        if (active) setPeaks(parsePeaks(json));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [audioAsset]);
  return peaks;
}
