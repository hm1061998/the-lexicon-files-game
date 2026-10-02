import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');
const motion = read('../../../../packages/ui/src/primitives/motion.css');
const off = motion.slice(motion.indexOf('Shell paper never tilts'), motion.indexOf('@media'));
const os = motion.slice(motion.indexOf('@media (prefers-reduced-motion'));

describe('evidence CSS guards', () => {
  it('turns the pinned photo flat under the motion switch and the OS preference', () => {
    expect(off).toContain('.evidence-photo');
    expect(os).toContain('.evidence-photo');
  });

  it('uses ink red only for the evidence label (AGENTS.md §6)', () => {
    const css = read('./evidence.css');
    const redRules = css
      .split('}')
      .filter((rule) => /#a4412d|#743026|--lexicon-focus|investigation-red|dark-red/i.test(rule))
      .map((rule) => rule.split('{')[0]!.trim());
    expect(redRules).toEqual(['.evidence-category']);
  });

  it('does not restyle every control in the evidence modal with a bare rule', () => {
    expect(read('./evidence.css')).not.toMatch(/^\.evidence-modal button/m);
  });

  it('draws the evidence label in dark red, which reads on paper at small sizes', () => {
    const css = read('./evidence.css');
    const rule = css.slice(
      css.indexOf('.evidence-category {'),
      css.indexOf('}', css.indexOf('.evidence-category {')),
    );
    expect(rule).toContain('var(--lexicon-dark-red)');
  });
});
