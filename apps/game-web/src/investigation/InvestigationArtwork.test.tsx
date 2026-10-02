import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InvestigationArtwork } from './InvestigationArtwork';
describe('investigation artwork fallback', () => {
  it('keeps initials out of a transparent character portrait when artwork is available', () => {
    const html = renderToStaticMarkup(
      <InvestigationArtwork url="/assets/portrait.png" name="Anna Reed" portrait />,
    );
    expect(html).toContain('<img');
    expect(html).not.toContain('artwork-fallback');
  });
  it('provides initials if no artwork is available', () => {
    const html = renderToStaticMarkup(<InvestigationArtwork name="Anna Reed" portrait />);
    expect(html).toContain('artwork-fallback');
    expect(html).toContain('AR');
    expect(html).not.toContain('<img');
  });
});
