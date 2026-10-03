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

  it('keeps the band a dark gradient strip that lets the world show above it', () => {
    const css = read('./dialogue.css');
    const panel = css.slice(
      css.indexOf('.dialogue-panel {'),
      css.indexOf('}', css.indexOf('.dialogue-panel {')),
    );
    expect(panel).toContain('linear-gradient');
    expect(panel).not.toMatch(/overflow(-y)?:\s*auto/);
  });

  it('swaps the choices for the definition card and splits the sheet on short wide screens', () => {
    const css = read('./dialogue.css');
    expect(css).toMatch(
      /\.dialogue-panel:has\(\.vocabulary-popover\) \.dialogue-choices\s*\{[^}]*display:\s*none/,
    );
    expect(css).toMatch(/@media \(max-height: 500px\) and \(min-width: 700px\)/);
  });
});
