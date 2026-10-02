import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');
const motion = read('../../../../packages/ui/src/primitives/motion.css');
const off = motion.slice(motion.indexOf('Shell paper never tilts'), motion.indexOf('@media'));
const os = motion.slice(motion.indexOf('@media (prefers-reduced-motion'));

describe('dialogue CSS guards', () => {
  it('turns the choice notes flat under the motion switch and the OS preference', () => {
    expect(off).toContain('.dialogue-choice');
    expect(os).toContain('.dialogue-choice');
  });

  it('does not box vocabulary words or the definition card through a bare panel button rule', () => {
    expect(read('./dialogue.css')).not.toMatch(/^\.dialogue-panel button/m);
  });

  it('keeps the definition card in the flow inside the dialogue sheet', () => {
    const css = read('../vocabulary/vocabulary.css');
    expect(css).toMatch(
      /\.dialogue-panel \.vocabulary-popover:not\(\.investigation-vocabulary-popover\)\s*\{[^}]*position:\s*static/,
    );
    expect(css).not.toMatch(/^\.vocabulary-popover button/m);
  });
});
