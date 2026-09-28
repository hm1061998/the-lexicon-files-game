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
  });
});

describe('KeyHints', () => {
  it('lists E, J and Esc with labels', () => {
    const html = renderToString(<KeyHints strings={strings} />);
    expect(html).toContain('E');
    expect(html).toContain('Esc');
    expect(html).toContain('J');
    expect(html).toContain(strings.interact);
    expect(html).toContain(strings.pause);
    expect(html.match(/class="hud-key-hint"/g)).toHaveLength(3);
  });
});

describe('PauseMenu', () => {
  it('is a modal dialog with resume button', () => {
    const html = renderToString(<PauseMenu strings={strings} onResume={() => {}} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain(strings.paused);
    expect(html).toContain(strings.resume);
  });
});
