import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('shell CSS guards', () => {
  it('does not restyle the investigation definition card buttons', () => {
    const css = read('../vocabulary/vocabulary.css');
    expect(css).not.toMatch(/^\.vocabulary-popover button/m);
    expect(css).toMatch(
      /\.modal-sheet \.vocabulary-popover:not\(\.investigation-vocabulary-popover\) button/,
    );
  });

  it('turns every shell tilt and slide off with the motion switch and the OS preference', () => {
    const css = read('../../../../packages/ui/src/primitives/motion.css');
    const off = css.slice(css.indexOf('Shell paper never tilts'), css.indexOf('@media'));
    const os = css.slice(css.indexOf('@media (prefers-reduced-motion'));
    for (const selector of ['.support-option', '.case-card', '.folder-cover', '.modal-sheet']) {
      expect(off, `motion-off ${selector}`).toContain(selector);
      expect(os, `OS preference ${selector}`).toContain(selector);
    }
  });
});
