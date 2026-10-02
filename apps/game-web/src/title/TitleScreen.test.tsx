import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { loadUiStrings } from '@lexicon/game-content';
import { TitleScreen } from './TitleScreen';
import { NewCaseConfirm } from './NewCaseConfirm';
import { selectTitleActions } from './titleModel';

const strings = loadUiStrings('vi');
const noop = () => undefined;
const render = (save: 'loaded' | 'missing') =>
  renderToString(
    <TitleScreen
      strings={strings}
      actions={selectTitleActions({ save, settingsStatus: 'loaded' })}
      onContinue={noop}
      onNewCase={noop}
      onHowTo={noop}
      onSettings={noop}
    />,
  );

describe('TitleScreen', () => {
  it('shows the game name, tagline and every action with a saved case', () => {
    const html = render('loaded');
    for (const text of [
      strings.titleGame,
      strings.titleTagline,
      strings.titleContinue,
      strings.titleNewCase,
      strings.titleHowTo,
      strings.titleSettings,
    ])
      expect(html).toContain(text);
    expect(html.indexOf(strings.titleContinue)).toBeLessThan(html.indexOf(strings.titleNewCase));
  });
  it('omits Continue when there is no loaded save', () => {
    const html = render('missing');
    expect(html).not.toContain(strings.titleContinue);
    expect(html).toContain(strings.titleNewCase);
  });
});

describe('NewCaseConfirm', () => {
  it('explains that vocabulary progress is kept and offers cancel first', () => {
    const html = renderToString(
      <NewCaseConfirm strings={strings} onAccept={noop} onCancel={noop} />,
    );
    expect(html).toContain(strings.newCaseConfirmBody);
    expect(html.indexOf(`>${strings.cancel}<`)).toBeGreaterThan(-1);
    expect(html.indexOf(`>${strings.cancel}<`)).toBeLessThan(
      html.indexOf(`>${strings.newCaseConfirmAccept}<`),
    );
  });
});
