export type BreathingState = {
  timeMs: number;
  phaseOffset: number;
  walking: boolean;
  inDialogue: boolean;
  reducedMotion: boolean;
};

/** Stable phase distribution so idle cast members do not breathe in sync. */
export function breathingPhaseOffset(characterId: string): number {
  let hash = 0;
  for (const character of characterId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return (hash % 6283) / 1000;
}

/** Visual-only slow breathing. Anchors, feet and collision remain untouched. */
export function breathing(state: BreathingState): { scaleX: 1; scaleY: number } {
  if (state.walking || state.inDialogue || state.reducedMotion) return { scaleX: 1, scaleY: 1 };
  const phase = (state.timeMs / 1800) * Math.PI * 2 + state.phaseOffset;
  return { scaleX: 1, scaleY: 1 + Math.sin(phase) * 0.008 };
}
