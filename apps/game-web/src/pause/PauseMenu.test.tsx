import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { loadUiStrings } from '@lexicon/game-content';
import { PauseMenu } from './PauseMenu';
import { createSettingsStore } from '../state/settingsStore';
import { createDefaultSettings } from '../persistence/settingsSchema';
import { SettingsStoreProvider } from '../state/SettingsStoreContext';

describe('PauseMenu settings', () => {
  const strings = loadUiStrings('vi');
  const store = createSettingsStore(createDefaultSettings({ prefersReducedMotion: false }));
  const html = renderToString(
    <SettingsStoreProvider store={store}>
      <PauseMenu strings={strings} onResume={() => undefined} />
    </SettingsStoreProvider>,
  );
  it('renders a labelled volume slider with percentage', () => {
    expect(html).toContain('type="range"');
    expect(html).toContain('min="0"');
    expect(html).toContain('max="100"');
    expect(html).toContain('step="5"');
    expect(html).toContain(strings.settingsVolume);
    expect(html).toMatch(/80(<!-- -->)?%/);
  });
  it('renders subtitles select, reduced motion checkbox and translation mode', () => {
    expect(html).toContain(strings.settingsSubtitlesAuto);
    expect(html).toContain(strings.settingsSubtitlesOn);
    expect(html).toContain(strings.settingsSubtitlesOff);
    expect(html).toContain('type="checkbox"');
    expect(html).toContain(strings.settingsReducedMotion);
    expect(html).toContain(strings.vocabularyModeBeginner);
  });
  it('shows the how-to button only when a handler is given', () => {
    const render = (onOpenHowTo?: () => void) =>
      renderToString(
        <SettingsStoreProvider store={store}>
          <PauseMenu strings={strings} onResume={() => undefined} onOpenHowTo={onOpenHowTo} />
        </SettingsStoreProvider>,
      );
    expect(render(() => undefined)).toContain(strings.pauseHowTo);
    expect(render()).not.toContain(strings.pauseHowTo);
  });

  it('is a paper modal sheet: dialog named by its heading, resume focused, no paper panel', () => {
    const labelled = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('modal-sheet');
    expect(html).toContain('pause-menu');
    expect(html).not.toContain('paper-panel');
    expect(labelled).toBeTruthy();
    expect(html).toMatch(new RegExp(`id="${labelled}"[^>]*>${strings.paused}<`));
    expect(html).toMatch(new RegExp(`autofocus[^>]*>${strings.resume}<`));
  });
});
