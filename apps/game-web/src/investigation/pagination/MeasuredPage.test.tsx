import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { loadUiStrings } from '@lexicon/game-content';
import { MeasuredPage } from './MeasuredPage';
it('measures with passive rendering and never mounts a hidden live page', () => {
  const live = vi.fn(() => <button>live word</button>);
  const html = renderToStaticMarkup(<MeasuredPage blocks={[{kind:'text',id:'a',text:'word',contextId:'source',spans:[]}]} renderFragment={live} renderMeasurement={()=><p data-measure-text>word</p>} strings={loadUiStrings('vi')} controlsLabel="Reader"/>);
  expect(live).not.toHaveBeenCalled();
  expect(html).not.toContain('live word');
  expect(html).toContain('aria-hidden="true"');
});
