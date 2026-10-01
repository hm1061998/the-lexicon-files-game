export type MovementKeys = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export function mergeMovementKeys(wasd: MovementKeys, arrows: MovementKeys): MovementKeys {
  return {
    up: wasd.up || arrows.up,
    down: wasd.down || arrows.down,
    left: wasd.left || arrows.left,
    right: wasd.right || arrows.right,
  };
}

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

const TEXT_INPUT_TYPES = new Set([
  '',
  'text',
  'search',
  'email',
  'url',
  'tel',
  'password',
  'number',
]);

export function isTypingTarget(el: Element | null): boolean {
  if (el === null) {
    return false;
  }

  if (el.tagName === 'TEXTAREA') {
    return true;
  }

  if (el.tagName === 'INPUT') {
    const type = ((el as HTMLInputElement).type ?? '').toLowerCase();
    return TEXT_INPUT_TYPES.has(type);
  }

  return (el as unknown as HTMLElement).isContentEditable === true;
}
