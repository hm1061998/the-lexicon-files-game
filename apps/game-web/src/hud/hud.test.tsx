import { renderToString } from 'react-dom/server';
import { createStore } from 'zustand/vanilla';
import { describe, expect, it } from 'vitest';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { GameStoreProvider } from '../state/GameStoreContext';
import { createGameStore, type GameStoreState } from '../state/gameStore';
import { ObjectivePanel } from './ObjectivePanel';
import { CaseProgress } from './CaseProgress';
import { InteractionPrompt } from './InteractionPrompt';
import { KeyHints } from './KeyHints';
import { SettingsStoreProvider } from '../state/SettingsStoreContext';
import { createSettingsStore } from '../state/settingsStore';
import { createDefaultSettings } from '../persistence/settingsSchema';
import { PauseMenu } from '../pause/PauseMenu';

const strings = loadUiStrings('vi');
const caseDefinition = loadCaseDefinition('case-001');

describe('ObjectivePanel', () => {
  it('shows heading and objective text', () => {
    const store = createGameStore({ caseDefinition });
    const html = renderToString(
      <GameStoreProvider store={store}>
        <ObjectivePanel strings={strings} />
      </GameStoreProvider>,
    );
    expect(html).toContain(strings.objectiveHeading);
    expect(html).toContain(caseDefinition.objectives[0]?.text);
    expect(html).toContain('hud-objective-marker');
    expect(html).toContain('hud-objective-clip');
  });
});

describe('CaseProgress', () => {
  it('shows 0/5 with caseFile label', () => {
    const store = createGameStore({ caseDefinition });
    const html = renderToString(
      <GameStoreProvider store={store}>
        <CaseProgress strings={strings} />
      </GameStoreProvider>,
    );
    expect(html).toContain(strings.caseFile);
    expect(html).toContain(`0/${caseDefinition.evidenceTotal}`);
    expect(html).toContain('hud-case-badge');
    expect(html).toContain('<svg');
  });
});

describe('InteractionPrompt', () => {
  it('renders nothing when nearby is null', () => {
    const store = createGameStore({ caseDefinition });
    const html = renderToString(
      <GameStoreProvider store={store}>
        <InteractionPrompt strings={strings} />
      </GameStoreProvider>,
    );
    expect(html).toBe('');
  });

  it('shows [E] and prompt when nearby', () => {
    // renderToString uses zustand's getInitialState() as the server snapshot, so the
    // "nearby" value must be present in the store's initial state, not set afterwards.
    const store = createStore<GameStoreState>((set) => ({
      ...createGameStore({ caseDefinition }).getState(),
      nearby: { id: 'objective_note', prompt: 'Đọc ghi chú' },
      setNearby(n) {
        set({ nearby: n });
      },
    }));
    const html = renderToString(
      <GameStoreProvider store={store}>
        <InteractionPrompt strings={strings} />
      </GameStoreProvider>,
    );
    expect(html).toContain('E');
    expect(html).toContain('Đọc ghi chú');
    expect(html).toContain('role="status"');
    // No anchor published yet: the fixed bottom-centre prompt, not the anchored bubble.
    expect(html).toContain('hud-interaction-prompt');
    expect(html).not.toContain('hud-interaction-bubble');
  });
});

describe('KeyHints', () => {
  it('lists WASD, E, J, M and Esc with labels', () => {
    const html = renderToString(<GameStoreProvider store={createGameStore({ caseDefinition })}><KeyHints strings={strings} /></GameStoreProvider>);
    expect(html).toContain('WASD');
    expect(html).toContain(strings.move);
    expect(html).toContain('E');
    expect(html).toContain('Esc');
    expect(html).toContain('J');
    expect(html).toContain(strings.interact);
    expect(html).toContain(strings.pause);
    expect(html).toContain('>M<');
    expect(html).toContain(strings.toggleMap);
    expect(html.match(/<button type="button" class="hud-key-hint/g)).toHaveLength(3);
  });
});

describe('PauseMenu', () => {
  it('is a modal dialog with resume button', () => {
    const html = renderToString(
      <SettingsStoreProvider
        store={createSettingsStore(createDefaultSettings({ prefersReducedMotion: false }))}
      >
        <PauseMenu strings={strings} onResume={() => {}} />
      </SettingsStoreProvider>,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain(strings.paused);
    expect(html).toContain(strings.resume);
  });
});
