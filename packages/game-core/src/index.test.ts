import { describe, expect, it } from 'vitest';
import * as mod from './index';

const FORBIDDEN_IMPORT = /from\s+['"](react|react-dom|phaser|zustand|idb)(\/[^'"]*)?['"]/;

const sources = import.meta.glob<string>(['./**/*.ts', '!./**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('package entry', () => {
  it('loads as a module', () => {
    expect(mod).toBeTypeOf('object');
  });

  it('stays framework-free (no React, Phaser, Zustand, IndexedDB imports)', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(0);
    const offenders = Object.entries(sources)
      .filter(([, code]) => FORBIDDEN_IMPORT.test(code))
      .map(([file]) => file);
    expect(offenders).toEqual([]);
  });
});
