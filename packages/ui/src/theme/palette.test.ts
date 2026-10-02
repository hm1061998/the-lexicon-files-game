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

  it('defines the four font tokens with system fallbacks', () => {
    for (const [token, family] of [
      ['display', 'Xanh Mono'],
      ['label', 'IBM Plex Mono'],
      ['body', 'Literata'],
      ['hand', 'Patrick Hand'],
    ] as const) {
      expect(css).toMatch(new RegExp(`--lexicon-font-${token}:\\s*"${family}",\\s*[^;]+;`));
    }
    expect(css).toMatch(/--lexicon-font-mono:\s*var\(--lexicon-font-label\);/);
    expect(css).toMatch(/--lexicon-text-min:\s*14px/);
  });

  it('defines soft shadow and focus tokens', () => {
    expect(css).toContain('--lexicon-shadow-paper: 0 3px 6px rgb(42 37 33 / 25%);');
    expect(css).toContain('--lexicon-shadow-lift: 0 5px 6px rgb(42 37 33 / 22%);');
    expect(css).toContain('--lexicon-focus: 3px solid var(--lexicon-dark-red);');
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
  it('ink on the light paper sheet >= 4.5', () => {
    expect(contrastRatio(PALETTE.inkBlack, '#E9DCC2')).toBeGreaterThanOrEqual(4.5);
  });
  it('dark red on paper cream >= 4.5', () => {
    expect(contrastRatio(PALETTE.darkRed, PALETTE.paperCream)).toBeGreaterThanOrEqual(4.5);
  });
  it('investigation red on the light paper sheet >= 3 (display text, 18px+)', () => {
    expect(contrastRatio(PALETTE.investigationRed, '#E9DCC2')).toBeGreaterThanOrEqual(3);
  });
  it('ink on the folder cover manila >= 4.5', () => {
    expect(contrastRatio(PALETTE.inkBlack, '#D2BC8A')).toBeGreaterThanOrEqual(4.5);
  });
  it('cream text on the dark desk >= 4.5', () => {
    expect(contrastRatio('#E9DCC2', '#2E261F')).toBeGreaterThanOrEqual(4.5);
  });
  it('red on paper >= 3 (large text / borders only)', () => {
    expect(contrastRatio('#A4412D', '#D8C5A4')).toBeGreaterThanOrEqual(3);
  });
});
