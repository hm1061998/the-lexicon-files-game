import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { loadUiStrings } from '@lexicon/game-content';
import { SettingsPage } from './SettingsPage';
import { SaveRecoveryScreen } from './SaveRecoveryScreen';
import { HowToInvestigate } from '../onboarding/HowToInvestigate';
import { SettingsStoreProvider } from '../state/SettingsStoreContext';
import { createSettingsStore } from '../state/settingsStore';
import { createDefaultSettings } from '../persistence/settingsSchema';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';

const strings = loadUiStrings('vi');
const noop = () => undefined;
const settingsStore = createSettingsStore(createDefaultSettings({ prefersReducedMotion: false }));

describe('SettingsPage', () => {
  const html = renderToString(
    <SettingsStoreProvider store={settingsStore}>
      <SettingsPage strings={strings} caseTitle="The Missing Report" onBack={noop} />
    </SettingsStoreProvider>,
  );

  it('is a page inside the folder cover with the settings controls', () => {
    expect(html).toContain('folder-cover');
    expect(html).toMatch(new RegExp(`<h2[^>]*>${strings.titleSettings}</h2>`));
    expect(html).toContain(strings.settingsReducedMotion);
    expect(html).not.toContain('paper-panel');
  });

  it('has a Back tab that takes focus', () => {
    expect(html).toMatch(/autofocus[^>]*>Quay lại</);
  });
});

describe('SaveRecoveryScreen', () => {
  const html = renderToString(
    <SaveRecoveryScreen
      strings={strings}
      reason="Bad record: v9"
      onConfirm={noop}
      onCancel={noop}
    />,
  );

  it('is an alert on the desk that shows the readable reason', () => {
    expect(html).toContain('role="alert"');
    expect(html).toContain('desk-backdrop');
    expect(html).toContain(strings.saveRecoveryTitle);
    expect(html).toContain(strings.saveRecoveryBody);
    expect(html).toContain('Bad record: v9');
  });

  it('offers the safe create-fresh and cancel buttons', () => {
    expect(html).toContain(`>${strings.createFreshSave}<`);
    expect(html).toContain(`>${strings.cancel}<`);
    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html).toMatch(/autofocus[^>]*>Tạo/);
  });
});

describe('HowToInvestigate', () => {
  const learning = { strings } as unknown as InvestigationLearningProps;
  const html = renderToString(<HowToInvestigate learning={learning} onClose={noop} />);

  it('is a modal sheet dialog named by its title with all four sections', () => {
    expect(html).toContain('modal-sheet');
    expect(html).toContain('role="dialog"');
    expect(html).toContain(strings.howToTitle);
    for (const heading of [
      strings.howToControlsHeading,
      strings.howToLoopHeading,
      strings.howToWordsHeading,
      strings.howToPrinciplesHeading,
    ])
      expect(html).toContain(heading);
    expect(html).not.toContain('paper-panel');
  });

  it('closes through the Back button, which takes focus', () => {
    expect(html).toMatch(/autofocus[^>]*>Quay lại</);
  });
});
