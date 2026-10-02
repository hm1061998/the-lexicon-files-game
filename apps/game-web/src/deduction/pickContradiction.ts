type AvailableContradiction = { readonly id: string; readonly factIds: readonly string[] };

/**
 * One "check" button serves every open contradiction: submit the one whose fact pair is the
 * selection. A pair that matches none goes to the first open contradiction, which answers
 * with the normal mismatch feedback and changes nothing.
 */
export function pickContradiction(
  available: readonly AvailableContradiction[],
  selectedFactIds: readonly string[],
): AvailableContradiction | undefined {
  const matching = available.find(
    ({ factIds }) =>
      factIds.length === selectedFactIds.length &&
      factIds.every((id) => selectedFactIds.includes(id)),
  );
  return matching ?? available[0];
}
