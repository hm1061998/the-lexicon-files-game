import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');
const css = read('./deduction.css');
const motion = read('../../../../packages/ui/src/primitives/motion.css');
const off = motion.slice(motion.indexOf('Shell paper never tilts'), motion.indexOf('@media'));
const os = motion.slice(motion.indexOf('@media (prefers-reduced-motion'));

describe('deduction board CSS guards', () => {
  it('levels pinned cards, tabs and the board under the motion switch and the OS preference', () => {
    for (const part of [off, os]) {
      expect(part).toContain('.pinned-card');
      expect(part).toContain('.clues-sticky');
      expect(part).toContain('.deduction-board');
    }
  });

  it('never tilts the surface that holds the connection lines, only the cards', () => {
    for (const selector of ['.deduction-surface', '.clues-cards', '.deduction-connections']) {
      const rule = new RegExp(
        String.raw`${selector.replace('.', String.raw`\.`)}\s*\{[^}]*\}`,
        'g',
      );
      for (const block of css.match(rule) ?? []) expect(block).not.toMatch(/rotate|transform/);
    }
  });

  it('has no bare button rule left: every button is an ink, paper or pinned button', () => {
    expect(css).not.toMatch(/\.deduction-board button/);
    expect(css).not.toMatch(/\.deduction-face-tabs\s+button/);
  });

  it('keeps red out of the board chrome (pins, the timeline string and a selection use it)', () => {
    const hits = css.match(/#a4412d|#743026|investigation-red|dark-red/gi) ?? [];
    expect(hits.length).toBeLessThanOrEqual(14);
  });

  it('keeps a mouse drag on the swipe row from selecting text', () => {
    expect(css).toMatch(/\.swipe-row\s*\{[^}]*user-select:\s*none/);
  });
});
