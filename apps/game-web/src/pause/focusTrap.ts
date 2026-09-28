export function getFocusTrapTarget<T>(
  focusables: readonly T[],
  active: T | null,
  shift: boolean,
): T | null {
  if (focusables.length === 0) {
    return null;
  }
  const first = focusables[0] as T;
  const last = focusables[focusables.length - 1] as T;
  const activeIndex = active === null ? -1 : focusables.indexOf(active);

  if (activeIndex === -1) {
    return first;
  }
  if (shift) {
    return activeIndex === 0 ? last : null;
  }
  return activeIndex === focusables.length - 1 ? first : null;
}
