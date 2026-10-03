import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./gameShell.css', import.meta.url), 'utf8');

describe('game shell CSS', () => {
  it('makes no text selectable except in real text fields', () => {
    expect(css).toMatch(/html,\s*body\s*\{[^}]*user-select:\s*none/);
    expect(css).toMatch(/input,\s*textarea,[^{]*\{[^}]*user-select:\s*text/);
  });
});
