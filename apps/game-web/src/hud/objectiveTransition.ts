export type ObjectiveLine = { id: string; text: string };
export type ObjectiveDisplay = { current: ObjectiveLine | null; leaving: ObjectiveLine | null };

/** Pure transition behind the "struck through, then new card" objective change. */
export function nextObjectiveDisplay(
  prev: ObjectiveDisplay,
  active: ObjectiveLine | null,
): ObjectiveDisplay {
  if ((prev.current?.id ?? null) === (active?.id ?? null)) return prev;
  return { current: active, leaving: prev.current };
}

export function clearLeaving(display: ObjectiveDisplay): ObjectiveDisplay {
  return { current: display.current, leaving: null };
}
