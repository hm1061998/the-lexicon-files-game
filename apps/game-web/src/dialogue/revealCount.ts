/** How many characters of a line are visible `elapsedMs` after it started appearing. */
export function revealCount(elapsedMs: number, charsPerSecond: number, length: number): number {
  if (!Number.isFinite(charsPerSecond)) return length;
  if (elapsedMs <= 0) return 0;
  return Math.min(length, Math.floor((elapsedMs * charsPerSecond) / 1000));
}
