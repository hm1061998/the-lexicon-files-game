import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { loadUiStrings } from '@lexicon/game-content';
import { TranslationModeControl } from './TranslationModeControl';

describe('TranslationModeControl', () => {
  it('renders the three translation modes as a compact accessible toggle group', () => {
    const html = renderToString(
      <TranslationModeControl
        mode="Learning"
        strings={loadUiStrings('vi')}
        onChange={() => undefined}
      />,
    );

    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Chế độ dịch"');
    expect(html).toContain('aria-pressed="true">Đang học</button>');
    expect(html).toContain('aria-pressed="false">Cơ bản</button>');
    expect(html).toContain('aria-pressed="false">Đắm chìm</button>');
    expect(html).not.toContain('<select');
  });
});
