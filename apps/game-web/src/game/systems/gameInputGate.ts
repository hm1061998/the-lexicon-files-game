/** Scene-local physical-key lifetime, independent of Phaser's reset/repeat state. */
export function createGameInputGate() {
  const pressed = new Set<number>(),
    suppressed = new Set<number>();
  const suppressHeld = () => pressed.forEach((code) => suppressed.add(code));
  return {
    down(code: number, repeat: boolean, locked: boolean) {
      if (!repeat && !pressed.has(code)) suppressed.delete(code);
      pressed.add(code);
      if (locked) suppressed.add(code);
    },
    up(code: number) {
      pressed.delete(code);
      suppressed.delete(code);
    },
    suppressHeld,
    blur() {
      suppressHeld();
      pressed.clear();
    },
    allows: (code: number) => !suppressed.has(code),
  };
}
