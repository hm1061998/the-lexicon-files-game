import { expect, it } from 'vitest';
import { createGameInputGate } from './gameInputGate';
it('suppresses held native repeats after unlock until keyup', () => {
  const gate = createGameInputGate();
  gate.down(39, false, false);
  gate.suppressHeld();
  gate.down(39, true, false);
  expect(gate.allows(39)).toBe(false);
  gate.up(39);
  gate.down(39, false, false);
  expect(gate.allows(39)).toBe(true);
});
it('suppresses presses made in a form and recovers a fresh press after blur', () => {
  const gate = createGameInputGate();
  gate.down(69, false, true);
  expect(gate.allows(69)).toBe(false);
  gate.blur();
  gate.down(69, true, false);
  expect(gate.allows(69)).toBe(false);
  gate.blur();
  gate.down(69, false, false);
  expect(gate.allows(69)).toBe(true);
});
