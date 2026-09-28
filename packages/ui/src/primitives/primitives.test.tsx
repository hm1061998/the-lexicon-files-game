import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PaperPanel } from './PaperPanel';
import { Keycap } from './Keycap';

describe('PaperPanel', () => {
  it('renders children', () => {
    const html = renderToString(<PaperPanel>hello</PaperPanel>);
    expect(html).toContain('hello');
  });
});

describe('Keycap', () => {
  it('renders key label', () => {
    const html = renderToString(<Keycap>E</Keycap>);
    expect(html).toContain('E');
  });
});
