import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { loadUiStrings } from '@lexicon/game-content';
import { TitleScreen } from './TitleScreen';
import { NewCaseConfirm } from './NewCaseConfirm';
import { selectTitleActions } from './titleModel';

const strings = loadUiStrings('vi');
const noop = () => undefined;
const render = (save: 'loaded' | 'missing', withChangeCase = false) =>
  renderToString(
    <TitleScreen
      strings={strings}
      caseTitle="The Missing Report"
      actions={selectTitleActions({ save, settingsStatus: 'loaded' })}
      onContinue={noop}
      onNewCase={noop}
      onHowTo={noop}
      onSettings={noop}
      {...(withChangeCase ? { onChangeCase: noop } : {})}
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

describe('TitleScreen folder cover', () => {
  it('is a folder cover on the desk, not a paper panel', () => {
    const html = render('loaded');
    expect(html).toContain('title-screen');
    expect(html).toContain('title-card');
    expect(html).toContain('folder-cover');
    expect(html).toContain('desk-backdrop');
    expect(html).not.toContain('paper-panel');
  });

  it('names the chosen case on the cover label', () => {
    expect(render('missing')).toContain('The Missing Report');
  });

  it('lists the tabs in order and marks the primary one', () => {
    const html = render('loaded', true);
    const order = [
      strings.titleContinue,
      strings.titleNewCase,
      strings.titleHowTo,
      strings.titleSettings,
      strings.titleChangeCase,
    ].map((label) => html.indexOf(`>${label}<`));
    expect(order.every((i) => i > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    // The primary tab is the first tab with a save, and takes focus.
    expect(html).toMatch(
      /folder-tab--primary[^>]*autofocus[^>]*>Tiếp tục điều tra|autofocus[^>]*folder-tab--primary[^>]*>Tiếp tục điều tra/,
    );
  });

  it('makes New case the primary tab when nothing is saved and omits Change case without a handler', () => {
    const html = render('missing');
    expect(html).toMatch(
      /folder-tab--primary[^>]*>Vụ án mới|autofocus[^>]*folder-tab--primary[^>]*>Vụ án mới/,
    );
    expect(html).not.toContain(`>${strings.titleChangeCase}<`);
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
