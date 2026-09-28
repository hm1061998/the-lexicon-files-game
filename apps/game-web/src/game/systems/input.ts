export type MovementKeys = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export function resolveInputVector(keys: MovementKeys, typing: boolean): { x: number; y: number } {
  if (typing) {
    return { x: 0, y: 0 };
  }

  let x = 0;
  let y = 0;

  if (keys.left) x -= 1;
  if (keys.right) x += 1;
  if (keys.up) y -= 1;
  if (keys.down) y += 1;

  if (x === 0 && y === 0) {
    return { x: 0, y: 0 };
  }

  const length = Math.hypot(x, y);
  return { x: x / length, y: y / length };
}

export function isTypingTarget(el: Element | null): boolean {
  if (el === null) {
    return false;
  }

  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    return true;
  }

  return (el as unknown as HTMLElement).isContentEditable === true;
}
