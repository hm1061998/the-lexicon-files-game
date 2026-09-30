import { renderToString } from 'react-dom/server';
import { createStore } from 'zustand/vanilla';
import { describe, expect, it } from 'vitest';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { GameStoreProvider } from '../state/GameStoreContext';
import { createGameStore, type GameStoreState } from '../state/gameStore';
import { Minimap } from './Minimap';
import { handleMinimapShortcut } from './useMinimapShortcut';
import { buildMinimapModel } from './minimapModel';

const strings = loadUiStrings('vi');
const caseDefinition = loadCaseDefinition('case-001');

function render(overrides: Partial<GameStoreState>): string {
  // renderToString reads the store's initial state, so overrides go into creation.
  const store = createStore<GameStoreState>(() => ({
    ...createGameStore({ caseDefinition }).getState(),
    ...overrides,
  }));
  return renderToString(
    <GameStoreProvider store={store}>
      <Minimap strings={strings} />
    </GameStoreProvider>,
  );
}

describe('Minimap', () => {
  const scene = caseDefinition.scenes[0]!;
  const model = buildMinimapModel(scene, null);

  it('draws one element per solid and marker, with a localized label', () => {
    const html = render({});
    expect(html).toContain(strings.minimapTitle);
    expect(html.match(/class="minimap-solid"/g)).toHaveLength(model.solids.length);
    expect(html.match(/class="minimap-marker/g)).toHaveLength(model.markers.length);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label=');
    expect(html).not.toContain('minimap-player');
  });

  it('draws inner partitions and a text-free dot per room label', () => {
    const html = render({});
    expect(model.partitions.length).toBeGreaterThan(0);
    expect(html.match(/class="minimap-partition"/g)).toHaveLength(model.partitions.length);
    expect(html.match(/class="minimap-room"/g)).toHaveLength(model.labels.length);
    for (const label of scene.labels ?? []) expect(html).not.toContain(label.text);
  });

  it('uses a diamond floor polygon for dimetric scenes', () => {
    const html = render({});
    expect(html).toContain('<polygon class="minimap-floor"');
    expect(html).not.toContain('<rect class="minimap-floor"');
  });

  it('draws the player once a position is published', () => {
    expect(render({ playerPosition: { x: 400, y: 500 } })).toContain('minimap-player');
  });

  it('announces the room nearest to the player in the map accessible name', () => {
    const label = caseDefinition.scenes[0]!.labels![0]!;
    expect('u' in label).toBe(true);
    const html = render({
      playerPosition: {
        x: 'u' in label ? label.u : 0,
        y: 'v' in label ? label.v : 0,
        coordinateSpace: 'logical',
      },
    });
    expect(html).toContain(`aria-label="${strings.minimapTitle} — ${label.text}"`);
  });

  it('renders nothing while hidden', () => {
    expect(render({ minimapVisible: false })).toBe('');
  });
});

describe('handleMinimapShortcut', () => {
  const body = { tagName: 'BODY' } as unknown as Element;
  const input = { tagName: 'INPUT' } as unknown as Element;
  const textarea = { tagName: 'TEXTAREA' } as unknown as Element;
  const editable = { tagName: 'DIV', isContentEditable: true } as unknown as Element;
  const press = (key: string, target: Element) => ({
    key,
    target,
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
  });

  it('M hides and shows the minimap', () => {
    const store = createGameStore({ caseDefinition });
    const event = press('m', body);
    handleMinimapShortcut(store, event);
    expect(store.getState().minimapVisible).toBe(false);
    expect(event.prevented).toBe(true);
    handleMinimapShortcut(store, press('m', body));
    expect(store.getState().minimapVisible).toBe(true);
  });

  it.each([input, textarea, editable])('ignores M in typing targets', (target) => {
    const store = createGameStore({ caseDefinition });
    handleMinimapShortcut(store, press('m', target));
    expect(store.getState().minimapVisible).toBe(true);
  });

  it('is locked while paused, in a modal, or after the case closes', () => {
    const paused = createGameStore({ caseDefinition });
    paused.getState().togglePause();
    handleMinimapShortcut(paused, press('m', body));
    expect(paused.getState().minimapVisible).toBe(true);

    const notebook = createGameStore({ caseDefinition });
    notebook.getState().toggleNotebook();
    handleMinimapShortcut(notebook, press('m', body));
    expect(notebook.getState().minimapVisible).toBe(true);

    const evidence = createGameStore({ caseDefinition });
    evidence.getState().openEvidence('meeting_minutes');
    handleMinimapShortcut(evidence, press('m', body));
    expect(evidence.getState().minimapVisible).toBe(true);
  });
});
