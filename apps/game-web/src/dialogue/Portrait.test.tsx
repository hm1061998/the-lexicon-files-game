import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Portrait, initialsOf } from './Portrait';

describe('initialsOf', () => {
  it('takes at most two letters from the name', () => {
    expect(initialsOf('Anna Reed')).toBe('AR');
    expect(initialsOf('Leo')).toBe('L');
    expect(initialsOf('  mary  jane  watson ')).toBe('MJ');
    expect(initialsOf('')).toBe('?');
  });
});

describe('Portrait', () => {
  it('shows a decorative photo in a pinned frame when it has a source', () => {
    const html = renderToString(
      <Portrait npcName="Anna Reed" src="/assets/portraits/anna.png" reducedMotion={false} />,
    );
    expect(html).toContain('portrait');
    expect(html).toContain('<img');
    expect(html).toContain('src="/assets/portraits/anna.png"');
    expect(html).toContain('alt=""');
    expect(html).not.toContain('portrait--initials');
  });

  it('falls back to an initials card without a source', () => {
    const html = renderToString(<Portrait npcName="Anna Reed" reducedMotion={false} />);
    expect(html).toContain('portrait--initials');
    expect(html).toContain('AR');
    expect(html).not.toContain('<img');
  });
});
