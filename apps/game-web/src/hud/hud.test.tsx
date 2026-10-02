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
import { readFileSync } from 'node:fs';
import { CoachNote } from '../onboarding/CoachNote';

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
    expect(html).toContain('hud-objective-panel');
    expect(html).toContain('paper-sheet--torn');
    expect(html).toContain('paper-clip');
  });

  it('draws the heading in the display font', () => {
    const css = readFileSync(new URL('./hud.css', import.meta.url), 'utf8');
    expect(css).toMatch(
      /\.hud-objective-heading\s*\{[^}]*font-family:\s*var\(--lexicon-font-display\)/,
    );
  });

  it('collapses to a folded paper tab labelled with the heading, not a minus box', () => {
    const store = createStore<GameStoreState>(() => ({
      ...createGameStore({ caseDefinition }).getState(),
      objectiveVisible: false,
    }));
    const html = renderToString(
      <GameStoreProvider store={store}>
        <ObjectivePanel strings={strings} />
      </GameStoreProvider>,
    );
    expect(html).toContain('hud-panel-launcher');
    expect(html).toContain(strings.objectiveHeading);
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('−');
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
    expect(html).toContain('index-tab');
    expect(html).toContain('hud-case-progress-count');
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
  const render = (overrides: Partial<GameStoreState> = {}) => {
    const store = createStore<GameStoreState>(() => ({
      ...createGameStore({ caseDefinition }).getState(),
      ...overrides,
    }));
    return renderToString(
      <GameStoreProvider store={store}>
        <KeyHints strings={strings} />
      </GameStoreProvider>,
    );
  };

  it('lists E, J, B, M and Esc in order, with no movement hint', () => {
    const html = render();
    const keys = [...html.matchAll(/<kbd class="keycap">([^<]+)<\/kbd>/g)].map((m) => m[1]);
    expect(keys).toEqual(['E', 'J', 'B', 'M', 'Esc']);
    expect(html).not.toContain('WASD');
    expect(html).toContain(strings.interact);
    expect(html).toContain(strings.openNotebook);
    expect(html).toContain(strings.openDeductionBoard);
    expect(html).toContain(strings.toggleMap);
    expect(html).toContain(strings.pause);
    expect(html).toContain('hud-key-hints');
  });

  it('dims E when nothing is nearby and undims it when something is', () => {
    expect(render()).toContain('key-hint--dimmed');
    const near = render({ nearby: { id: 'objective_note', prompt: 'Đọc ghi chú' } });
    expect(near).not.toContain('key-hint--dimmed');
  });

  it('makes J, B, M and Esc buttons and leaves E as text', () => {
    const html = render();
    expect(html.match(/<button/g)).toHaveLength(4);
  });

  it('disables the buttons while input is locked', () => {
    expect(render({ inputLocked: true }).match(/disabled=""/g)).toHaveLength(4);
  });
});

describe('reduced motion', () => {
  it('levels tilted paper when the in-game setting is on', () => {
    const css = readFileSync(new URL('./hud.css', import.meta.url), 'utf8');
    expect(css).toMatch(
      /\.game-root\[data-reduced-motion='true'\]\s+\.paper-sheet\s*\{[^}]*--paper-tilt:\s*0deg/,
    );
  });
});

describe('CoachNote', () => {
  it('is a handwritten paper note', () => {
    const html = renderToString(
      <CoachNote strings={strings} noteId="move" onDismiss={() => undefined} />,
    );
    expect(html).toContain('coach-note');
    expect(html).toContain('paper-sheet');
    const css = readFileSync(new URL('../onboarding/coach.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.coach-note[^{]*\{[^}]*font-family:\s*var\(--lexicon-font-hand\)/);
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

it('provides a B shortcut button for the separate deduction board', () => {
  const store = createGameStore({ caseDefinition });
  const html = renderToString(
    <GameStoreProvider store={store}>
      <KeyHints strings={strings} />
    </GameStoreProvider>,
  );
  expect(html).toContain(strings.openDeductionBoard);
  expect(html).toContain('>B<');
});
