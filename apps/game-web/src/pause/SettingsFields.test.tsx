import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { loadUiStrings } from '@lexicon/game-content';
import { SettingsFields } from './SettingsFields';
import { createSettingsStore } from '../state/settingsStore';
import { createDefaultSettings } from '../persistence/settingsSchema';
import { SettingsStoreProvider } from '../state/SettingsStoreContext';

describe('SettingsFields', () => {
  const strings = loadUiStrings('vi');
  const store = createSettingsStore(createDefaultSettings({ prefersReducedMotion: false }));
  const html = renderToString(
    <SettingsStoreProvider store={store}>
      <SettingsFields strings={strings} />
    </SettingsStoreProvider>,
  );
  it('renders every shared setting control', () => {
    expect(html).toContain('type="range"');
    expect(html).toContain(strings.settingsVolume);
    expect(html).toContain(strings.settingsSubtitlesAuto);
    expect(html).toContain('type="checkbox"');
    expect(html).toContain(strings.settingsReducedMotion);
    expect(html).toContain(strings.vocabularyModeBeginner);
  });
  it('offers text speed and UI sounds', () => {
    expect(html).toContain(strings.settingsTextSpeed);
    expect(html).toContain(strings.textSpeedInstant);
    expect(html).toContain(strings.textSpeedNormal);
    expect(html).toContain(strings.textSpeedFast);
    expect(html).toContain(strings.settingsUiSounds);
  });
  it('has no resume button', () => {
    expect(html).not.toContain(strings.resume);
  });
});
