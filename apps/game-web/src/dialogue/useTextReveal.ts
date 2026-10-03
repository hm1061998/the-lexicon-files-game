import { useCallback, useEffect, useRef, useState } from 'react';
import { TEXT_SPEED_CPS, type TextSpeed } from '../persistence/settingsSchema';
import { revealCount } from './revealCount';

/**
 * Typewriter reveal of one line. `instant` shows it at once. The typing speed is its own choice
 * (Settings) and a reading-speed preference, so reduced motion deliberately does not force it.
 * Starts over whenever `text` changes.
 */
export function useTextReveal(
  text: string,
  speed: TextSpeed,
): { shown: number; done: boolean; finish(): void } {
  const length = text.length;
  const cps = speed === 'instant' ? Infinity : TEXT_SPEED_CPS[speed];
  const [state, setState] = useState({ text, shown: revealCount(0, cps, length) });
  const finishedRef = useRef(false);
  const frameRef = useRef(0);
  // A new line must not flash the previous line's progress before the effect restarts it.
  const shown = state.text === text ? state.shown : revealCount(0, cps, length);

  useEffect(() => {
    finishedRef.current = false;
    setState({ text, shown: revealCount(0, cps, length) });
    if (!Number.isFinite(cps) || length === 0) return undefined;
    const start = performance.now();
    const tick = (now: number) => {
      if (finishedRef.current) return;
      const next = revealCount(now - start, cps, length);
      setState({ text, shown: next });
      if (next < length) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [text, cps, length]);

  const finish = useCallback(() => {
    finishedRef.current = true;
    cancelAnimationFrame(frameRef.current);
    setState({ text, shown: length });
  }, [text, length]);

  return { shown, done: shown >= length, finish };
}
