import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FONT_FAMILIES } from './fonts';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fonts.css'), 'utf8');
const SUBSETS = ['latin', 'latin-ext', 'vietnamese'];
const FACES: readonly [string, number][] = [
  ['xanh-mono', 400],
  ['ibm-plex-mono', 500],
  ['literata', 400],
  ['literata', 600],
  ['patrick-hand', 400],
];

describe('bundled fonts', () => {
  const imports = [...css.matchAll(/^@import '(@fontsource\/[^']+)';$/gm)].map((m) => m[1]);

  it('imports exactly the three subsets of each required face', () => {
    const expected = FACES.flatMap(([family, weight]) =>
      SUBSETS.map((subset) => `@fontsource/${family}/${subset}-${weight}.css`),
    );
    expect(imports).toHaveLength(15);
    expect([...imports].sort()).toEqual([...expected].sort());
  });

  it('imports no other subset', () => {
    for (const path of imports) expect(path).toMatch(/\/(latin|latin-ext|vietnamese)-\d{3}\.css$/);
  });

  it('names the four families the tokens use', () => {
    expect(FONT_FAMILIES).toEqual({
      display: 'Xanh Mono',
      label: 'IBM Plex Mono',
      body: 'Literata',
      hand: 'Patrick Hand',
    });
  });
});
