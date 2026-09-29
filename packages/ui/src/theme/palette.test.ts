import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { PALETTE } from './palette';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'palette.css'), 'utf8');

const OVERRIDES: Record<string, string> = {
  investigationRed: '--lexicon-investigation-red',
  paperCream: '--lexicon-paper',
  lightBeige: '--lexicon-beige',
  inkBlack: '--lexicon-ink',
  darkBrown: '--lexicon-border',
};

function cssVarName(key: string): string {
  return OVERRIDES[key] ?? `--lexicon-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
}

describe('PALETTE <-> palette.css', () => {
  for (const [key, hex] of Object.entries(PALETTE)) {
    it(`${key} has a matching CSS variable`, () => {
      const name = cssVarName(key);
      const match = new RegExp(name + ': *(#[0-9a-fA-F]{6})').exec(css);
      expect(match, `missing ${name}`).not.toBeNull();
      expect(match?.[1]?.toLowerCase()).toBe(hex.toLowerCase());
    });
  }

  it('defines typography tokens', () => {
    expect(css).toContain('--lexicon-font-body: Cambria, "Times New Roman", Georgia, serif;');
    expect(css).toContain('--lexicon-font-mono: "Courier New", ui-monospace, monospace;');
    expect(css).toMatch(/--lexicon-text-min:\s*14px/);
  });
});

describe('contrastRatio', () => {
  it('black on white is ~21', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 0);
  });
  it('ink on paper >= 4.5', () => {
    expect(contrastRatio('#2A2521', '#D8C5A4')).toBeGreaterThanOrEqual(4.5);
  });
  it('ink on beige >= 4.5', () => {
    expect(contrastRatio('#2A2521', '#CDBA97')).toBeGreaterThanOrEqual(4.5);
  });
  it('paper on dark brown >= 4.5', () => {
    expect(contrastRatio('#D8C5A4', '#3E342B')).toBeGreaterThanOrEqual(4.5);
  });
  it('red on paper >= 3 (large text / borders only)', () => {
    expect(contrastRatio('#A4412D', '#D8C5A4')).toBeGreaterThanOrEqual(3);
  });
  it('red heading on paper >= 3 at large bold size (HUD objective heading, 19px bold)', () => {
    expect(contrastRatio('#A4412D', '#D8C5A4')).toBeGreaterThanOrEqual(3);
  });
  it('ink on beige for hovered form controls >= 4.5', () => {
    expect(contrastRatio('#2A2521', '#CDBA97')).toBeGreaterThanOrEqual(4.5);
  });
  it('focus ring ink against paper >= 3 (non-text UI component)', () => {
    expect(contrastRatio('#2A2521', '#D8C5A4')).toBeGreaterThanOrEqual(3);
  });
});
