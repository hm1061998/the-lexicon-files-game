import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { UiStrings } from '@lexicon/shared-types';
import { PageControls } from './PageControls';

const strings = {
  pagePrevious: 'Trang trước',
  pageNext: 'Trang sau',
  pagePosition: 'Trang {current}/{total}',
} as UiStrings;
const render = (index: number, count: number) =>
  renderToString(
    <PageControls
      index={index}
      count={count}
      label="Lời khai"
      strings={strings}
      onChange={() => {}}
    />,
  );

describe('PageControls', () => {
  it('turns pages with two hand-lettered ink buttons that keep their sounds and names', () => {
    const html = render(1, 3);
    expect(html.match(/class="ink-button[^"]*"/g)).toHaveLength(2);
    expect(html).toContain('data-sfx="paper-close"');
    expect(html).toContain('data-sfx="paper-open"');
    expect(html).toContain('aria-label="Lời khai: Trang trước"');
    expect(html).toContain('aria-label="Lời khai: Trang sau"');
  });

  it('shows the position as a polite live label', () => {
    expect(render(0, 3)).toMatch(
      /<span class="page-controls__label" aria-live="polite">Trang 1\/3/,
    );
  });

  it('disables the first and last page', () => {
    expect(render(0, 3).match(/disabled=""/g)).toHaveLength(1);
    expect(render(0, 3)).toMatch(/Trang trước"[^>]*disabled=""|disabled=""[^>]*Trang trước"/);
    expect(render(2, 3)).toMatch(/Trang sau"[^>]*disabled=""|disabled=""[^>]*Trang sau"/);
    expect(render(0, 1).match(/disabled=""/g)).toHaveLength(2);
  });

  it('keeps the page choices out of bare buttons', () => {
    const source = readFileSync(new URL('./ChoicePages.tsx', import.meta.url), 'utf8');
    expect(source).not.toMatch(/<button/);
    expect(source).toContain('InkButton');
  });
});
