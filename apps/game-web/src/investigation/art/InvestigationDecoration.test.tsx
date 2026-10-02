import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { InvestigationDecoration } from './InvestigationDecoration';
it('uses passive original SVG artwork with no embedded scripts or external resources', () => {
  for (const name of [
    'pushpin-brass',
    'pushpin-dark',
    'binder-ring',
    'notebook-corner',
    'paper-clip',
  ]) {
    const svg = readFileSync(new URL(`./${name}.svg`, import.meta.url), 'utf8');
    expect(svg).toContain('viewBox=');
    expect(svg).toContain('<path');
    expect(svg).not.toMatch(/<script|(?:href|src)=["']https?:|<foreignObject/u);
  }
  const html = renderToStaticMarkup(
    <>
      <InvestigationDecoration kind="ring" />
      <InvestigationDecoration kind="ring" />
      <InvestigationDecoration kind="pushpin" />
    </>,
  );
  expect(html.match(/aria-hidden="true"/g)).toHaveLength(3);
  expect(html).not.toContain('tabindex');
  expect(html).toContain('alt=""');
});
