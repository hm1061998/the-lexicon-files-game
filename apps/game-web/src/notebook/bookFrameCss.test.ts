import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');
const motion = read('../../../../packages/ui/src/primitives/motion.css');
const off = motion.slice(motion.indexOf('Shell paper never tilts'), motion.indexOf('@media'));
const os = motion.slice(motion.indexOf('@media (prefers-reduced-motion'));

describe('notebook book frame CSS guards', () => {
  it('turns the opening slide and the leaves flat under the motion switch and the OS preference', () => {
    for (const part of [off, os]) {
      expect(part).toContain('.notebook-overlay');
      expect(part).toContain('.book-frame');
      expect(part).toContain('.book-leaf');
    }
  });

  it('opens the book in 220ms', () => {
    expect(read('./book-frame.css')).toMatch(/animation:\s*book-open 220ms/);
  });

  it('never scrolls a leaf: the page turn engine paginates instead', () => {
    const css = read('./book-frame.css') + read('./notebook.css');
    expect(css).not.toMatch(/overflow(-y)?:\s*(auto|scroll)/);
  });

  it('keeps no reference to the removed PaperPanel', () => {
    expect(read('./notebook.css')).not.toContain('.paper-panel');
  });

  it('lets a horizontal touch reach the page swipe instead of panning', () => {
    expect(read('./notebook.css')).toMatch(/\.spread-reader\s*\{[^}]*touch-action:\s*pan-y/);
  });
});
